"""
Recommendation Service
High-level service layer for product recommendations.
Orchestrates catalog lookups, intent matching, and (in production)
Amazon Personalize integration for hyper-personalized predictions.
"""

import json
import os
from typing import List, Dict, Any, Optional


_CATALOG_PATH = os.path.join(os.path.dirname(__file__), '../../data/products/products.json')
try:
    with open(_CATALOG_PATH, 'r') as f:
        _CATALOG: List[Dict] = json.load(f)
except Exception:
    _CATALOG = []


def get_catalog() -> List[Dict]:
    """Return the full product catalog."""
    return _CATALOG


def get_catalog_summary_for_llm() -> str:
    """
    Return a compact JSON string of the catalog for injection into LLM prompts.
    Only includes id, name, price, and tags to minimize token usage.
    """
    return json.dumps([
        {"id": p["id"], "name": p["name"], "price": p["price"], "tags": p["tags"]}
        for p in _CATALOG
    ])


def find_product_by_id(product_id: str) -> Optional[Dict]:
    """Find a product by its catalog ID."""
    return next((p for p in _CATALOG if p["id"] == product_id), None)


def find_products_by_tags(tags: List[str], limit: int = 10) -> List[Dict]:
    """Find products matching any of the provided tags."""
    results = []
    tag_set = set(t.lower() for t in tags)
    for product in _CATALOG:
        product_tags = set(t.lower() for t in product.get("tags", []))
        if tag_set & product_tags:
            results.append(product)
        if len(results) >= limit:
            break
    return results
