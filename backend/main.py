import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn

# ─── Models ──────────────────────────────────────────────────────────────────

class MessageRequest(BaseModel):
    message:      str
    budget:       Optional[float] = None   # INR — None means no limit
    people_count: Optional[int]   = 1

class CartItem(BaseModel):
    id:             str
    name:           str
    price:          float           # discounted price
    quantity:       int
    image_url:      str
    reasoning:      Optional[str]  = None
    original_price: Optional[float] = None  # pre-discount
    savings:        Optional[float] = 0.0   # per-unit saving
    is_smart_saver: Optional[bool]  = False

class SmartCartResponse(BaseModel):
    intent:        str
    context:       Dict[str, str]
    items:         List[CartItem]
    explainability: List[str]
    total_cost:    Optional[float] = 0.0
    total_savings: Optional[float] = 0.0

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Amazon Now AI — Backend API",
    description="7-Agent parallel LangGraph pipeline with budget constraints and Smart Saver deals.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Core imports ─────────────────────────────────────────────────────────────

from ai_engine.workflow.langgraph_flow import process_message
from backend.services.inventory_service import analyze_inventory_image

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "Amazon Now AI", "version": "2.0.0"}


@app.post("/api/chat", response_model=SmartCartResponse, tags=["ai"])
async def chat_interaction(req: MessageRequest):
    """
    Primary endpoint: natural language → 7-agent parallel LangGraph pipeline.
    Supports optional budget (INR) and people_count for scaling.
    Smart Saver deals applied automatically for near-expiry catalog items.
    """
    result = process_message(
        message=req.message,
        budget=req.budget,
        people_count=req.people_count or 1,
    )
    items = [
        CartItem(
            id=i["id"],
            name=i["name"],
            price=i["price"],
            quantity=i["quantity"],
            image_url=i["image_url"],
            reasoning=i.get("reasoning"),
            original_price=i.get("original_price"),
            savings=i.get("savings", 0.0),
            is_smart_saver=i.get("is_smart_saver", False),
        )
        for i in result.get("items", [])
    ]
    return SmartCartResponse(
        intent=result.get("intent", "unknown"),
        context=result.get("context", {}),
        items=items,
        explainability=result.get("explainability_summary", []),
        total_cost=result.get("total_cost", 0.0),
        total_savings=result.get("total_savings", 0.0),
    )


@app.post("/api/inventory/upload", response_model=SmartCartResponse, tags=["vision"])
async def upload_inventory_photo(file: UploadFile = File(...)):
    """
    Vision endpoint: upload fridge/pantry photo → GPT-4o Vision → replenishment cart.
    """
    contents = await file.read()
    result = await analyze_inventory_image(contents)
    items = [
        CartItem(
            id=i["id"], name=i["name"], price=i["price"],
            quantity=i["quantity"], image_url=i["image_url"],
            reasoning=i.get("reasoning"),
        )
        for i in result.get("items", [])
    ]
    return SmartCartResponse(
        intent=result.get("intent", "inventory_replenishment"),
        context=result.get("context", {}),
        items=items,
        explainability=result.get("explainability", []),
    )

# ─── Additional routers ───────────────────────────────────────────────────────

from backend.routes.cart_routes import router as cart_router
from backend.routes.checkout_routes import router as checkout_router
from backend.routes.recommendation_routes import router as recommendation_router

app.include_router(cart_router)
app.include_router(checkout_router)
app.include_router(recommendation_router)

# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
