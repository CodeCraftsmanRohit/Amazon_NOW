"""
Deterministic hallucination-guard tests — NO network, NO API key, never flake.

These mock the LLM to return a deliberately-corrupted response (wrong names,
inflated prices, a hallucinated product ID) and assert the post-processor
sanitises ALL of it against the catalog. This proves the anti-hallucination
guard with zero dependency on OpenAI being up/fast.

Run: python -m pytest tests/test_hallucination_mocked.py -v
"""

import os
import sys
import asyncio
from unittest.mock import patch

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import ai_engine.workflow.langgraph_flow as flow
from ai_engine.workflow.langgraph_flow import (
    aprocess_message, SingleShotOutput, CartItemModel, CATALOG_BY_ID,
)


# ── A deliberately-corrupted LLM response ─────────────────────────────────────
# P016 = real ID, but LLM lies about name + inflates price 1.89 → 999.99
# P999 = hallucinated ID that does not exist in the catalog
# P020 = real Smart Saver item (base 3.99, 30% off), LLM gives garbage price
def _corrupted_output() -> SingleShotOutput:
    return SingleShotOutput(
        intent="movie_night",
        complexity="medium",
        items=[
            CartItemModel(id="P016", name="TOTALLY WRONG NAME", price_usd=999.99,
                          quantity=1, image_url="/x.png", reasoning="r"),
            CartItemModel(id="P999", name="Hallucinated Phantom Product", price_usd=5.0,
                          quantity=1, image_url="/x.png", reasoning="r"),
            CartItemModel(id="P020", name="garlic bread lowercase", price_usd=888.0,
                          quantity=1, image_url="/x.png", reasoning="r"),
        ],
        explainability_bullets=["a", "b", "c"],
    )


class _FakeStructured:
    def __init__(self, out): self._out = out
    async def ainvoke(self, _prompt): return self._out


class _FakeLLM:
    def __init__(self, out): self._out = out
    def with_structured_output(self, _schema): return _FakeStructured(self._out)


def _run(**kwargs):
    """Run the pipeline with the LLM mocked to return the corrupted output."""
    with patch.object(flow, "get_llm", lambda: _FakeLLM(_corrupted_output())):
        return asyncio.run(aprocess_message("movie night", **kwargs))


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_hallucinated_id_is_dropped():
    """P999 doesn't exist in the catalog → must be silently dropped."""
    result = _run()
    ids = {i["id"] for i in result["items"]}
    assert "P999" not in ids
    assert ids <= set(CATALOG_BY_ID.keys())          # every surviving ID is real


def test_name_is_pinned_to_catalog():
    """LLM said 'TOTALLY WRONG NAME' for P016 — must be overwritten."""
    result = _run()
    p016 = next(i for i in result["items"] if i["id"] == "P016")
    assert p016["name"] == CATALOG_BY_ID["P016"]["name"]
    assert p016["name"] != "TOTALLY WRONG NAME"


def test_price_is_pinned_to_catalog():
    """LLM inflated P016 to 999.99 — must become the real catalog price."""
    result = _run()
    p016 = next(i for i in result["items"] if i["id"] == "P016")
    assert p016["price"] == CATALOG_BY_ID["P016"]["price"]
    assert p016["price"] < 999.99


def test_no_price_exceeds_catalog_base():
    """No returned price may ever exceed its catalog base price."""
    result = _run()
    for i in result["items"]:
        assert i["price"] <= CATALOG_BY_ID[i["id"]]["price"] + 1e-6


def test_smart_saver_discount_is_computed_deterministically():
    """P020: base 3.99, 30% off → 2.79, savings 1.20, flagged smart saver."""
    result = _run()
    p020 = next(i for i in result["items"] if i["id"] == "P020")
    base = CATALOG_BY_ID["P020"]["price"]
    disc = CATALOG_BY_ID["P020"]["discount_percentage"]
    expected = round(base * (1 - disc / 100), 2)
    assert p020["price"] == expected
    assert p020["is_smart_saver"] is True
    assert abs(p020["savings"] - round(base - expected, 2)) < 1e-6


def test_response_shape_is_valid():
    """Pipeline returns a well-formed response with sane fields."""
    result = _run()
    assert result["intent"] == "movie_night"
    assert len(result["items"]) == 2          # P016 + P020 survive, P999 dropped
    assert result["total_cost"] > 0
    assert isinstance(result["explainability_summary"], list)
    assert result["processing_time_ms"] >= 0
