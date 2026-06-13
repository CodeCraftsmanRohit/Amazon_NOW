# Data Schema

## 1. LangGraph State Schema (`ShoppingState`)
The central state object passed between agents.

```python
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
    context: Dict[str, str]
    consumption_predictions: List[str]
    inventory_status: List[str]
    graph_knowledge: List[str]
    items: List[CartItem]
    explainability: List[str]
```

## 2. FastAPI Request/Response Schema
The API contract between Next.js and FastAPI.

```python
class MessageRequest(BaseModel):
    message: str

class SmartCartResponse(BaseModel):
    intent: str
    context: Dict[str, str]
    items: List[CartItem]
    explainability: List[str]
```

## 3. Pydantic LLM Output Schemas
Used by `with_structured_output` to force GPT-4o to return strict JSON.

- `IntentOutput`: {intent: str, explanation: str}
- `ContextOutput`: {weather: str, time_of_day: str, explanation: str}
- `ConsumptionOutput`: {predictions: List[str], explanation: str}
- `InventoryOutput`: {status: List[str], explanation: str}
- `GraphOutput`: {knowledge: List[str], explanation: str}
- `CartOutput`: {items: List[CartItemModel]}
- `ExplainabilityOutput`: {bullets: List[str]}
