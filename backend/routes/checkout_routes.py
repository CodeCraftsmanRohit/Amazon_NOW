"""
Checkout Routes
API endpoints for order placement and tracking.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.controllers.checkout_controller import place_order, get_order_status

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


class PlaceOrderRequest(BaseModel):
    cart_items: List[Dict[str, Any]]
    user_context: Dict[str, str] = {}


@router.post("/place")
async def place_order_endpoint(req: PlaceOrderRequest):
    """
    Place an order for the given cart items.
    Returns order ID, total, and estimated delivery time.
    """
    result = place_order(req.cart_items, req.user_context)
    return result


@router.get("/status/{order_id}")
async def order_status_endpoint(order_id: str):
    """Get the real-time delivery status of an order."""
    return get_order_status(order_id)
