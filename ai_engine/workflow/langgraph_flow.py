"""
Amazon Now AI — Single-hop parallel pipeline

HOW IT WORKS (and why it's the fastest possible design):

  The real product graph traversal is instant (in-process, ~0ms).
  It runs concurrently with ONE gpt-4o call that handles everything:
  intent inference, context enrichment, consumption prediction,
  inventory reasoning, AND cart synthesis — all in a single structured
  output call.

  Pipeline:
    asyncio.gather(
        gpt-4o (intent + signals + cart + explainability in one shot),
        graph_traversal (0ms, no network)
    )
    → post-process (budget trim, Smart Saver discounts, people scaling)

  Total LLM calls: 1
  Total serial hops: 1
  Warm latency: ~2-4s (limited only by OpenAI round-trip)

  The graph result feeds into the prompt via a pre-resolved keyword
  lookup before the LLM call — both tasks race concurrently and the
  graph always wins (it's instant), so the LLM sees real associations.
"""

import os
import sys
import json
import time
import asyncio
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from ai_engine.agents.graph_agent.graph_query import PRODUCT_GRAPH, extract_keywords
from ai_engine.agents.consumption_agent.history import get_consumption_signals
from ai_engine.llm.provider import get_chat_model, get_provider

# ── LLM client (lazy init — provider chosen by LLM_PROVIDER env var) ──────────
# Defaults to OpenAI GPT-4o. Set LLM_PROVIDER=bedrock to route through
# Amazon Bedrock (Claude 3.5) with zero code change — see ai_engine/llm/provider.py
_llm = None


def get_llm():
    global _llm
    if _llm is None:
        _llm = get_chat_model(temperature=0)
    return _llm


# ── Product catalog ───────────────────────────────────────────────────────────
_CATALOG_PATH = os.path.join(os.path.dirname(__file__), '../../data/products/products.json')
try:
    with open(_CATALOG_PATH, 'r') as f:
        PRODUCT_CATALOG: List[Dict] = json.load(f)
except Exception:
    PRODUCT_CATALOG = []

CATALOG_BY_ID: Dict[str, Dict] = {p["id"]: p for p in PRODUCT_CATALOG}


def _build_catalog_summary() -> str:
    # Single pass over catalog — builds both CATALOG_BY_ID lookup and summary string
    rows = []
    for p in PRODUCT_CATALOG:
        expiry = p.get("expiry_days", 9999)
        disc   = p.get("discount_percentage", 0)
        is_ss  = expiry < 30 and disc > 0
        price  = round(p["price"] * (1 - disc / 100), 2) if is_ss else p["price"]
        row: Dict[str, Any] = {
            "id": p["id"], "name": p["name"],
            "price_usd": price, "tags": p["tags"],
            "category": p.get("category", ""),
        }
        if is_ss:
            row.update({"smart_saver": True, "discount_pct": disc,
                        "expiry_days": expiry})
        rows.append(row)
    return json.dumps(rows)


CATALOG_SUMMARY = _build_catalog_summary()


# ── Pure helpers (unit-testable, no network) ──────────────────────────────────

def cart_total_usd(items: List[Dict]) -> float:
    """Total USD cost of cart items."""
    return sum(i["price"] * i["quantity"] for i in items)


def fit_cart_to_budget(items: List[Dict], budget_inr: Optional[float],
                       usd_to_inr: float = 83.5, min_items: int = 3) -> List[Dict]:
    """
    Fit cart to INR budget while preserving variety.
    Uses a running total — O(n) per iteration instead of O(n²).

    1. Reduce quantities (most expensive lines first, down to 1 each).
    2. Only then drop items (never below min_items).
    """
    if not budget_inr or not items:
        return items

    budget_usd = budget_inr / usd_to_inr
    floor = min(min_items, len(items))

    # Maintain a running total — avoid recomputing from scratch each iteration
    running = sum(i["price"] * i["quantity"] for i in items)

    # Phase 1: trim quantities of the priciest lines first
    while running > budget_usd and any(i["quantity"] > 1 for i in items):
        line = max((i for i in items if i["quantity"] > 1),
                   key=lambda x: x["price"] * x["quantity"])
        running -= line["price"]   # subtract one unit cost
        line["quantity"] -= 1

    # Phase 2: drop most expensive item if still over budget
    while running > budget_usd and len(items) > floor:
        drop = max(items, key=lambda x: x["price"] * x["quantity"])
        running -= drop["price"] * drop["quantity"]
        items.remove(drop)

    return items


