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
    message: str

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    image_url: str
    reasoning: Optional[str] = None

class SmartCartResponse(BaseModel):
    intent: str
    context: Dict[str, str]
    items: List[CartItem]
    explainability: List[str]

# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Amazon Now AI — Backend API",
    description="7-Agent LangGraph pipeline for need-centric quick commerce.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Core routes ─────────────────────────────────────────────────────────────

from ai_engine.workflow.langgraph_flow import process_message
from backend.services.inventory_service import analyze_inventory_image

@app.get("/", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "Amazon Now AI", "version": "1.0.0"}

@app.post("/api/chat", response_model=SmartCartResponse, tags=["ai"])
async def chat_interaction(req: MessageRequest):
    """
    Primary endpoint: accepts a natural language message, runs the 7-agent
    LangGraph pipeline (parallel execution), and returns a SmartCartResponse.
    """
    result = process_message(req.message)
    mapped_items = [
        CartItem(
            id=item["id"],
            name=item["name"],
            price=item["price"],
            quantity=item["quantity"],
            image_url=item["image_url"],
            reasoning=item.get("reasoning"),
        )
        for item in result.get("items", [])
    ]
    return SmartCartResponse(
        intent=result.get("intent", "unknown"),
        context=result.get("context", {}),
        items=mapped_items,
        explainability=result.get("explainability", []),
    )

@app.post("/api/inventory/upload", response_model=SmartCartResponse, tags=["vision"])
async def upload_inventory_photo(file: UploadFile = File(...)):
    """
    Vision endpoint: upload a fridge/pantry photo. GPT-4o Vision analyzes
    the image, detects missing items, and builds a replenishment cart.
    """
    contents = await file.read()
    result = await analyze_inventory_image(contents)

    items = [
        CartItem(
            id=i["id"],
            name=i["name"],
            price=i["price"],
            quantity=i["quantity"],
            image_url=i["image_url"],
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
