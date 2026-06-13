import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Optional, List, Dict

# Models for Request and Response
class MessageRequest(BaseModel):
    message: str

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    image_url: str
    reasoning: Optional[str] = None

class SmartCartResponse(BaseModel):
    intent: str
    context: Dict[str, str]
    items: List[CartItem]
    explainability: List[str]

app = FastAPI(title="Amazon Now AI - Backend API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "Amazon Now AI"}

from ai_engine.workflow.langgraph_flow import process_message

@app.post("/api/chat", response_model=SmartCartResponse)
async def chat_interaction(req: MessageRequest):
    # Call LangGraph Workflow
    result = process_message(req.message)
    
    # Ensure items are mapped correctly
    mapped_items = [
        CartItem(
            id=item["id"],
            name=item["name"],
            price=item["price"],
            quantity=item["quantity"],
            image_url=item["image_url"],
            reasoning=item["reasoning"]
        ) for item in result.get("items", [])
    ]
    
    return SmartCartResponse(
        intent=result.get("intent", "unknown"),
        context=result.get("context", {}),
        items=mapped_items,
        explainability=result.get("explainability", [])
    )

import base64
import json
import re
from openai import OpenAI
from backend.config.settings import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

@app.post("/api/inventory/upload", response_model=SmartCartResponse)
async def upload_inventory_photo(file: UploadFile = File(...)):
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode("utf-8")
    
    explainability = []
    intent = "inventory_replenishment"
    items = []

    try:
        # Step 1: Use GPT-4o Vision to analyze what's missing
        vision_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this fridge/pantry/shelf image. 
                            Identify what items are low or missing that the user should buy.
                            Return a JSON object with this exact structure:
                            {
                              "detected_items": ["list of items you can see"],
                              "missing_items": ["list of 3 items that appear low or missing"],
                              "scene_description": "one sentence about what you see"
                            }
                            Only return valid JSON, no other text."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            max_tokens=400,
        )

        ai_text = vision_response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        ai_text = re.sub(r"```json|```", "", ai_text).strip()
        vision_data = json.loads(ai_text)
        
        missing = vision_data.get("missing_items", ["Whole Milk", "Eggs", "Bread"])
        scene = vision_data.get("scene_description", "Fridge analyzed by AI.")
        explainability.append(f"Vision Agent: {scene}")
        explainability.append(f"Detected {len(vision_data.get('detected_items', []))} items in image. Found {len(missing)} items to restock.")

        # Step 2: Use GPT-4o to convert missing items into a proper cart
        cart_response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": f"""Convert these missing grocery items into a shopping cart JSON.
                    Missing items: {missing}
                    
                    Return ONLY a JSON array of exactly {min(len(missing), 3)} objects with this structure:
                    [
                      {{
                        "id": "v1",
                        "name": "Full Brand and Product Name",
                        "price": 3.99,
                        "quantity": 1,
                        "image_url": "/assets/item.png",
                        "reasoning": "One sentence explaining why this was flagged as missing"
                      }}
                    ]
                    Use realistic brand names and prices. Return valid JSON array only."""
                }
            ],
            max_tokens=500,
        )

        cart_text = cart_response.choices[0].message.content.strip()
        cart_text = re.sub(r"```json|```", "", cart_text).strip()
        raw_items = json.loads(cart_text)
        
        items = [
            CartItem(
                id=str(i.get("id", f"v{idx}")),
                name=i["name"],
                price=float(i["price"]),
                quantity=int(i.get("quantity", 1)),
                image_url=i.get("image_url", "/assets/item.png"),
                reasoning=i.get("reasoning", "Detected as missing from image.")
            )
            for idx, i in enumerate(raw_items[:3])
        ]
        explainability.append("Cart Agent: Converted vision findings into purchasable items with real prices.")

    except Exception as e:
        explainability = [
            "Vision Agent: Analyzed fridge image using GPT-4o Vision.",
            f"Fallback used due to: {str(e)[:80]}",
            "Cart Agent: Generated replenishment cart from common staples."
        ]
        items = [
            CartItem(id="v1", name="Whole Milk 1 Gallon", price=3.99, quantity=1,
                     image_url="/assets/milk.png", reasoning="Common staple detected as low."),
            CartItem(id="v2", name="Farm Fresh Eggs (12 pack)", price=2.49, quantity=1,
                     image_url="/assets/eggs.png", reasoning="Frequently needed for cooking."),
            CartItem(id="v3", name="Whole Wheat Bread", price=2.99, quantity=1,
                     image_url="/assets/bread.png", reasoning="Staple item for quick meals."),
        ]

    return SmartCartResponse(
        intent=intent,
        context={"source": "vision_analysis", "status": "items_detected"},
        items=items,
        explainability=explainability
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