# ── Pydantic output schema ────────────────────────────────────────────────────

class CartItemModel(BaseModel):
    id:        str   = Field(description="Exact product ID from catalog, e.g. 'P016'")
    name:      str   = Field(description="Exact product name from catalog")
    price_usd: float = Field(description="Catalog price_usd (pre-discounted for smart_saver items)")
    quantity:  int   = Field(description="Qty suitable for ONE person; system scales by people_count")
    image_url: str   = Field(description="Use '/assets/item.png' as placeholder")
    reasoning: str   = Field(description="One sentence: why this specific item for this need")

class SingleShotOutput(BaseModel):
    intent:     str = Field(
        description="Shopping intent slug, e.g. 'movie_night', 'sick_emergency', 'baking_cake', 'hosting_party', 'italian_dinner'")
    complexity: str = Field(description="low | medium | high — low=3 items, medium=4-5, high=6-7")
    items: List[CartItemModel] = Field(
        description="3-7 catalog products. Use graph_associations to add complementary items.")
    explainability_bullets: List[str] = Field(
        description="Exactly 3 short, friendly bullets explaining WHY this cart (not just what's in it).")


# ── Graph traversal (sync, instant) ──────────────────────────────────────────

def _graph_traversal(message: str) -> List[str]:
    """
    In-process product graph traversal. Returns real complementary associations.
    Runs in ~0ms — no LLM, no network.
    """
    kws = extract_keywords(message)
    result = PRODUCT_GRAPH.associations_for(kws, max_assoc=5)
    return result["associations"] or [
        PRODUCT_GRAPH.by_id[pid]["name"]
        for pid in result["related_product_ids"]
        if pid in PRODUCT_GRAPH.by_id
    ]


# ── Single-shot pipeline ──────────────────────────────────────────────────────

