# Data Schema

## 1. LLM Output Schema (`SingleShotOutput`)
The single grounded GPT-4o call returns one strict structured object
(`ai_engine/workflow/langgraph_flow.py`). There is **one** schema, not seven —
the model produces intent, complexity, cart items, and explainability in a
single pass.

```python
class CartItemModel(BaseModel):
    id: str            # catalog product ID, e.g. "P016"
    name: str          # overwritten with catalog name in post-processing
    price_usd: float   # overwritten with catalog price in post-processing
    quantity: int
    image_url: str
    reasoning: str

class SingleShotOutput(BaseModel):
    intent: str                          # e.g. "movie_night", "sick_emergency"
    complexity: str                      # low | medium | high
    items: List[CartItemModel]           # 3–7 products
    explainability_bullets: List[str]    # exactly 3 customer-friendly reasons
```

> The LLM only *chooses* product IDs. After the call, a post-processor pins every
> `name` and `price` to the catalog (`CATALOG_BY_ID`) — the anti-hallucination guard.

## 2. FastAPI Request / Response Schema
The API contract between Next.js and FastAPI (`backend/main.py`).

```python
class MessageRequest(BaseModel):
    message: str
    budget: Optional[float] = None        # INR
    people_count: Optional[int] = 1
    user_id: Optional[str] = None         # real purchase-history lookup

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    image_url: str
    reasoning: Optional[str] = None
    original_price: Optional[float] = None
    savings: Optional[float] = 0.0
    is_smart_saver: Optional[bool] = False

class SmartCartResponse(BaseModel):
    intent: str
    context: Dict[str, str]
    items: List[CartItem]
    explainability: List[str]
    total_cost: Optional[float] = 0.0
    total_savings: Optional[float] = 0.0
    processing_time_ms: Optional[int] = None
    personalised: Optional[bool] = False
```

## 3. Product Graph (in-process, deterministic)
The association graph is built from the catalog at import time — no LLM, no DB.
Exported adjacency list lives at `neo4j/product_graph.json`.

```python
adjacency: Dict[str, Dict[str, float]]   # product_id -> {neighbor_id: weight}
# weight = shared-tag count + complementary-category bonus
```
