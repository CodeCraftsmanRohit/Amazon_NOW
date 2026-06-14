import os
import sys
import json
import time
import asyncio
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from ai_engine.workflow.state import ShoppingState
from ai_engine.agents.graph_agent.graph_query import PRODUCT_GRAPH, extract_keywords

# ── Models ────────────────────────────────────────────────────────────────────
# Lightweight enrichment agents use the fast/cheap model; the cart synthesis —
# the only step where quality really matters — uses the stronger model.
FAST_MODEL = "gpt-4o-mini"
CART_MODEL = "gpt-4o"

# Clients are created lazily so the module can be imported (and its pure helpers
# unit-tested) without an API key present.
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

# ── Load product catalog ──────────────────────────────────────────────────────
_CATALOG_PATH = os.path.join(os.path.dirname(__file__), '../../data/products/products.json')
try:
    with open(_CATALOG_PATH, 'r') as f:
        PRODUCT_CATALOG: List[Dict] = json.load(f)
except Exception:
    PRODUCT_CATALOG = []

# Build catalog index for fast lookup
CATALOG_BY_ID: Dict[str, Dict] = {p["id"]: p for p in PRODUCT_CATALOG}

# Build the LLM-facing catalog string (includes smart saver hints)
def _build_catalog_summary(budget_inr: Optional[float] = None) -> str:
    rows = []
    for p in PRODUCT_CATALOG:
        expiry = p.get("expiry_days", 9999)
        disc   = p.get("discount_percentage", 0)
        is_ss  = expiry < 30 and disc > 0
        price_usd = p["price"]
        if is_ss:
            price_usd = round(price_usd * (1 - disc / 100), 2)

        row = {
            "id":   p["id"],
            "name": p["name"],
            "price_usd": price_usd,
            "tags": p["tags"],
        }
        if is_ss:
            row["smart_saver"] = True
            row["discount_pct"] = disc
            row["expiry_days"] = expiry
        rows.append(row)
    return json.dumps(rows)

CATALOG_SUMMARY = _build_catalog_summary()


# ── Pure helpers (unit-testable, no LLM / network) ────────────────────────────

def cart_total_usd(items: List[Dict]) -> float:
    """Total USD cost of a list of cart-item dicts."""
    return sum(i["price"] * i["quantity"] for i in items)


def fit_cart_to_budget(items: List[Dict], budget_inr: Optional[float],
                       usd_to_inr: float = 83.5, min_items: int = 3) -> List[Dict]:
    """
    Fit a cart within an INR budget without gutting variety:
      1) reduce quantities of the priciest lines first (down to 1 each),
      2) only then drop the most expensive items,
      3) never go below `min_items` (or the original count if smaller).
    Mutates and returns the same list.
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

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class IntentOutput(BaseModel):
    intent:      str = Field(description="Primary shopping intent (e.g. 'hosting_party', 'baking_cake', 'sick_emergency', 'movie_night')")
    complexity:  str = Field(description="low / medium / high — how many items this intent needs (low=1-3, medium=3-5, high=5-7)")
    explanation: str = Field(description="Brief explanation of intent and complexity")

class ContextOutput(BaseModel):
    weather:     str = Field(description="Simulated weather relevant to the intent")
    time_of_day: str = Field(description="Simulated time of day relevant to the intent")
    explanation: str = Field(description="Brief explanation of contextual injection")

class ConsumptionOutput(BaseModel):
    predictions: List[str] = Field(description="2-3 specific product names the user historically buys in this scenario")
    explanation: str = Field(description="Brief explanation of consumption predictions")

class InventoryOutput(BaseModel):
    status:      List[str] = Field(description="1-2 items the user is likely out of at home")
    explanation: str = Field(description="Brief explanation of inventory status")

class CartItemModel(BaseModel):
    id:        str   = Field(description="Product ID from the catalog (e.g. P001)")
    name:      str   = Field(description="Exact product name — must match catalog")
    price_usd: float = Field(description="Use the catalog price_usd (already discounted for smart_saver items)")
    quantity:  int   = Field(description="Quantity for ONE person — will be scaled by people_count later")
    image_url: str   = Field(description="Mock image URL, e.g. '/assets/item.png'")
    reasoning: str   = Field(description="1 short sentence explaining why this item was chosen")

class CartOutput(BaseModel):
    items: List[CartItemModel] = Field(
        description="3-7 recommended products. Count matches complexity: low=3, medium=4-5, high=6-7."
    )
    explainability_bullets: List[str] = Field(
        description="Exactly 3 short, customer-friendly bullet points summarising why this cart was built this way."
    )

# ── Agent nodes (async for true parallel fan-out) ─────────────────────────────

async def intent_agent(state: ShoppingState) -> Dict:
    prompt = f"""Analyze this user message and determine their shopping intent and complexity.
