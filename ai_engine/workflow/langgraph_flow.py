import os
import sys
import json
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

# To fix import path issues
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from ai_engine.workflow.state import ShoppingState

# Initialize the global LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# Load product catalog once at startup
_CATALOG_PATH = os.path.join(os.path.dirname(__file__), '../../data/products/products.json')
try:
    with open(_CATALOG_PATH, 'r') as f:
        PRODUCT_CATALOG = json.load(f)
    CATALOG_SUMMARY = json.dumps([
        {"id": p["id"], "name": p["name"], "price": p["price"], "tags": p["tags"]}
        for p in PRODUCT_CATALOG
    ])
except Exception:
    PRODUCT_CATALOG = []
    CATALOG_SUMMARY = "[]"

# ----------------- PYDANTIC SCHEMAS -----------------
class IntentOutput(BaseModel):
    intent: str = Field(description="The primary shopping intent (e.g., 'hosting_party', 'baking_cake', 'sick_emergency', 'movie_night', 'grocery_replenishment')")
    complexity: str = Field(description="low / medium / high — how many items this intent likely needs (low=1-3, medium=3-5, high=5-7)")
    explanation: str = Field(description="Brief explanation of why this intent and complexity was chosen")

class ContextOutput(BaseModel):
    weather: str = Field(description="Simulated weather conditions relevant to the intent")
    time_of_day: str = Field(description="Simulated time of day relevant to the intent")
    explanation: str = Field(description="Brief explanation of contextual injection")

class ConsumptionOutput(BaseModel):
    predictions: List[str] = Field(description="List of 2-3 specific product names the user historically buys in this scenario")
    explanation: str = Field(description="Brief explanation of consumption predictions")

class InventoryOutput(BaseModel):
    status: List[str] = Field(description="List of 1-2 items the user is currently out of at home, relevant to the intent")
    explanation: str = Field(description="Brief explanation of inventory status")

class GraphOutput(BaseModel):
    knowledge: List[str] = Field(description="List of 2 semantic product associations (e.g. 'Chips pair well with Soda')")
    explanation: str = Field(description="Brief explanation of knowledge graph traversal")

class CartItemModel(BaseModel):
    id: str = Field(description="Product ID from the catalog (e.g. P001), or a generated ID if not in catalog")
    name: str = Field(description="Exact product name — prefer names from the provided catalog")
    price: float = Field(description="Realistic price — use the catalog price if available")
    quantity: int = Field(description="Quantity needed")
    image_url: str = Field(description="Mock image URL, e.g. '/assets/chips.png' or similar")
    reasoning: str = Field(description="1 short sentence explaining why this specific item was chosen")

class CartOutput(BaseModel):
    items: List[CartItemModel] = Field(description="Between 3 and 7 final recommended products combining all signals. Match count to complexity: low=3, medium=4-5, high=6-7.")

class ExplainabilityOutput(BaseModel):
    bullets: List[str] = Field(description="Exactly 3 bullet points summarizing the AI's reasoning pipeline")

# ----------------- AGENT NODES -----------------

def intent_agent(state: ShoppingState) -> Dict:
    prompt = f"""Analyze this user message and determine their shopping intent and complexity.
    User message: '{state['message']}'
    Complexity guide: low=single focused request (1-3 items needed), medium=meal/activity for a few people, high=party/event for many people.
    """
    structured_llm = llm.with_structured_output(IntentOutput)
    res = structured_llm.invoke(prompt)

    return {
        "intent": res.intent,
        "complexity": res.complexity,
        "explainability": state.get("explainability", []) + [f"[Intent Agent]: {res.explanation}"]
    }

# --- Parallel agents (all run after intent, independently) ---

def context_agent(state: ShoppingState) -> Dict:
    prompt = f"Given the intent '{state['intent']}', generate a realistic weather and time context that would affect their shopping."
    structured_llm = llm.with_structured_output(ContextOutput)
    res = structured_llm.invoke(prompt)

    return {
        "context": {"weather": res.weather, "time": res.time_of_day},
        "explainability": state.get("explainability", []) + [f"[Context Agent]: {res.explanation}"]
    }

def consumption_agent(state: ShoppingState) -> Dict:
    prompt = f"Given intent '{state['intent']}', predict 2-3 products the user historically buys for this scenario."
    structured_llm = llm.with_structured_output(ConsumptionOutput)
    res = structured_llm.invoke(prompt)

    return {
        "consumption_predictions": res.predictions,
        "explainability": state.get("explainability", []) + [f"[Consumption Agent]: {res.explanation}"]
    }

