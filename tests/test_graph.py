"""
Tests for the real product knowledge graph (deterministic, no network).
Run: python -m pytest tests/test_graph.py -v
"""

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai_engine.agents.graph_agent.graph_query import (
    PRODUCT_GRAPH,
    extract_keywords,
)


def test_graph_builds_nodes_and_edges():
    assert len(PRODUCT_GRAPH.catalog) == 50
    # Every catalog product should have an adjacency entry.
    assert set(PRODUCT_GRAPH.adjacency.keys()) == {p["id"] for p in PRODUCT_GRAPH.catalog}
    # Graph is not empty — there are real co-tag / complementary edges.
    total_edges = sum(len(v) for v in PRODUCT_GRAPH.adjacency.values())
    assert total_edges > 0


def test_pasta_connects_to_sauce():
    """The canonical 'pasta pairs with sauce' edge must exist (Lavish's example)."""
    spaghetti = "P016"          # Barilla Spaghetti
    marinara = "P017"           # Rao's Marinara
    assert marinara in PRODUCT_GRAPH.adjacency[spaghetti]
    assert PRODUCT_GRAPH.adjacency[spaghetti][marinara] > 0


def test_edges_are_symmetric():
    for src, edges in PRODUCT_GRAPH.adjacency.items():
        for dst, w in edges.items():
            assert PRODUCT_GRAPH.adjacency[dst][src] == w


def test_associations_for_pasta():
    result = PRODUCT_GRAPH.associations_for(extract_keywords("make pasta for dinner"))
    assert result["associations"], "expected non-empty associations for pasta"
    assert "P016" in result["seed_product_ids"] or "P017" in result["seed_product_ids"]


def test_associations_for_movie_night():
    result = PRODUCT_GRAPH.associations_for(extract_keywords("movie night with friends"))
    related = result["related_product_ids"]
    snack_ids = {"P010", "P011", "P012", "P022", "P023", "P048"}  # popcorn/chips/soda/candy/ice cream
    assert snack_ids & set(related), "movie-night seeds should surface snack/drink neighbors"


def test_extract_keywords_filters_stopwords():
    kws = extract_keywords("I am hosting a party for 10 people tonight")
    assert "party" in kws
    assert "the" not in kws and "for" not in kws and "tonight" not in kws


def test_seed_products_match_keywords():
    seeds = PRODUCT_GRAPH.seed_products(["coffee"])
    # At least one coffee product should be found.
    names = [PRODUCT_GRAPH.by_id[s]["name"].lower() for s in seeds]
    assert any("coffee" in n for n in names)