User message: '{state["message"]}'
Complexity: low=single need (1-3 items), medium=meal/activity for few people, high=party/event for many."""
    res = await get_fast_llm().with_structured_output(IntentOutput).ainvoke(prompt)
    return {
        "intent":     res.intent,
        "complexity": res.complexity,
        "explainability": [f"[Intent]: {res.explanation}"],
    }

# ── Parallel enrichment agents (run concurrently after intent) ────────────────

async def context_agent(state: ShoppingState) -> Dict:
    res = await get_fast_llm().with_structured_output(ContextOutput).ainvoke(
        f"Given intent '{state['intent']}', generate realistic weather and time context."
    )
    return {
        "context": {"weather": res.weather, "time": res.time_of_day},
        "explainability": [f"[Context]: {res.explanation}"],
    }

async def consumption_agent(state: ShoppingState) -> Dict:
    res = await get_fast_llm().with_structured_output(ConsumptionOutput).ainvoke(
        f"Given intent '{state['intent']}', predict 2-3 products the user historically buys."
    )
    return {
        "consumption_predictions": res.predictions,
        "explainability": [f"[Consumption]: {res.explanation}"],
    }

async def inventory_agent(state: ShoppingState) -> Dict:
    res = await get_fast_llm().with_structured_output(InventoryOutput).ainvoke(
        f"Given intent '{state['intent']}', what 1-2 items is the user likely out of at home?"
    )
    return {
        "inventory_status": res.status,
        "explainability": [f"[Inventory]: {res.explanation}"],
    }

async def graph_agent(state: ShoppingState) -> Dict:
    """
    REAL graph traversal — no LLM call. Pulls complementary product
    associations from the in-process product knowledge graph.
    """
    keywords = extract_keywords(f"{state.get('message', '')} {state.get('intent', '')}")
    result = PRODUCT_GRAPH.associations_for(keywords, max_assoc=4)
    associations = result["associations"]
    related_names = [PRODUCT_GRAPH.by_id[pid]["name"]
                     for pid in result["related_product_ids"]
                     if pid in PRODUCT_GRAPH.by_id]
    explanation = (
        f"Traversed product graph from {len(result['seed_product_ids'])} seed item(s); "
        f"found {len(associations)} real complementary association(s)."
        if associations else "No strong graph associations for this intent."
    )
    return {
        "graph_knowledge": associations or related_names,
        "explainability": [f"[Graph]: {explanation}"],
    }

# ── Cart agent (budget + people_count + smart saver + explainability) ─────────

async def cart_agent(state: ShoppingState) -> Dict:
    complexity   = state.get("complexity", "medium")
    budget_inr   = state.get("budget")      # INR or None
    people_count = state.get("people_count", 1) or 1
    count_guide  = {"low": "3 items", "medium": "4 to 5 items", "high": "6 to 7 items"}.get(complexity, "4 to 5 items")

    budget_clause = (
        f"\nBUDGET CONSTRAINT: Total cart cost MUST stay under ₹{budget_inr:.0f} INR (1 USD ≈ ₹83.5). "
        f"Prioritise cheaper or smart_saver items if needed to fit the budget."
        if budget_inr else ""
    )
    people_clause = (
        f"\nPEOPLE COUNT: This is for {people_count} people. Recommend quantities suitable for 1 person — "
        "the system will multiply by people_count automatically."
        if people_count > 1 else ""
    )

    prompt = f"""You are a smart shopping cart AI. Build a final cart of {count_guide}.

USER MESSAGE: "{state['message']}"
INTENT: {state['intent']}
COMPLEXITY: {complexity} → build {count_guide}{budget_clause}{people_clause}

