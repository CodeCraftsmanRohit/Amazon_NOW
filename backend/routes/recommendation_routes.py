"""
Recommendation Routes
API endpoints for product recommendations and catalog search.
"""

from fastapi import APIRouter, Query
from backend.controllers.recommendation_controller import (
    search_catalog,
    get_products_by_intent,
    get_complementary_products,
)

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.get("/search")
async def search_products(q: str = Query(..., description="Search query"), limit: int = 5):
    """
    Full-text search over the product catalog.
    In production: uses Amazon OpenSearch with vector similarity.
    """
    results = search_catalog(q, limit=limit)
    return {"query": q, "results": results, "count": len(results)}


@router.get("/by-intent/{intent}")
async def products_by_intent(intent: str, limit: int = 10):
    """
    Get products relevant to a detected shopping intent.
    Used internally by the AI cart pipeline.
    """
    results = get_products_by_intent(intent, limit=limit)
    return {"intent": intent, "products": results}


@router.get("/complementary/{product_id}")
async def complementary_products(product_id: str, limit: int = 3):
    """
    Get products that complement a given product.
    In production: uses Amazon's product knowledge graph (Neo4j).
    """
    results = get_complementary_products(product_id, limit=limit)
    return {"product_id": product_id, "complementary": results}
