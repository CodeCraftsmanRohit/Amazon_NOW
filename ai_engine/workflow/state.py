from typing import TypedDict, List, Dict, Optional, Annotated
import operator

class CartItem(TypedDict):
    id: str
    name: str
    price: float          # discounted price (after smart saver)
    quantity: int
    image_url: str
    reasoning: Optional[str]
    original_price: Optional[float]   # pre-discount price
    savings: Optional[float]          # savings per unit
    is_smart_saver: Optional[bool]    # True if near-expiry deal

class ShoppingState(TypedDict):
    message: str
    intent: Optional[str]
    complexity: str           # "low" | "medium" | "high"
    budget: Optional[float]   # INR — None means no limit
    people_count: int          # 1 by default
    context: Dict[str, str]
    consumption_predictions: List[str]
    inventory_status: List[str]
    graph_knowledge: List[str]
    items: List[CartItem]
    total_cost: float
    total_savings: float
    explainability: Annotated[List[str], operator.add]
    explainability_summary: List[str]
