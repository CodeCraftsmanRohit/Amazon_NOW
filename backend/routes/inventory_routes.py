"""
Inventory Routes
API endpoints for inventory checking and vision-based replenishment.
"""

from fastapi import APIRouter, UploadFile, File
from backend.services.inventory_service import analyze_inventory_image

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.post("/upload")
async def upload_inventory_photo(file: UploadFile = File(...)):
    """
    Upload a fridge/pantry photo for AI-powered inventory analysis.
    Uses GPT-4o Vision to detect missing items and build a replenishment cart.
    """
    contents = await file.read()
    result = await analyze_inventory_image(contents)
    return result
