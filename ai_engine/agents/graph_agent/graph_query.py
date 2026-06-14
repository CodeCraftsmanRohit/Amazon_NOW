"""
Product Association Graph — REAL in-process graph traversal.

This is NOT an LLM call. It builds a weighted co-occurrence graph from the
product catalog (products that share tags / complementary categories are
connected) and answers "what pairs well with X?" by traversing real edges.

This is what powers the product-graph lookup in the single-shot pipeline:
  pasta  --(shared: pasta, italian, dinner)-->  marinara sauce
  popcorn --(shared: movie night, snack)-->     soda, candy

It is deterministic, instant (no network / no model), and inspectable.
Run `python -m ai_engine.agents.graph_agent.graph_query` to regenerate
`neo4j/product_graph.json` (the exported adjacency list).
"""

from __future__ import annotations

import json
import os
from itertools import combinations
from typing import Dict, List, Tuple

_THIS_DIR = os.path.dirname(__file__)
_REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, "..", "..", ".."))
_CATALOG_PATH = os.path.join(_REPO_ROOT, "data", "products", "products.json")
_GRAPH_EXPORT_PATH = os.path.join(_REPO_ROOT, "neo4j", "product_graph.json")

# Complementary CATEGORY pairs get a relationship bonus on top of shared tags.
# These encode "bought/used together" semantics that pure tag overlap misses.
_COMPLEMENTARY_CATEGORIES: List[Tuple[str, str]] = [
    ("pasta", "sauces"),
    ("pasta", "dairy"),
    ("pasta", "bread"),
    ("baking", "dairy"),
    ("snacks", "beverages"),
    ("snacks", "candy"),
    ("snacks", "frozen"),
    ("candy", "beverages"),
    ("frozen", "beverages"),
    ("medicine", "beverages"),
    ("medicine", "canned"),
    ("breakfast", "beverages"),
    ("breakfast", "dairy"),
    ("bread", "condiments"),
    ("baby", "baby"),
]

_COMPLEMENTARY_SET = {frozenset(pair) for pair in _COMPLEMENTARY_CATEGORIES}


class ProductGraph:
    """A weighted undirected graph over catalog products."""

    def __init__(self, catalog: List[Dict]):
        self.catalog = catalog
        self.by_id: Dict[str, Dict] = {p["id"]: p for p in catalog}
        self.adjacency: Dict[str, Dict[str, float]] = {p["id"]: {} for p in catalog}

        # Pre-compute per-product data once — avoids rebuilding on every call.
        # tag sets: O(n) at init instead of O(n²) during _build
        # haystack strings: O(n) at init instead of O(n) per seed_products query
        self._tag_sets: Dict[str, set] = {
            p["id"]: {t.lower() for t in p.get("tags", [])}
            for p in catalog
        }
        self._haystacks: Dict[str, str] = {
            p["id"]: (
                p["name"].lower() + " "
                + " ".join(p.get("tags", [])).lower() + " "
                + p.get("category", "").lower()
            )
            for p in catalog
        }
        self._build()

    def _build(self) -> None:
        # Use pre-computed tag sets — each set is built once, not n times
        for a, b in combinations(self.catalog, 2):
            shared = self._tag_sets[a["id"]] & self._tag_sets[b["id"]]
            weight = float(len(shared))

            cat_pair = frozenset({a.get("category", ""), b.get("category", "")})
            if cat_pair in _COMPLEMENTARY_SET and len(cat_pair) == 2:
                weight += 2.0

            if weight > 0:
                self.adjacency[a["id"]][b["id"]] = weight
                self.adjacency[b["id"]][a["id"]] = weight

    # ── Queries ────────────────────────────────────────────────────────────

    def seed_products(self, keywords: List[str], limit: int = 4) -> List[str]:
        """Find product IDs whose name/tags match any of the keywords. O(n·k)."""
        kws = [k.lower() for k in keywords if k]
        scored: List[Tuple[int, str]] = []
        for pid, haystack in self._haystacks.items():   # use pre-built haystacks
            score = sum(1 for k in kws if k in haystack)
            if score:
                scored.append((score, pid))
        scored.sort(reverse=True)
        return [pid for _, pid in scored[:limit]]

    def neighbors(self, product_id: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """Return the strongest neighbors of a product."""
        edges = self.adjacency.get(product_id, {})
        return sorted(edges.items(), key=lambda kv: kv[1], reverse=True)[:top_k]

    def associations_for(self, keywords: List[str], max_assoc: int = 4) -> Dict:
        """
        Traverse the graph from seed products matching `keywords` and return
        real complementary associations.

        Returns:
            {
              "associations": ["Barilla Spaghetti pairs well with Rao's Marinara Sauce", ...],
              "related_product_ids": ["P017", "P019", ...],
              "seed_product_ids": ["P016", ...],
            }
        """
        seeds = self.seed_products(keywords)
        associations: List[str] = []
        related_ids: List[str] = []
        seen_pairs: set = set()
        related_ids_set: set = set()   # O(1) membership instead of O(m) list scan

        for seed in seeds:
            seed_name = self.by_id[seed]["name"]
            for neighbor_id, _w in self.neighbors(seed, top_k=2):
                if neighbor_id in seeds:
                    continue
                pair_key = frozenset({seed, neighbor_id})
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)
                neighbor_name = self.by_id[neighbor_id]["name"]
                associations.append(f"{seed_name} pairs well with {neighbor_name}")
                if neighbor_id not in related_ids_set:
                    related_ids.append(neighbor_id)
                    related_ids_set.add(neighbor_id)
                if len(associations) >= max_assoc:
                    break
            if len(associations) >= max_assoc:
                break

        return {
            "associations": associations,
            "related_product_ids": related_ids,
            "seed_product_ids": seeds,
        }

    def export(self, path: str = _GRAPH_EXPORT_PATH) -> None:
        """Persist the adjacency list as JSON (real artifact for inspection)."""
        payload = {
            "nodes": [{"id": p["id"], "name": p["name"], "category": p.get("category")}
                      for p in self.catalog],
            "edges": [
                {"source": src, "target": dst, "weight": w}
                for src, edges in self.adjacency.items()
                for dst, w in edges.items()
                if src < dst  # de-dupe undirected edges
            ],
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)


# ── Module-level singleton ───────────────────────────────────────────────────

def _load_catalog() -> List[Dict]:
    try:
        with open(_CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


PRODUCT_GRAPH = ProductGraph(_load_catalog())


# Lightweight stop-word filter so we extract useful seed keywords from a message.
_STOPWORDS = {
    "i", "im", "a", "an", "the", "to", "for", "of", "and", "my", "me", "we",
    "is", "am", "are", "have", "having", "want", "need", "get", "got", "some",
    "this", "that", "tonight", "today", "now", "please", "with", "at", "in",
    "on", "it", "be", "do", "going", "hosting", "people", "kids", "friends",
}


def extract_keywords(text: str) -> List[str]:
    """Cheap keyword extraction from a user message / intent string."""
    words = [w.strip(".,!?'\"").lower() for w in text.split()]
    return [w for w in words if w and w not in _STOPWORDS and len(w) > 2]


if __name__ == "__main__":
    PRODUCT_GRAPH.export()
    print(f"Exported product graph with {len(PRODUCT_GRAPH.catalog)} nodes to {_GRAPH_EXPORT_PATH}")