def inventory_agent(state: ShoppingState) -> Dict:
    prompt = f"Given intent '{state['intent']}', what 1-2 items is a typical user likely missing at home for this scenario?"
    structured_llm = llm.with_structured_output(InventoryOutput)
    res = structured_llm.invoke(prompt)

    return {
        "inventory_status": res.status,
        "explainability": state.get("explainability", []) + [f"[Inventory Agent]: {res.explanation}"]
    }

def graph_agent(state: ShoppingState) -> Dict:
    prompt = f"Act as a product knowledge graph. Given intent '{state['intent']}', output 2 semantic product associations (e.g. 'Pasta pairs well with marinara sauce')."
    structured_llm = llm.with_structured_output(GraphOutput)
    res = structured_llm.invoke(prompt)

    return {
        "graph_knowledge": res.knowledge,
        "explainability": state.get("explainability", []) + [f"[Graph Agent]: {res.explanation}"]
    }

def cart_agent(state: ShoppingState) -> Dict:
    complexity = state.get("complexity", "medium")
    count_guide = {"low": "3 items", "medium": "4 to 5 items", "high": "6 to 7 items"}.get(complexity, "4 to 5 items")

    prompt = f"""You are a smart shopping cart AI. Build a final shopping cart of {count_guide}.

CRITICAL RULE: The user's original message and intent MUST be the primary driver of the cart.
Do NOT let contextual signals override the explicit user request.

User's original message: "{state['message']}"
Intent: {state['intent']}
Complexity: {complexity} (build {count_guide})

Supporting signals (use to ENHANCE, not OVERRIDE the intent):
- Context: {state.get('context')}
- Consumption History: {state.get('consumption_predictions')}
- Inventory Missing: {state.get('inventory_status')}
- Graph Associations: {state.get('graph_knowledge')}

PRODUCT CATALOG (prefer items from this list — use exact IDs and prices):
{CATALOG_SUMMARY}

Build {count_guide} that DIRECTLY fulfill "{state['message']}".
Prefer products from the catalog. If needed, supplement with additional products not in the catalog.
"""
    structured_llm = llm.with_structured_output(CartOutput)
    res = structured_llm.invoke(prompt)

    items_dict = [item.dict() for item in res.items]

    return {
        "items": items_dict,
        "explainability": state.get("explainability", []) + ["[Cart Agent]: Synthesized all signals into final cart using product catalog."]
    }

def explainability_agent(state: ShoppingState) -> Dict:
    prompt = f"""Summarize the AI reasoning process in exactly 3 bullet points for the user interface.
    Cart items chosen: {[i['name'] for i in state['items']]}
    Raw logs: {state['explainability']}
    Make the bullets clear, non-technical, and customer-friendly.
    """
    structured_llm = llm.with_structured_output(ExplainabilityOutput)
    res = structured_llm.invoke(prompt)

    # Overwrite the explainability array with the final clean bullets
    return {
        "explainability": res.bullets
    }

# ----------------- GRAPH COMPILATION -----------------
# Parallel architecture: intent runs first, then context/consumption/inventory/graph all run
# in parallel (fan-out), then cart synthesizes all results, then explainability.

workflow = StateGraph(ShoppingState)

workflow.add_node("intent", intent_agent)
workflow.add_node("context", context_agent)
workflow.add_node("consumption", consumption_agent)
workflow.add_node("inventory", inventory_agent)
workflow.add_node("graph", graph_agent)
workflow.add_node("cart", cart_agent)
workflow.add_node("explainability", explainability_agent)

workflow.set_entry_point("intent")

# Fan-out: all 4 enrichment agents run in PARALLEL after intent
workflow.add_edge("intent", "context")
workflow.add_edge("intent", "consumption")
workflow.add_edge("intent", "inventory")
workflow.add_edge("intent", "graph")

# Fan-in: cart runs after all 4 enrichment agents complete
workflow.add_edge("context", "cart")
workflow.add_edge("consumption", "cart")
workflow.add_edge("inventory", "cart")
workflow.add_edge("graph", "cart")

workflow.add_edge("cart", "explainability")
workflow.add_edge("explainability", END)

app_graph = workflow.compile()

def process_message(message: str) -> Dict[str, Any]:
    initial_state = {
        "message": message,
        "intent": None,
        "complexity": "medium",
        "context": {},
        "consumption_predictions": [],
        "inventory_status": [],
        "graph_knowledge": [],
        "items": [],
        "explainability": []
    }
    final_state = app_graph.invoke(initial_state)
    return final_state
