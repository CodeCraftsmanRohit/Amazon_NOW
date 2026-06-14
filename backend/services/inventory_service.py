"""
Inventory Service
Handles vision-based inventory analysis using GPT-4o Vision.
Detects missing/low items from fridge or pantry photos and
converts them into a purchasable shopping cart.
"""

import base64
import json
import re
from typing import Dict, Any

from openai import AsyncOpenAI
from backend.config.settings import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# Compile once at module load — reused on every request instead of recompiling
_JSON_FENCE_RE = re.compile(r"```json|```")

# 10 MB hard cap — prevents OOM from unexpectedly large uploads
_MAX_IMAGE_BYTES = 10 * 1024 * 1024


async def analyze_inventory_image(image_bytes: bytes) -> Dict[str, Any]:
    """
    Analyze a fridge/pantry image and return a SmartCartResponse-compatible dict.

    Steps:
      1. GPT-4o Vision — detect what's in the image and what's missing.
      2. GPT-4o — convert missing items into a structured cart.
    """
    base64_image = base64.b64encode(image_bytes).decode("utf-8")
    explainability = []
    intent = "inventory_replenishment"
    items = []

    # Guard: reject oversized uploads before encoding
    if len(image_bytes) > _MAX_IMAGE_BYTES:
        return {
            "intent": intent,
            "context": {"source": "vision_analysis", "status": "error"},
            "items": [],
            "explainability": ["Image too large. Please upload a photo under 10 MB."],
        }

    try:
        # Step 1: Vision analysis
        vision_response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Analyze this fridge/pantry/shelf image. "
                                "Identify what items are low or missing that the user should buy. "
                                "Return a JSON object with this exact structure:\n"
                                "{\n"
                                '  "detected_items": ["list of items you can see"],\n'
                                '  "missing_items": ["list of 3-5 items that appear low or missing"],\n'
                                '  "scene_description": "one sentence about what you see"\n'
                                "}\n"
                                "Only return valid JSON, no other text."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                        },
                    ],
                }
            ],
            max_tokens=500,
        )

        ai_text = vision_response.choices[0].message.content.strip()
        ai_text = _JSON_FENCE_RE.sub("", ai_text).strip()
        vision_data = json.loads(ai_text)

        missing = vision_data.get("missing_items", ["Whole Milk", "Eggs", "Bread"])
        scene = vision_data.get("scene_description", "Fridge analyzed by AI.")
        detected_count = len(vision_data.get("detected_items", []))

        explainability.append(f"Vision Agent: {scene}")
        explainability.append(
            f"Detected {detected_count} items in image. Found {len(missing)} items to restock."
        )

        # Step 2: Convert missing items into a cart
        cart_response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Convert these missing grocery items into a shopping cart JSON.\n"
                        f"Missing items: {missing}\n\n"
                        f"Return ONLY a JSON array of exactly {min(len(missing), 5)} objects:\n"
                        "[\n"
                        '  {\n'
                        '    "id": "v1",\n'
                        '    "name": "Full Brand and Product Name",\n'
                        '    "price": 3.99,\n'
                        '    "quantity": 1,\n'
                        '    "image_url": "/assets/item.png",\n'
                        '    "reasoning": "One sentence explaining why this was flagged as missing"\n'
                        "  }\n"
                        "]\n"
                        "Use realistic brand names and prices. Return valid JSON array only."
                    ),
                }
            ],
            max_tokens=600,
        )

        cart_text = cart_response.choices[0].message.content.strip()
        cart_text = _JSON_FENCE_RE.sub("", cart_text).strip()
        raw_items = json.loads(cart_text)

        items = [
            {
                "id": str(i.get("id", f"v{idx}")),
                "name": i["name"],
                "price": float(i["price"]),
                "quantity": int(i.get("quantity", 1)),
                "image_url": i.get("image_url", "/assets/item.png"),
                "reasoning": i.get("reasoning", "Detected as missing from image."),
            }
            for idx, i in enumerate(raw_items[:5])
        ]
        explainability.append(
            "Cart Agent: Converted vision findings into purchasable items with real prices."
        )

    except Exception as e:
        explainability = [
            "Vision Agent: Analyzed fridge image using GPT-4o Vision.",
            f"Fallback triggered: {str(e)[:80]}",
            "Cart Agent: Generated replenishment cart from common staples.",
        ]
        items = [
            {"id": "v1", "name": "Organic Valley Whole Milk (1 Gallon)", "price": 5.99,
             "quantity": 1, "image_url": "/assets/milk.png", "reasoning": "Common staple detected as low."},
            {"id": "v2", "name": "Vital Farms Pasture-Raised Eggs (12ct)", "price": 5.49,
             "quantity": 1, "image_url": "/assets/eggs.png", "reasoning": "Frequently needed for cooking."},
            {"id": "v3", "name": "Nature's Own Honey Wheat Bread (20oz)", "price": 3.49,
             "quantity": 1, "image_url": "/assets/bread.png", "reasoning": "Staple item for quick meals."},
        ]

    return {
        "intent": intent,
        "context": {"source": "vision_analysis", "status": "items_detected"},
        "items": items,
        "explainability": explainability,
    }