Supporting signals (enhance, don't override intent):
- Context: {state.get('context')}
- Consumption history: {state.get('consumption_predictions')}
- Missing at home: {state.get('inventory_status')}
- Product graph associations (REAL co-purchase pairs): {state.get('graph_knowledge')}

PRODUCT CATALOG (use exact IDs and price_usd — smart_saver items are already discounted):
{CATALOG_SUMMARY}

RULES:
1. The user's message is the primary driver.
2. Use the product graph associations to add complementary items (e.g. pasta -> sauce).
3. Prefer smart_saver=true items when they match the intent (great deals for the customer).
4. Use catalog price_usd as given (already includes discount for smart_saver items).
5. Return {count_guide} items using catalog products where possible.
6. Also return exactly 3 short, friendly explainability bullets summarising the cart.
"""
    res = await get_cart_llm().with_structured_output(CartOutput).ainvoke(prompt)

    # ── Post-process: apply Smart Saver metadata + people_count scaling ──────
    final_items = []
    total_cost_usd    = 0.0
    total_savings_usd = 0.0

    for item in res.items:
        catalog_entry = CATALOG_BY_ID.get(item.id, {})
        expiry = catalog_entry.get("expiry_days", 9999)
        disc   = catalog_entry.get("discount_percentage", 0)
        is_ss  = expiry < 30 and disc > 0

        original_price_usd = catalog_entry.get("price", item.price_usd)
        discounted_price   = round(original_price_usd * (1 - disc / 100), 2) if is_ss else item.price_usd
        savings_per_unit   = round(original_price_usd - discounted_price, 2) if is_ss else 0.0

        scaled_qty = max(1, round(item.quantity * people_count)) if people_count > 1 else item.quantity

        total_cost_usd    += discounted_price * scaled_qty
        total_savings_usd += savings_per_unit * scaled_qty

        final_items.append({
            "id":             item.id,
            "name":           item.name,
            "price":          discounted_price,
            "quantity":       scaled_qty,
            "image_url":      item.image_url,
            "reasoning":      item.reasoning,
            "original_price": original_price_usd if is_ss else None,
            "savings":        savings_per_unit,
            "is_smart_saver": is_ss,
        })

    # If budget is set, fit the cart to budget WITHOUT gutting variety.
    if budget_inr:
        final_items = fit_cart_to_budget(final_items, budget_inr)
        total_cost_usd    = cart_total_usd(final_items)
        total_savings_usd = sum(i["savings"] * i["quantity"]
                                for i in final_items if i.get("is_smart_saver"))

    ss_count = sum(1 for i in final_items if i.get("is_smart_saver"))
    exp_note = f" {ss_count} Smart Saver deal(s) applied 🏷️." if ss_count else ""
    ppl_note = f" Quantities scaled for {people_count} people." if people_count > 1 else ""
    bgt_note = f" Cart kept within ₹{budget_inr:.0f} budget." if budget_inr else ""

    # Explainability bullets come from the same call (no extra round trip).
    bullets = list(res.explainability_bullets or [])
    if total_savings_usd > 0:
        bullets.append(f"You're saving ${total_savings_usd:.2f} with Smart Saver deals on near-expiry items.")

    return {
        "items":          final_items,
        "total_cost":     round(total_cost_usd, 2),
        "total_savings":  round(total_savings_usd, 2),
        "explainability": [f"[Cart]: Cart built with {len(final_items)} items.{exp_note}{ppl_note}{bgt_note}"],
        "explainability_summary": bullets[:4],
    }

# ── Graph wiring ──────────────────────────────────────────────────────────────

workflow = StateGraph(ShoppingState)
workflow.add_node("intent",         intent_agent)
workflow.add_node("context",        context_agent)
workflow.add_node("consumption",    consumption_agent)
workflow.add_node("inventory",      inventory_agent)
workflow.add_node("graph",          graph_agent)
workflow.add_node("cart",           cart_agent)

workflow.set_entry_point("intent")

# Fan-out: 4 enrichment agents run in parallel after intent (async => concurrent)
workflow.add_edge("intent",      "context")
workflow.add_edge("intent",      "consumption")
workflow.add_edge("intent",      "inventory")
workflow.add_edge("intent",      "graph")

# Fan-in: cart synthesises all signals + emits explainability
workflow.add_edge("context",     "cart")
workflow.add_edge("consumption", "cart")
workflow.add_edge("inventory",   "cart")
workflow.add_edge("graph",       "cart")

workflow.add_edge("cart", END)

app_graph = workflow.compile()

# ── Public entry points ───────────────────────────────────────────────────────

def _initial_state(message: str, budget: Optional[float], people_count: int) -> Dict[str, Any]:
    return {
        "message":               message,
        "intent":                None,
        "complexity":            "medium",
        "budget":                budget,
        "people_count":          people_count,
        "context":               {},
        "consumption_predictions": [],
        "inventory_status":      [],
        "graph_knowledge":       [],
        "items":                 [],
        "total_cost":            0.0,
        "total_savings":         0.0,
        "explainability":        [],
        "explainability_summary": [],
    }


async def aprocess_message(
    message:      str,
    budget:       Optional[float] = None,   # INR
    people_count: int = 1,
) -> Dict[str, Any]:
    """Async entry point — enrichment agents run concurrently."""
    start = time.perf_counter()
    result = await app_graph.ainvoke(_initial_state(message, budget, people_count))
    result["processing_time_ms"] = round((time.perf_counter() - start) * 1000)
    return result


def process_message(
    message:      str,
    budget:       Optional[float] = None,   # INR
    people_count: int = 1,
) -> Dict[str, Any]:
    """Sync wrapper for callers that aren't async."""
    return asyncio.run(aprocess_message(message, budget, people_count))
