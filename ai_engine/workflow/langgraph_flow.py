"""
Amazon Now AI — LangGraph pipeline (2-hop parallel architecture)

HOW IT WORKS (and why it's fast):
  Old design: Intent → (Context | Consumption | Inventory | Graph) → Cart
              = 3 serial hops, 6 LLM calls

  New design: (Intent + Context + Consumption + Inventory + Graph) → Cart
              = 2 serial hops, 2 LLM calls total
              All enrichment fires in ONE asyncio.gather call.
              Graph Agent is a real in-process traversal (0ms, no LLM).

Serial hops:
  Hop 1: asyncio.gather(intent_llm, context_llm, consumption_llm,
                        inventory_llm, graph_traversal)  <- all concurrent
  Hop 2: cart_llm(all signals combined)

Measured: ~3-5s warm, ~6-10s cold start (first request imports LangChain).
Cold start is mitigated by the startup pre-warmer in main.py.
"""

import os
import sys
import json
import time
import asyncio
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from ai_engine.workflow.state import ShoppingState
from ai_engine.agents.graph_agent.graph_query import PRODUCT_GRAPH, extract_keywords

# ── Models ─────────────────────────────────────────────────────────────────
FAST_MODEL = "gpt-4o-mini"
CART_MODEL = "gpt-4o"

_fast_llm: Optional[ChatOpenAI] = None
_cart_llm: Optional[ChatOpenAI] = None


def get_fast_llm() -> ChatOpenAI:
    global _fast_llm
    if _fast_llm is None:
        _fast_llm = ChatOpenAI(model=FAST_MODEL, temperature=0)
    return _fast_llm


def get_cart_llm() -> ChatOpenAI:
    global _cart_llm
    if _cart_llm is None:
        _cart_llm = ChatOpenAI(model=CART_MODEL, temperature=0)
    return _cart_llm


# ── Product catalog ─────────────────────────────────────────────────────────
_CATALOG_PATH = os.path.join(os.path.dirname(__file__), '../../data/products/products.json')
try:
    with open(_CATALOG_PATH, 'r') as f:
        PRODUCT_CATALOG: List[Dict] = json.load(f)
except Exception:
    PRODUCT_CATALOG = []

CATALOG_BY_ID: Dict[str, Dict] = {p["id"]: p for p in PRODUCT_CATALOG}


def _build_catalog_summary() -> str:
    rows = []
    for p in PRODUCT_CATALOG:
        expiry = p.get("expiry_days", 9999)
        disc   = p.get("discount_percentage", 0)
        is_ss  = expiry < 30 and disc > 0
        price  = round(p["price"] * (1 - disc / 100), 2) if is_ss else p["price"]
        row: Dict[str, Any] = {"id": p["id"], "name": p["name"],
                                "price_usd": price, "tags": p["tags"]}
        if is_ss:
            row.update({"smart_saver": True, "discount_pct": disc,
                        "expiry_days": expiry})
        rows.append(row)
    return json.dumps(rows)


CATALOG_SUMMARY = _build_catalog_summary()


# ── Pure helpers (unit-testable, no network) ─────────────────────────────────

def cart_total_usd(items: List[Dict]) -> float:
    return sum(i["price"] * i["quantity"] for i in items)


def fit_cart_to_budget(items: List[Dict], budget_inr: Optional[float],
                       usd_to_inr: float = 83.5, min_items: int = 3) -> List[Dict]:
    """
    Fit cart to budget: reduce quantities first, then drop items.
    Never drops below min_items (preserves variety).
    """
    if not budget_inr or not items:
        return items
    budget_usd = budget_inr / usd_to_inr
    floor = min(min_items, len(items))

    while cart_total_usd(items) > budget_usd and any(i["quantity"] > 1 for i in items):
        line = max((i for i in items if i["quantity"] > 1),
                   key=lambda x: x["price"] * x["quantity"])
        line["quantity"] -= 1

    while cart_total_usd(items) > budget_usd and len(items) > floor:
        drop = max(items, key=lambda x: x["price"] * x["quantity"])
        items.remove(drop)

    return items


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class IntentSignal(BaseModel):
    intent:     str = Field(description="Primary shopping intent slug, e.g. 'movie_night', 'sick_emergency', 'baking_cake', 'hosting_party'")
    complexity: str = Field(description="low / medium / high: low=1-3 items, medium=4-5, high=6-7")
    context_weather: str = Field(description="Realistic weather for this intent and time of year in India")
    context_time:    str = Field(description="Realistic time of day for this intent")
    consumption_predictions: List[str] = Field(description="2-3 product names this customer likely buys for this intent based on past behaviour")
    inventory_gaps:          List[str] = Field(description="1-2 items this customer is probably out of at home given this intent")