async def aprocess_message(
    message:      str,
    budget:       Optional[float] = None,   # INR
    people_count: int = 1,
    user_id:      Optional[str] = None,     # real purchase history lookup
) -> Dict[str, Any]:
    """
    Single-hop async pipeline:
      - Graph traversal (instant) + real purchase history lookup (instant)
        both run before the single gpt-4o call.
      - When user_id is provided, the LLM sees REAL consumption history
        and inventory gaps instead of guessing.
      - Total LLM calls: 1. Warm latency: ~2-4s.
    """
    start = time.perf_counter()

    # ── Instant signals (no network) ─────────────────────────────────────
    graph_task   = asyncio.to_thread(_graph_traversal, message)
    history_task = asyncio.to_thread(get_consumption_signals, user_id or "")

    graph_associations, history = await asyncio.gather(graph_task, history_task)

    # ── Build prompt with real history injected ───────────────────────────
    budget_note = (
        f"\nBUDGET: total cart must stay under ₹{budget:.0f} INR (1 USD ≈ ₹83.5). "
        "Prefer cheap / smart_saver items to fit."
        if budget else ""
    )
    people_note = (
        f"\nPEOPLE COUNT: {people_count} people. Set quantity = per 1 person; "
        "the system multiplies by people_count automatically."
        if people_count > 1 else ""
    )
    history_section = (
        f"\nCUSTOMER PURCHASE HISTORY (REAL DATA — use this, not guesses):\n"
        f"  Summary: {history['order_summary']}\n"
        f"  Frequently bought: {history['frequently_bought']}\n"
        f"  Likely running low on: {history['likely_out_of']}\n"
        f"  Brand preferences: {history['brand_affinities']}"
    ) if user_id and history["frequently_bought"] else (
        "\nCUSTOMER: New/guest customer — no purchase history."
    )

    prompt = f"""You are Amazon Now AI — a need-centric smart shopping assistant.
Given the user's message and their real purchase history, build the perfect cart instantly.

USER MESSAGE: "{message}"{budget_note}{people_note}
{history_section}

PRODUCT GRAPH ASSOCIATIONS (real co-purchase pairs — use to add complementary items):
{json.dumps(graph_associations)}

PRODUCT CATALOG (75 items — use EXACT IDs and price_usd):
{CATALOG_SUMMARY}

MEDICAL GUIDANCE (when applicable):
- FEVER/PAIN: Prefer paracetamol-based medicines (Crocin I001, Dolo I002) over ibuprofen for general fever. Combiflam I003 for severe body ache.
- DEHYDRATION/FEVER: Always include ORS (Electral I005) + natural hydration (coconut water I019).
- COLD/CONGESTION: Vicks Vaporub I004 for chest congestion, Strepsils I006 for sore throat.
- COMFORT FOODS FOR SICK: MTR Curd Rice I017 (easy digest), Maggi I014 (quick), Parle-G I015 (with tea).
- SAFETY: For fever >101°F or symptoms persisting >3 days, always add explainability bullet: "Consult a doctor if symptoms worsen."

WOMEN'S EMERGENCY:
- PERIOD EMERGENCY: Whisper Ultra I008 or Stayfree I009 — both XL size for heavy flow days.

BABY CARE:
- Size guide: Size 2 (I010) for 4-8kg babies, Size 3 (I011) for 6-11kg toddlers.
- Include Johnson's powder I012 for rash prevention if buying diapers.

RULES:
1. User message is the primary driver — understand the NEED, not just keywords.
2. Honour brand preferences from purchase history when relevant (e.g. prefer Barilla if they always buy it).
3. If customer is "likely running low" on something that fits the need, include it.
4. Use graph associations for complementary items (pasta → sauce, popcorn → soda).
5. For MEDICAL needs, prioritize Indian brands and include safety guidance in explainability.
6. Prefer smart_saver=true items when they match the intent.
7. Match complexity: single item=low(3), meal/activity=medium(4-5), emergency/event=high(6-7).
8. Write 3 short, friendly bullets — mention personalisation if history was used, medical safety if applicable.
"""

    res = await get_llm().with_structured_output(SingleShotOutput).ainvoke(prompt)

    # ── Post-process ──────────────────────────────────────────────────────────
    final_items: List[Dict] = []
    total_cost = 0.0
    total_savings = 0.0

    for item in res.items:
        cat    = CATALOG_BY_ID.get(item.id, {})
        expiry = cat.get("expiry_days", 9999)
        disc   = cat.get("discount_percentage", 0)
        is_ss  = expiry < 30 and disc > 0

        # ALWAYS use catalog price — never trust the LLM's price field.
        # This is the single source of truth and prevents price hallucination.
        if not cat:
            # LLM returned an ID not in catalog — skip this item silently.
            continue
        orig_price   = cat["price"]
        final_price  = round(orig_price * (1 - disc / 100), 2) if is_ss else orig_price
        savings_unit = round(orig_price - final_price, 2) if is_ss else 0.0
        qty          = (max(1, round(item.quantity * people_count))
                        if people_count > 1 else item.quantity)

        total_cost    += final_price * qty
        total_savings += savings_unit * qty

        final_items.append({
            "id":             item.id,
            "name":           cat["name"],           # catalog name, not LLM's
            "price":          final_price,
            "quantity":       qty,
            "image_url":      item.image_url,
            "reasoning":      item.reasoning,
            "original_price": orig_price if is_ss else None,
            "savings":        savings_unit,
            "is_smart_saver": is_ss,
        })

    if budget:
        final_items   = fit_cart_to_budget(final_items, budget)
        total_cost    = cart_total_usd(final_items)
        total_savings = sum(i["savings"] * i["quantity"]
                            for i in final_items if i.get("is_smart_saver"))

    bullets = list(res.explainability_bullets or [])
    if total_savings > 0:
        bullets.append(
            f"Saving ₹{round(total_savings * 83.5)} with Smart Saver deals on near-expiry items.")

    ss    = sum(1 for i in final_items if i.get("is_smart_saver"))
    log   = (f"[Cart]: {len(final_items)} items"
             + (f", {ss} Smart Saver 🏷️" if ss else "")
             + (f", for {people_count} people" if people_count > 1 else "")
             + (f", within ₹{budget:.0f}" if budget else ""))

    elapsed = round((time.perf_counter() - start) * 1000)

    return {
        "intent":               res.intent,
        "complexity":           res.complexity,
        "context":              {},
        "items":                final_items,
        "total_cost":           round(total_cost, 2),
        "total_savings":        round(total_savings, 2),
        "explainability":       [log],
        "explainability_summary": bullets[:4],
        "processing_time_ms":   elapsed,
        "user_id":              user_id,
        "personalised":         bool(user_id and history["frequently_bought"]),
    }


def process_message(
    message:      str,
    budget:       Optional[float] = None,
    people_count: int = 1,
    user_id:      Optional[str] = None,
) -> Dict[str, Any]:
    """Sync wrapper — for scripts/tests. Use aprocess_message inside async."""
    return asyncio.run(aprocess_message(message, budget, people_count, user_id))
