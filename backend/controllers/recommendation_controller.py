"""
Recommendation Controller
Handles product recommendations based on intent, context, and user history.
In production, this integrates with Amazon Personalize for hyper-accurate
purchase predictions using the user's full Amazon purchase history.
"""

import json
import os
from typing import List, Dict, Any


# Load product catalog
_CATALOG_PATH = os.path.join(os.path.dirname(__file__), '../../data/products/products.json')
try:
    with open(_CATALOG_PATH, 'r') as f:
        PRODUCT_CATALOG: List[Dict] = json.load(f)
except Exception:
    PRODUCT_CATALOG = []


def search_catalog(query: str, limit: int = 5) -> List[Dict]:
    """
    Search the product catalog by tags or name (keyword match).
    In production, this uses Amazon OpenSearch / vector embeddings.
    """
    query_lower = query.lower()
    results = []
    for product in PRODUCT_CATALOG:
        # Match against name or tags
        name_match = query_lower in product["name"].lower()
        tag_match = any(query_lower in tag for tag in product.get("tags", []))
        if name_match or tag_match:
            results.append(product)
        if len(results) >= limit:
            break
    return results


def get_products_by_intent(intent: str, limit: int = 10) -> List[Dict]:
    """
    Get products relevant to a detected shopping intent.
    Maps intent strings to relevant product tags.
    """
    intent_tag_map = {
        "baking_cake": ["baking", "cake", "chocolate"],
        "movie_night": ["movie night", "snack", "popcorn"],
        "hosting_party": ["party", "snack", "drinks", "hosting"],
        "sick_emergency": ["medicine", "fever", "cold", "flu"],
        "italian_dinner": ["italian", "pasta", "dinner"],
        "breakfast": ["breakfast", "morning", "coffee"],
        "grocery_replenishment": ["staple", "breakfast", "dairy"],
        "baby_essentials": ["baby", "new parent", "infant"],
    }

    # Find the closest intent key
    tags = []
    for key, mapped_tags in intent_tag_map.items():
        if any(word in intent.lower() for word in key.split("_")):
            tags = mapped_tags
            break

    if not tags:
        return PRODUCT_CATALOG[:limit]

    results = []
    for product in PRODUCT_CATALOG:
        product_tags = product.get("tags", [])
        if any(tag in product_tags for tag in tags):
            results.append(product)
        if len(results) >= limit:
            break
    return results


def get_complementary_products(product_id: str, limit: int = 3) -> List[Dict]:
    """
    Get products that complement a given product based on shared tags.
    In production, this uses the Amazon Product Knowledge Graph (Neo4j).
    """
    source = next((p for p in PRODUCT_CATALOG if p["id"] == product_id), None)
    if not source:
        return []

    source_tags = set(source.get("tags", []))
    scored = []
    for product in PRODUCT_CATALOG:
        if product["id"] == product_id:
            continue
        overlap = len(source_tags & set(product.get("tags", [])))
        if overlap > 0:
            scored.append((overlap, product))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:limit]]
