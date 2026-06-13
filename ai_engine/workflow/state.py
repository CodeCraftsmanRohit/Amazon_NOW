from typing import TypedDict, List, Dict, Optional, Annotated
import operator

class CartItem(TypedDict):
    id: str
    name: str
    price: float
    quantity: int
    image_url: str
    reasoning: Optional[str]

class ShoppingState(TypedDict):
    message: str
    intent: Optional[str]
    complexity: str          # "low" | "medium" | "high"
    context: Dict[str, str]
    consumption_predictions: List[str]
    inventory_status: List[str]
    graph_knowledge: List[str]
    items: List[CartItem]
    explainability: Annotated[List[str], operator.add]
    explainability_summary: List[str]
