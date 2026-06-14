"""
Cart Controller
Handles shopping cart operations — add, update, remove, and smart cart generation.
The smart cart is built by the LangGraph AI pipeline in ai_engine/workflow/langgraph_flow.py.
"""

from typing import List, Dict, Any
from ai_engine.workflow.langgraph_flow import aprocess_message


async def build_smart_cart(message: str) -> Dict[str, Any]:
    """
    Invoke the parallel LangGraph pipeline to build a smart cart
    from a natural language user message.
    """
    result = await aprocess_message(message)
    return result


def add_item_to_cart(cart: List[Dict], item: Dict) -> List[Dict]:
    """Add an item to the cart or increment quantity if already present."""
    for existing in cart:
        if existing["id"] == item["id"]:
            existing["quantity"] += item.get("quantity", 1)
            return cart
    cart.append(item)
    return cart


def remove_item_from_cart(cart: List[Dict], item_id: str) -> List[Dict]:
    """Remove an item from the cart by ID."""
    return [item for item in cart if item["id"] != item_id]


def calculate_total(cart: List[Dict]) -> float:
    """Calculate the total price of items in the cart."""
    return round(sum(item["price"] * item.get("quantity", 1) for item in cart), 2)
