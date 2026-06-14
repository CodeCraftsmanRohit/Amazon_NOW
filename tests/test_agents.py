"""
Tests for the cart budget-fitting logic (deterministic, no network).
Run: python -m pytest tests/test_agents.py -v
"""

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ai_engine.workflow.langgraph_flow import cart_total_usd, fit_cart_to_budget


def _item(name, price, qty, savings=0.0, smart_saver=False):
    return {
        "id": name, "name": name, "price": price, "quantity": qty,
        "savings": savings, "is_smart_saver": smart_saver,
    }


def test_cart_total():
    items = [_item("a", 2.0, 3), _item("b", 5.0, 1)]
    assert cart_total_usd(items) == 11.0


def test_no_budget_is_noop():
    items = [_item("a", 2.0, 3)]
    out = fit_cart_to_budget(items, None)
    assert out == items


def test_budget_reduces_quantities_before_dropping_items():
    # Budget ~ $10 (835 INR). Start at $20, should trim qty but keep all 2 items.
    items = [_item("popcorn", 5.0, 2), _item("soda", 5.0, 2)]  # total $20
    fit_cart_to_budget(items, 835.0)  # 835 / 83.5 = $10
    assert len(items) == 2, "variety preserved — no items dropped yet"
    assert cart_total_usd(items) <= 10.0 + 1e-6


def test_budget_drops_items_only_when_necessary_but_keeps_floor():
    # Very tight budget with 4 single-qty items; floor is min(3, len)=3.
    items = [_item("a", 5.0, 1), _item("b", 5.0, 1), _item("c", 5.0, 1), _item("d", 5.0, 1)]
    fit_cart_to_budget(items, 835.0)  # $10 budget
    # Can't reduce qty (all 1), so drops down to the floor of 3 items.
    assert len(items) == 3


def test_budget_never_goes_below_three_items():
    items = [_item("a", 50.0, 1), _item("b", 50.0, 1), _item("c", 50.0, 1)]
    fit_cart_to_budget(items, 100.0)  # ~$1.2 — impossible, but floor protects variety
    assert len(items) == 3


def test_within_budget_unchanged():
    items = [_item("a", 2.0, 1), _item("b", 3.0, 1)]
    fit_cart_to_budget(items, 10000.0)  # huge budget
    assert cart_total_usd(items) == 5.0
    assert len(items) == 2
