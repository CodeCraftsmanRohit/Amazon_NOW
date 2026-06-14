"""
Cart Routes
API endpoints for cart management and smart cart generation.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.controllers.cart_controller import (
    build_smart_cart,
    add_item_to_cart,
    remove_item_from_cart,
    calculate_total,
)

router = APIRouter(prefix="/api/cart", tags=["cart"])


class SmartCartRequest(BaseModel):
    message: str


class CartItemRequest(BaseModel):
    id: str
    name: str
    price: float
    quantity: int = 1
    image_url: str = "/assets/item.png"
    reasoning: Optional[str] = None


class CartUpdateRequest(BaseModel):
    cart: List[Dict[str, Any]]
    item: CartItemRequest


class CartRemoveRequest(BaseModel):
    cart: List[Dict[str, Any]]
    item_id: str


@router.post("/smart")
async def smart_cart_endpoint(req: SmartCartRequest):
    """Build a smart cart using the single-shot AI pipeline."""
    result = await build_smart_cart(req.message)
    return result


@router.post("/add")
async def add_to_cart(req: CartUpdateRequest):
    """Add an item to the cart."""
    updated_cart = add_item_to_cart(req.cart, req.item.dict())
    return {
        "cart": updated_cart,
        "total": calculate_total(updated_cart),
        "item_count": len(updated_cart),
    }


@router.post("/remove")
async def remove_from_cart(req: CartRemoveRequest):
    """Remove an item from the cart."""
    updated_cart = remove_item_from_cart(req.cart, req.item_id)
    return {
        "cart": updated_cart,
        "total": calculate_total(updated_cart),
        "item_count": len(updated_cart),
    }


@router.post("/total")
async def get_cart_total(cart: List[Dict[str, Any]]):
    """Calculate the cart total."""
    return {"total": calculate_total(cart)}