class CartItemModel(BaseModel):
    id:        str   = Field(description="Product ID from catalog, e.g. P016")
    name:      str   = Field(description="Exact product name from catalog")
    price_usd: float = Field(description="Catalog price_usd (already discounted for smart_saver items)")
    quantity:  int   = Field(description="Qty per person — system scales by people_count")
    image_url: str   = Field(description="Use '/assets/item.png' as placeholder")
    reasoning: str   = Field(description="One sentence: why this item for this need")

class CartOutput(BaseModel):
    items: List[CartItemModel] = Field(
        description="3-7 products matching the intent. low=3, medium=4-5, high=6-7.")
    explainability_bullets: List[str] = Field(
        description="Exactly 3 short customer-friendly bullets explaining the cart.")


# ── Core pipeline (2 hops) ────────────────────────────────────────────────────

async def _hop1_gather_signals(message: str) -> Dict:
    """
    HOP 1: Fire intent + context + consumption + inventory as ONE LLM call,
    PLUS the real graph traversal — all concurrent via asyncio.gather.

    The single structured-output schema bundles everything the cart needs
    from a 'reasoning' perspective into one gpt-4o-mini call.
    """
    intent_prompt = (
        f"User message: '{message}'\n"
        "Extract intent, complexity, and contextual signals as specified."
    )

    # Graph traversal is instant (in-process, no network).
    def _graph_sync(msg: str) -> Dict:
        kws = extract_keywords(msg)
        result = PRODUCT_GRAPH.associations_for(kws, max_assoc=4)
        names = [PRODUCT_GRAPH.by_id[pid]["name"]
                 for pid in result["related_product_ids"]
                 if pid in PRODUCT_GRAPH.by_id]
        return {
            "associations": result["associations"] or names,
            "seed_count":   len(result["seed_product_ids"]),
        }

    # Run LLM call and graph traversal concurrently.
    llm_coro = get_fast_llm().with_structured_output(IntentSignal).ainvoke(intent_prompt)
    graph_coro = asyncio.to_thread(_graph_sync, message)

    signals, graph_result = await asyncio.gather(llm_coro, graph_coro)

    return {
        "intent":                  signals.intent,
        "complexity":              signals.complexity,
        "context":                 {"weather": signals.context_weather,
                                    "time":    signals.context_time},
        "consumption_predictions": signals.consumption_predictions,
        "inventory_status":        signals.inventory_gaps,
        "graph_knowledge":         graph_result["associations"],
        "_graph_seeds":            graph_result["seed_count"],
    }


