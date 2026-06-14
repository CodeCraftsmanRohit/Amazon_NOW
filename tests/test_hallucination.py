"""
Hallucination & integrity tests — verify every item in every response
is real catalog data, not something the LLM invented.

These tests make LIVE API calls. Run with:
  python -m pytest tests/test_hallucination.py -v -s
"""

import os
import sys
import asyncio
import json

import pytest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Live API tests are OPT-IN — they hit the real OpenAI API and can be slow/flaky.
# Default `pytest` runs skip these; the deterministic equivalents live in
# tests/test_hallucination_mocked.py. Set RUN_LIVE_TESTS=1 to run these.
pytestmark = pytest.mark.skipif(
    not os.getenv("RUN_LIVE_TESTS"),
    reason="live OpenAI API test — set RUN_LIVE_TESTS=1 to run"
)

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

from ai_engine.workflow.langgraph_flow import aprocess_message, CATALOG_BY_ID, PRODUCT_CATALOG

CATALOG_NAMES  = {p["name"].lower() for p in PRODUCT_CATALOG}
CATALOG_IDS    = set(CATALOG_BY_ID.keys())
CATALOG_PRICES = {p["id"]: p["price"] for p in PRODUCT_CATALOG}


def _validate_response(result: dict, label: str):
    """Assert no hallucination in a pipeline response."""
    items = result.get("items", [])
    assert len(items) >= 1, f"[{label}] No items returned"

    for item in items:
        pid   = item["id"]
        name  = item["name"]
        price = item["price"]

        # 1. ID must be a real catalog ID
        assert pid in CATALOG_IDS, (
            f"[{label}] HALLUCINATED ID: '{pid}' not in catalog. "
            f"Item name: '{name}'"
        )

        # 2. Name must match the catalog entry for that ID (not a made-up name)
        catalog_name = CATALOG_BY_ID[pid]["name"].lower()
        assert name.lower() == catalog_name, (
            f"[{label}] NAME MISMATCH for {pid}: "
            f"got '{name}', catalog has '{CATALOG_BY_ID[pid]['name']}'"
        )

        # 3. Price must be at or below the catalog base price
        #    (discounted smart-saver items are OK; inflated prices are not)
        catalog_base = CATALOG_PRICES[pid]
        assert price <= catalog_base + 0.01, (
            f"[{label}] PRICE HALLUCINATION for {pid}: "
            f"got ${price:.2f}, catalog base is ${catalog_base:.2f}"
        )
        assert price > 0, f"[{label}] Zero/negative price for {pid}"

        # 4. Quantity must be sane
        assert 1 <= item["quantity"] <= 20, (
            f"[{label}] Unrealistic quantity {item['quantity']} for {pid}"
        )


# ── Test cases ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_movie_night():
    r = await aprocess_message("movie night for 2 friends")
    _validate_response(r, "movie_night")
    # Should contain snack/movie items
    tags_in_cart = set()
    for item in r["items"]:
        tags_in_cart.update(CATALOG_BY_ID[item["id"]].get("tags", []))
    snack_tags = {"snack", "movie night", "candy", "beverages", "soda", "popcorn"}
    assert tags_in_cart & snack_tags, "movie night cart should have snack/drink items"


@pytest.mark.asyncio
async def test_sick_emergency():
    r = await aprocess_message("I have a fever and body aches")
    _validate_response(r, "sick_emergency")
    med_ids = {"P026", "P027", "P028", "P029", "P030", "P031", "P032"}
    cart_ids = {i["id"] for i in r["items"]}
    assert cart_ids & med_ids, "sick cart must contain at least one medicine/recovery item"


@pytest.mark.asyncio
async def test_pasta_dinner_with_graph():
    """Graph agent should trigger pasta→sauce complementary pairing."""
    r = await aprocess_message("making pasta for dinner tonight")
    _validate_response(r, "pasta_dinner")
    cart_ids = {i["id"] for i in r["items"]}
    # P016=spaghetti, P017=rao's marinara, P018=prego sauce
    pasta_ids = {"P016", "P017", "P018"}
    assert cart_ids & pasta_ids, (
        f"pasta dinner should have pasta or sauce; got ids: {cart_ids}"
    )


@pytest.mark.asyncio
async def test_budget_constraint_respected():
    # ₹2500 budget — enough for 3-5 snack items.  The system must not exceed it.
    budget_inr = 2500.0
    r = await aprocess_message("snacks for movie night", budget=budget_inr)
    _validate_response(r, "budget_snacks")
    total_inr = sum(i["price"] * i["quantity"] * 83.5 for i in r["items"])
    assert total_inr <= budget_inr + 1.0, (
        f"Cart total ₹{total_inr:.0f} exceeds budget ₹{budget_inr:.0f}"
    )


@pytest.mark.asyncio
async def test_very_tight_budget_no_crash():
    # ₹500 is genuinely impossible for 3 catalog items — system must still return
    # a valid response without crashing and without returning empty items.
    r = await aprocess_message("snacks for movie night", budget=500.0)
    assert len(r["items"]) >= 1, "Even under impossible budget, should return items"
    for item in r["items"]:
        assert item["id"] in CATALOG_IDS, "Impossible-budget fallback still must use catalog IDs"


@pytest.mark.asyncio
async def test_people_count_scaling():
    r = await aprocess_message("birthday party", people_count=8)
    _validate_response(r, "birthday_party_8")
    # Some quantities should be > 1 after scaling for 8 people
    max_qty = max(i["quantity"] for i in r["items"])
    assert max_qty >= 2, "quantities should scale up for 8 people"


@pytest.mark.asyncio
async def test_no_duplicate_ids():
    r = await aprocess_message("big birthday party for 10 kids")
    _validate_response(r, "no_duplicates")
    ids = [i["id"] for i in r["items"]]
    assert len(ids) == len(set(ids)), f"Duplicate product IDs in cart: {ids}"


@pytest.mark.asyncio
async def test_obscure_query_stays_in_catalog():
    """Even a weird query should only return catalog items."""
    r = await aprocess_message("I need something for a rainy Sunday at home")
    _validate_response(r, "obscure_query")
    # All IDs must still be real
    for item in r["items"]:
        assert item["id"] in CATALOG_IDS, (
            f"Obscure query returned hallucinated ID: {item['id']}"
        )


@pytest.mark.asyncio
async def test_smart_saver_discount_correct():
    """Smart Saver prices must equal base_price * (1 - discount/100)."""
    r = await aprocess_message("bake a cake with discounted items")
    _validate_response(r, "smart_saver_discount")
    for item in r["items"]:
        if item.get("is_smart_saver"):
            cat  = CATALOG_BY_ID[item["id"]]
            disc = cat.get("discount_percentage", 0)
            expected = round(cat["price"] * (1 - disc / 100), 2)
            assert abs(item["price"] - expected) < 0.02, (
                f"Smart Saver price wrong for {item['id']}: "
                f"got {item['price']}, expected {expected}"
            )
