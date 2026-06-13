import os
import sys
import json
from typing import Dict, Any, List, Optional
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from ai_engine.workflow.state import ShoppingState

llm = ChatOpenAI(model="gpt-4o", temperature=0)

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

class GraphOutput(BaseModel):
    knowledge:   List[str] = Field(description="2 semantic product associations (e.g. 'Pasta pairs well with marinara sauce')")
    explanation: str = Field(description="Brief explanation of knowledge graph traversal")

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

class ExplainabilityOutput(BaseModel):
    bullets: List[str] = Field(description="Exactly 3 customer-friendly bullet points summarising the AI reasoning")

# ── Agent nodes ───────────────────────────────────────────────────────────────

def intent_agent(state: ShoppingState) -> Dict:
    prompt = f"""Analyze this user message and determine their shopping intent and complexity.
User message: '{state["message"]}'
Complexity: low=single need (1-3 items), medium=meal/activity for few people, high=party/event for many."""
    res = llm.with_structured_output(IntentOutput).invoke(prompt)
    return {
        "intent":     res.intent,
        "complexity": res.complexity,
        "explainability": [f"[Intent]: {res.explanation}"],
    }

# ── Parallel agents ───────────────────────────────────────────────────────────

def context_agent(state: ShoppingState) -> Dict:
    res = llm.with_structured_output(ContextOutput).invoke(
        f"Given intent '{state['intent']}', generate realistic weather and time context."
    )
    return {
        "context": {"weather": res.weather, "time": res.time_of_day},
        "explainability": [f"[Context]: {res.explanation}"],
    }

def consumption_agent(state: ShoppingState) -> Dict:
    res = llm.with_structured_output(ConsumptionOutput).invoke(
        f"Given intent '{state['intent']}', predict 2-3 products the user historically buys."
    )
    return {
        "consumption_predictions": res.predictions,
        "explainability": [f"[Consumption]: {res.explanation}"],
    }

def inventory_agent(state: ShoppingState) -> Dict:
    res = llm.with_structured_output(InventoryOutput).invoke(
        f"Given intent '{state['intent']}', what 1-2 items is the user likely out of at home?"
    )
    return {
        "inventory_status": res.status,
        "explainability": [f"[Inventory]: {res.explanation}"],
    }

def graph_agent(state: ShoppingState) -> Dict:
    res = llm.with_structured_output(GraphOutput).invoke(
        f"Product knowledge graph: given intent '{state['intent']}', output 2 semantic product associations."
    )
    return {
        "graph_knowledge": res.knowledge,
        "explainability": [f"[Graph]: {res.explanation}"],
    }

# ── Cart agent (with budget + people_count + smart saver) ────────────────────

def cart_agent(state: ShoppingState) -> Dict:
    complexity   = state.get("complexity", "medium")
    budget_inr   = state.get("budget")      # INR or None
    people_count = state.get("people_count", 1) or 1
    count_guide  = {"low": "3 items", "medium": "4 to 5 items", "high": "6 to 7 items"}.get(complexity, "4 to 5 items")

    # Rebuild catalog summary (same CATALOG_SUMMARY works — discounts already applied)
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
- Product associations: {state.get('graph_knowledge')}

PRODUCT CATALOG (use exact IDs and price_usd — smart_saver items are already discounted):
{CATALOG_SUMMARY}

RULES:
1. The user's message is the primary driver.
2. Prefer smart_saver=true items when they match the intent (great deals for the customer).
3. Use catalog price_usd as given (already includes discount for smart_saver items).
4. Return {count_guide} items using catalog products where possible.
"""
    res = llm.with_structured_output(CartOutput).invoke(prompt)

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

    # If budget is set, trim items that bust the budget (greedy from cheapest)
    if budget_inr:
        budget_usd = budget_inr / 83.5
        running = 0.0
        kept = []
        for itm in sorted(final_items, key=lambda x: x["price"]):
            if running + itm["price"] * itm["quantity"] <= budget_usd:
                running += itm["price"] * itm["quantity"]
                kept.append(itm)
        if kept:
            final_items      = kept
            total_cost_usd   = running
            total_savings_usd = sum(i["savings"] * i["quantity"] for i in kept if i.get("is_smart_saver"))

    ss_count = sum(1 for i in final_items if i.get("is_smart_saver"))
    exp_note = f" {ss_count} Smart Saver deal(s) applied 🏷️." if ss_count else ""
    ppl_note = f" Quantities scaled for {people_count} people." if people_count > 1 else ""
    bgt_note = f" Cart kept within ₹{budget_inr:.0f} budget." if budget_inr else ""

    return {
        "items":          final_items,
        "total_cost":     round(total_cost_usd, 2),
        "total_savings":  round(total_savings_usd, 2),
        "explainability": [f"[Cart]: Cart built with {len(final_items)} items.{exp_note}{ppl_note}{bgt_note}"],
    }

# ── Explainability agent ──────────────────────────────────────────────────────

def explainability_agent(state: ShoppingState) -> Dict:
    savings_note = (
        f" Total savings: ${state.get('total_savings', 0):.2f} (Smart Saver deals)."
        if state.get("total_savings", 0) > 0 else ""
    )
    prompt = f"""Summarise the AI reasoning in exactly 3 customer-friendly bullet points.
Cart items: {[i['name'] for i in state['items']]}
Raw logs: {state['explainability']}{savings_note}
Make bullets clear, concise, non-technical. Mention Smart Saver savings if applicable."""
    res = llm.with_structured_output(ExplainabilityOutput).invoke(prompt)
    return {"explainability_summary": res.bullets}

# ── Graph wiring ──────────────────────────────────────────────────────────────

workflow = StateGraph(ShoppingState)
workflow.add_node("intent",         intent_agent)
workflow.add_node("context",        context_agent)
workflow.add_node("consumption",    consumption_agent)
workflow.add_node("inventory",      inventory_agent)
workflow.add_node("graph",          graph_agent)
workflow.add_node("cart",           cart_agent)
workflow.add_node("explainability", explainability_agent)

workflow.set_entry_point("intent")

# Fan-out: 4 enrichment agents run in parallel after intent
workflow.add_edge("intent",      "context")
workflow.add_edge("intent",      "consumption")
workflow.add_edge("intent",      "inventory")
workflow.add_edge("intent",      "graph")

# Fan-in: cart synthesises all signals
workflow.add_edge("context",     "cart")
workflow.add_edge("consumption", "cart")
workflow.add_edge("inventory",   "cart")
workflow.add_edge("graph",       "cart")

workflow.add_edge("cart",           "explainability")
workflow.add_edge("explainability", END)

app_graph = workflow.compile()

# ── Public entry point ────────────────────────────────────────────────────────

def process_message(
    message:      str,
    budget:       Optional[float] = None,   # INR
    people_count: int = 1,
) -> Dict[str, Any]:
    initial_state: Dict[str, Any] = {
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
    return app_graph.invoke(initial_state)
