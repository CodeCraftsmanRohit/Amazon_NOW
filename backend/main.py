import os
import asyncio
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
import uvicorn

logger = logging.getLogger("amazon_now_ai")

# ─── AI pipeline import ───────────────────────────────────────────────────────
from ai_engine.workflow.langgraph_flow import aprocess_message
from backend.services.inventory_service import analyze_inventory_image
from ai_engine.agents.consumption_agent.history import all_users as _all_users

# Cache user list at module load — it never changes at runtime
_USERS_CACHE: list = _all_users()

# ─── Startup pre-warmer ───────────────────────────────────────────────────────
# Fires a background request at boot time so the cold-start cost
# (LangChain import + first OpenAI TCP connection) is paid once, silently.
# Without this, the FIRST user request takes ~18s. With it: ~3-5s every time.

async def _prewarm():
    try:
        logger.info("Pre-warming AI pipeline…")
        await aprocess_message("coffee and breakfast")
        logger.info("Pipeline pre-warmed ✓")
    except Exception as e:
        logger.warning(f"Pre-warm skipped: {e}")


@asynccontextmanager
async def lifespan(application: FastAPI):
    # Background task — server is immediately ready, warm-up runs in parallel.
    asyncio.create_task(_prewarm())
    yield


# ─── Models ───────────────────────────────────────────────────────────────────

class MessageRequest(BaseModel):
    message:      str
    budget:       Optional[float] = None   # INR
    people_count: Optional[int]   = 1
    user_id:      Optional[str]   = None   # real purchase history lookup

class CartItem(BaseModel):
    id:             str
    name:           str
    price:          float
    quantity:       int
    image_url:      str
    reasoning:      Optional[str]   = None
    original_price: Optional[float] = None
    savings:        Optional[float] = 0.0
    is_smart_saver: Optional[bool]  = False

class SmartCartResponse(BaseModel):
    intent:             str
    context:            Dict[str, str]
    items:              List[CartItem]
    explainability:     List[str]
    total_cost:         Optional[float] = 0.0
    total_savings:      Optional[float] = 0.0
    processing_time_ms: Optional[int]   = None
    personalised:       Optional[bool]  = False


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Amazon Now AI — Backend API",
    description=(
        "Single-shot synthesis: one grounded GPT-4o call + a deterministic "
        "product association graph → cart, in one pass."
    ),
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "Amazon Now AI", "version": "3.0.0"}


@app.get("/api/users", tags=["users"])
def get_users():
    """Return the cached list of demo user personas — O(1), built at startup."""
    return {"users": _USERS_CACHE}


@app.post("/api/chat", response_model=SmartCartResponse, tags=["ai"])
async def chat_interaction(req: MessageRequest):
    """
    Natural language → single-shot AI synthesis → smart cart.
    One grounded GPT-4o call (intent + context + history + inventory + cart +
    explainability) runs concurrently with a deterministic product graph lookup.
    Returns processing_time_ms for demo transparency.
    """
    result = await aprocess_message(
        message=req.message,
        budget=req.budget,
        people_count=req.people_count or 1,
        user_id=req.user_id,
    )
    items = [
        CartItem(
            id=i["id"], name=i["name"], price=i["price"],
            quantity=i["quantity"], image_url=i["image_url"],
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
        processing_time_ms=result.get("processing_time_ms"),
        personalised=result.get("personalised", False),
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
