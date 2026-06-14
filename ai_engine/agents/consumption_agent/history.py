"""
Purchase History Store
Real user purchase history for the Consumption Agent.

Instead of asking the LLM to guess what a customer buys,
we look up their actual order history and compute:
  - frequently bought product IDs (top 5 by order frequency)
  - likely inventory gaps (items bought 2+ weeks ago, not reordered)
  - brand preferences
  - average spend per order

This turns the Consumption Agent from "hallucination" into
"real behavioural data" — the McKinsey-backed differentiator.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

_THIS_DIR = os.path.dirname(__file__)
_HISTORY_PATH = os.path.abspath(
    os.path.join(_THIS_DIR, "../../../data/users/purchase_history.json")
)

# ── Load profiles at module import (fast, in-memory) ─────────────────────────

def _load_profiles() -> List[Dict]:
    try:
        with open(_HISTORY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


_PROFILES: List[Dict] = _load_profiles()
_BY_ID: Dict[str, Dict] = {p["user_id"]: p for p in _PROFILES}


# ── Public API ────────────────────────────────────────────────────────────────

def all_users() -> List[Dict]:
    """Return list of {user_id, name, avatar, label} for the UI picker."""
    return [
        {
            "user_id": p["user_id"],
            "name":    p["name"],
            "avatar":  p["avatar"],
            "label":   p["label"],
            "bio":     p["bio"],
        }
        for p in _PROFILES
    ]


def get_profile(user_id: str) -> Optional[Dict]:
    return _BY_ID.get(user_id)


def get_consumption_signals(user_id: str) -> Dict:
    """
    Derive real consumption signals from purchase history.

    Returns:
        frequently_bought:  List[str]  — product names ordered most often
        likely_out_of:      List[str]  — products not ordered in 14+ days
        brand_affinities:   List[str]  — preferred brands
        avg_order_inr:      int        — average spend per order
        order_summary:      str        — human-readable summary for LLM prompt
    """
    profile = _BY_ID.get(user_id)
    if not profile:
        return _empty_signals()

    orders = profile.get("orders", [])
    if not orders:
        return _empty_signals()

    # Count product frequency across all orders
    freq: Dict[str, Tuple[int, str]] = {}  # id -> (count, name)
    last_ordered: Dict[str, datetime] = {}

    for order in orders:
        order_date = datetime.strptime(order["date"], "%Y-%m-%d")
        for item in order.get("items", []):
            pid  = item["id"]
            name = item["name"]
            freq[pid] = (freq.get(pid, (0, name))[0] + 1, name)
            if pid not in last_ordered or last_ordered[pid] < order_date:
                last_ordered[pid] = order_date

    # Frequently bought: top 5 by order count
    frequently_bought = [
        name for _, name in sorted(freq.values(), key=lambda x: -x[0])
    ][:5]

    # Likely out of: bought 2+ times total but not in last 14 days
    cutoff = datetime.now() - timedelta(days=14)
    likely_out_of = [
        freq[pid][1]
        for pid, (count, name) in freq.items()
        if count >= 2 and last_ordered.get(pid, datetime.min) < cutoff
    ][:3]

    brand_affinities = profile.get("preferences", {}).get("brands", [])
    avg_order_inr    = profile.get("preferences", {}).get("avg_order_inr", 0)

    # Human-readable summary for LLM prompt injection
    order_summary = (
        f"{profile['name']} ({profile['label']}) has placed {len(orders)} recent orders. "
        f"They frequently buy: {', '.join(frequently_bought[:3])}. "
        f"Preferred brands: {', '.join(brand_affinities[:3]) or 'no strong preference'}. "
        f"Average order: ₹{avg_order_inr:,}."
    )
    if likely_out_of:
        order_summary += f" Likely running low on: {', '.join(likely_out_of)}."

    return {
        "frequently_bought": frequently_bought,
        "likely_out_of":     likely_out_of,
        "brand_affinities":  brand_affinities,
        "avg_order_inr":     avg_order_inr,
        "order_summary":     order_summary,
    }


def _empty_signals() -> Dict:
    return {
        "frequently_bought": [],
        "likely_out_of":     [],
        "brand_affinities":  [],
        "avg_order_inr":     0,
        "order_summary":     "New customer — no purchase history available.",
    }