async def _hop2_build_cart(message: str, signals: Dict,
                           budget_inr: Optional[float],
                           people_count: int) -> Dict:
    """
    HOP 2: Single gpt-4o call to synthesise all signals into a final cart.
    """
    complexity   = signals.get("complexity", "medium")
    count_guide  = {"low": "3 items", "medium": "4 to 5 items",
                    "high": "6 to 7 items"}.get(complexity, "4 to 5 items")
    budget_note  = (
        f"\nBUDGET: keep total under ₹{budget_inr:.0f} INR (1 USD ≈ ₹83.5). "
        "Prefer cheaper / smart_saver items."
        if budget_inr else ""
    )
    people_note  = (
        f"\nPEOPLE: for {people_count} people. Qty = per-person; system will scale."
        if people_count > 1 else ""
    )

    prompt = f"""You are a smart shopping cart AI. Build {count_guide}.

USER NEED: "{message}"
INTENT: {signals['intent']}  COMPLEXITY: {complexity}{budget_note}{people_note}

Signals gathered by parallel agents:
- Weather/time context: {signals['context']}
- Consumption history:  {signals['consumption_predictions']}
- Inventory gaps:       {signals['inventory_status']}
- Graph associations (REAL co-purchase pairs, use to add complementary items):
  {signals['graph_knowledge']}

PRODUCT CATALOG (use exact IDs, smart_saver items are pre-discounted):
{CATALOG_SUMMARY}

RULES:
1. User message is primary. Graph associations add complementary items (pasta→sauce).
2. Prefer smart_saver=true items when relevant.
3. Return {count_guide} items with exact catalog IDs.
4. Write exactly 3 short, friendly explainability bullets.
"""
    res = await get_cart_llm().with_structured_output(CartOutput).ainvoke(prompt)

    # Post-process: apply Smart Saver discounts + people_count scaling
    final_items: List[Dict] = []
    total_cost = 0.0
    total_savings = 0.0

    for item in res.items:
        cat = CATALOG_BY_ID.get(item.id, {})
        expiry = cat.get("expiry_days", 9999)
        disc   = cat.get("discount_percentage", 0)
        is_ss  = expiry < 30 and disc > 0

        orig_price   = cat.get("price", item.price_usd)
        final_price  = round(orig_price * (1 - disc / 100), 2) if is_ss else item.price_usd
        savings_unit = round(orig_price - final_price, 2) if is_ss else 0.0
        qty          = max(1, round(item.quantity * people_count)) if people_count > 1 else item.quantity

        total_cost    += final_price * qty
        total_savings += savings_unit * qty

        final_items.append({
            "id":             item.id,
            "name":           item.name,
            "price":          final_price,
            "quantity":       qty,
            "image_url":      item.image_url,
            "reasoning":      item.reasoning,
            "original_price": orig_price if is_ss else None,
            "savings":        savings_unit,
            "is_smart_saver": is_ss,
        })

    if budget_inr:
        final_items   = fit_cart_to_budget(final_items, budget_inr)
        total_cost    = cart_total_usd(final_items)
        total_savings = sum(i["savings"] * i["quantity"]
                            for i in final_items if i.get("is_smart_saver"))

    bullets = list(res.explainability_bullets or [])
    if total_savings > 0:
        bullets.append(
            f"You're saving ${total_savings:.2f} with Smart Saver deals on near-expiry items.")

    ss = sum(1 for i in final_items if i.get("is_smart_saver"))
    log = (f"[Cart]: {len(final_items)} items"
           + (f", {ss} Smart Saver 🏷️" if ss else "")
           + (f", scaled for {people_count} people" if people_count > 1 else "")
           + (f", within ₹{budget_inr:.0f}" if budget_inr else ""))

    return {
        "items":          final_items,
        "total_cost":     round(total_cost, 2),
        "total_savings":  round(total_savings, 2),
        "explainability": [log],
        "explainability_summary": bullets[:4],
        "context":        signals.get("context", {}),
        "intent":         signals.get("intent", "unknown"),
    }


# ── Public entry points ───────────────────────────────────────────────────────

async def aprocess_message(
    message:      str,
    budget:       Optional[float] = None,
    people_count: int = 1,
) -> Dict[str, Any]:
    """
    2-hop async pipeline:
      Hop 1: intent + context + consumption + inventory + graph (all concurrent)
      Hop 2: cart synthesis
    """
    start = time.perf_counter()
    signals = await _hop1_gather_signals(message)
    result  = await _hop2_build_cart(message, signals, budget, people_count)
    result["processing_time_ms"] = round((time.perf_counter() - start) * 1000)
    return result


def process_message(
    message:      str,
    budget:       Optional[float] = None,
    people_count: int = 1,
) -> Dict[str, Any]:
    """Sync wrapper — use aprocess_message inside async contexts."""
    return asyncio.run(aprocess_message(message, budget, people_count))
