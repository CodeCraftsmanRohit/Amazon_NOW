# Application Flow

## 1. User Journey: Natural Language Input

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js UI
    participant Backend as FastAPI
    participant LangGraph as AI Pipeline
    participant LLM as OpenAI gpt-4o

    User->>Frontend: Types "Bake chocolate cake"
    Frontend->>Backend: POST /api/chat
    Backend->>LangGraph: Initialize State
    LangGraph->>LLM: 1. Intent Agent
    LangGraph->>LLM: 2. Context Agent
    LangGraph->>LLM: 3. Consumption Agent
    LangGraph->>LLM: 4. Inventory Agent
    LangGraph->>LLM: 5. Graph Agent
    LangGraph->>LLM: 6. Cart Agent
    LangGraph->>LLM: 7. Explainability Agent
    LangGraph-->>Backend: Final ShoppingState
    Backend-->>Frontend: SmartCartResponse JSON
    Frontend-->>User: Renders Cart & AI Reasoning
```

1. **User Input:** User types "I need to bake a chocolate cake right now" into the main input field.
2. **Frontend Request:** Next.js sends a POST request to FastAPI `/api/chat`.
3. **LangGraph Pipeline Triggered:**
   - **Intent Agent:** Classifies intent as `baking`.
   - **Context Agent:** Notes it is `evening` or `raining`.
   - **Consumption Agent:** Predicts preference for `Ghirardelli`.
   - **Inventory Agent:** Notes missing staple `Flour`.
   - **Graph Agent:** Associates `Cake` with `Butter`.
   - **Cart Agent:** Generates 3 items (Chocolate, Flour, Butter) with prices and reasoning.
   - **Explainability Agent:** Summarizes the AI thought process.
4. **Backend Response:** FastAPI returns the structured JSON to the frontend.
5. **UI Rendering:** Frontend renders the Smart Cart with item emojis, pricing, and AI Reasoning.
6. **Checkout:** User clicks "1-Click Checkout" triggering the order confirmation modal.

## 2. User Journey: Visual Inventory (Camera)

```mermaid
sequenceDiagram
    participant User
    participant Frontend as Next.js UI
    participant Backend as FastAPI
    participant Vision as GPT-4o Vision
    participant CartAI as GPT-4o

    User->>Frontend: Uploads fridge photo
    Frontend->>Backend: POST /api/inventory/upload (base64 image)
    Backend->>Vision: Detect missing items
    Vision-->>Backend: Returns ['Milk', 'Eggs']
    Backend->>CartAI: Convert to cart schema
    CartAI-->>Backend: JSON Array of CartItems
    Backend-->>Frontend: SmartCartResponse JSON
    Frontend-->>User: Renders Cart & AI Reasoning
```

1. **User Input:** User clicks the camera icon and uploads a photo of an empty fridge shelf.
2. **Frontend Request:** Next.js sends a POST `multipart/form-data` request to `/api/inventory/upload`.
3. **Vision Analysis:** FastAPI sends the image to `gpt-4o` Vision, asking it to detect missing items.
4. **Cart Translation:** FastAPI sends the detected missing items to a secondary `gpt-4o` prompt to format them into a strict `CartItem` schema with mock prices.
5. **Backend Response:** Returns the `SmartCartResponse` to the frontend.
6. **UI Rendering & Checkout:** Identical to the text flow.
