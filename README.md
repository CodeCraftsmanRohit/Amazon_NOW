<div align="center">

<img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" width="160" alt="Amazon"/>

<br/><br/>

# ⚡ Amazon Now AI

### *The shopping experience Amazon should ship next.*

<br/>

> **"Conversational commerce has the potential to evolve retail journeys beyond**
> **'search and browse' to 'describe and get.'"**
> — *Bain & Company, How India Shops Online 2026*

<br/>

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![OpenAI](https://img.shields.io/badge/GPT--4o-Vision-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Pipeline-FF6B35?style=for-the-badge)](https://langchain.com)
[![Tests](https://img.shields.io/badge/Tests-22%20passing-22C55E?style=for-the-badge&logo=pytest&logoColor=white)](./tests)

<br/>

**Built for Amazon HackOn Season 6 · Theme: Amazon Now – Reimagining Urgent Shopping**

</div>

---

<br/>

## 🎯 The Problem — Working Backwards from Priya

<table>
<tr>
<td width="50%">

### ❌ The Old Way (Today)
It's **6:00 PM**. Priya has to host Italian dinner for 4 friends at 7:30 PM.

1. Search "pasta" → compare 15 brands
2. Search "sauce" → compare 10 more
3. Search "bread" → compare again
4. Build cart manually, remove, re-add
5. Finally checkout

⏱️ **Time spent: 25 minutes**
😤 **Experience: exhausting**

</td>
<td width="50%">

### ✅ The Amazon Now Way
Priya opens the app and types:

> *"Italian dinner for 4 tonight"*

AI reads her history (she always buys Barilla + Rao's), traverses the product graph (pasta → sauce → garlic bread → parmesan), builds the perfect cart, explains every choice.

⚡ **Time spent: 3.1 seconds**
😊 **Experience: magical**

</td>
</tr>
</table>

<br/>

---

## 📊 The Market Opportunity

> *"Quick-commerce in India has doubled annually since 2023, reaching **$10–11 billion GMV in 2025** and projected to hit **$65–70 billion by 2030** — contributing 45–50% of incremental e-retail GMV."*
> — *Bain & Company, 2026*

<br/>

| Metric | Value | Source |
|--------|-------|--------|
| 🇮🇳 India Q-commerce GMV (2025) | **$10–11 billion** | Bain & Flipkart |
| 🇮🇳 India Q-commerce GMV (2030) | **$65–70 billion** | Bain & Flipkart |
| 🌍 Global agentic commerce by 2030 | **$3–5 trillion** | McKinsey |
| 📱 AI shopping traffic growth (Black Friday 2025) | **+805% YoY** | Adobe |
| ⏱️ Q-commerce session duration | **Sub-5 minutes** | Bain |
| 🔄 Q-commerce vs e-retail conversion | **8× higher** | Bain |
| 🤖 Consumers using AI for shopping (2025) | **51–73%** | Stord / Business Wire |
| 💰 AI recs conversion lift vs traditional search | **4.4×** | McKinsey |
| 🎯 Microsoft Copilot purchase lift (with intent) | **+194%** | Microsoft |

<br/>

> *"Shopping is evolving beyond 'search and browse' to 'describe and get.'"* — Bain
>
> *"AI-referred traffic surged 1,200% while traditional search declined 10%."* — Previsible, 2026
>
> *"Purpose-built agents — not monolithic AI — dominate the early agentic wave."* — commercetools

<br/>

---

## 🏗️ What's Actually Built — No Slideware

> Every feature below runs locally. Everything is verifiable.

<br/>

### ✅ Feature Matrix

| Feature | Status | Implementation |
|---------|--------|----------------|
| 🗣️ Natural language → instant cart | **✅ Live** | GPT-4o single-shot pipeline |
| 🎤 Voice input | **✅ Live** | Web Speech API |
| 📸 Vision AI (fridge photo → restock) | **✅ Live** | GPT-4o Vision endpoint |
| 🕸️ Product knowledge graph | **✅ Real** | In-process weighted co-occurrence graph (deterministic, 0ms) |
| 👤 Purchase history personalisation | **✅ Real** | 5 demo profiles, real order history lookup |
| ⚡ Ready-to-Go Occasion Packs | **✅ Live** | Hardcoded zero-latency carts (Movie Night, Italian Dinner, etc.) |
| 🌡️ Weather-aware smart banner | **✅ Live** | Browser Geolocation + open-meteo.com, pre-fills AI prompt |
| 💰 Budget constraint | **✅ Real** | Quantity-aware budget fitting, preserves cart variety |
| 👥 Headcount scaling + split bill | **✅ Real** | Quantities auto-scale × people, ₹X/person shown |
| 🏷️ Smart Saver near-expiry deals | **✅ Real** | Discount logic on catalog items |
| 🚀 Startup pre-warmer | **✅ Live** | Cold-start paid silently on server boot |
| ⏱️ Processing time badge | **✅ Live** | Every response shows "⚡ Built in X.Xs" |
| 🔒 Hallucination guard | **✅ Real** | Prices + names always pinned to catalog, never LLM-generated |
| 1️⃣ One-click checkout + tracking | **✅ Live** | Mock order flow with animated delivery tracking |
| 🧪 Test suite | **✅ 22 passing** | Graph traversal, budget logic, live hallucination tests |

<br/>

---

## 🧠 The AI Pipeline

### Architecture: Single-Hop Parallel Design

```
                    USER MESSAGE
                         │
         ┌───────────────┴───────────────────┐
         │                                    │
         ▼                                    ▼
  ┌─────────────────────────────┐    ┌──────────────────┐
  │   GPT-4o (single call)      │    │  Product Graph   │
  │                             │    │  (0ms, no LLM)   │
  │  • Intent classification    │    │                  │
  │  • Context inference        │    │  Real edges:     │
  │  • Consumption prediction   │    │  pasta→sauce     │
  │  • Inventory gap detection  │    │  popcorn→soda    │
  │  • Cart synthesis           │    │  baking→dairy    │
  │  • Explainability bullets   │    │                  │
  └──────────────┬──────────────┘    └────────┬─────────┘
                 │                            │
                 └──────────────┬─────────────┘
                                ▼
                    ┌───────────────────┐
                    │   Post-Processor  │
                    │                  │
                    │  • Catalog pins  │  ← prices ALWAYS from catalog
                    │  • Smart Saver   │  ← near-expiry discounts
                    │  • Budget fit    │  ← quantity trim, never crashes
                    │  • People scale  │  ← qty × headcount
                    └─────────┬────────┘
                              │
                              ▼
                     SmartCartResponse
                     (2-4s warm latency)
```

<br/>

### Why This Architecture Is Fast

| Version | Design | LLM Calls | Warm Latency |
|---------|--------|-----------|--------------|
| Original | 7 sequential calls | 7 | ~30–60s |
| v2 | 3 serial hops, fan-out | 6 | ~8s |
| v3 | 2 serial hops, gather | 2 | ~5-6s |
| **v4 (current)** | **1 call + instant graph** | **1** | **~2-4s** |

<br/>

### The Product Graph Is Real

```
ai_engine/agents/graph_agent/graph_query.py
│
├── Builds weighted co-occurrence graph from 50-product catalog
│   Edges = shared tags + complementary category pairs
│
├── Example traversal:
│   "pasta for dinner" →
│     P016 Barilla Spaghetti  ──(weight: 5.0)──▶  P017 Rao's Marinara
│     P016 Barilla Spaghetti  ──(weight: 3.0)──▶  P019 Parmesan
│     P017 Rao's Marinara     ──(weight: 4.0)──▶  P020 Garlic Bread
│
└── Export: python -m ai_engine.agents.graph_agent.graph_query
    → neo4j/product_graph.json (50 nodes, real adjacency list)
```

<br/>

---

## 👤 Real Purchase History Personalisation

> *"Consumption history is the moat — personalisation based on past purchases drives 40% more revenue per visitor."* — McKinsey

<br/>

Five demo customer profiles with real order history:

| Profile | Who | What their history shows |
|---------|-----|--------------------------|
| 👩‍💼 **Priya** | Working Professional | Always buys Barilla + Rao's for pasta nights, popcorn on Fridays |
| 👨‍👧 **Rahul** | New Parent | Pampers, Enfamil formula, baby wipes weekly |
| 🎓 **Aisha** | College Student | Red Bull, Doritos, PB&J — tight budget |
| 🎉 **Krishna** | Party Host | Bulk snacks, 3× Coke, party food for large groups |
| 🧁 **Meera** | Home Baker | Ghirardelli, Kerrygold butter, King Arthur flour — running low on sugar |

**What the AI does with it:**
```
Meera + "bake a cake" →
  Cart includes Domino Granulated Sugar
  Bullet: "Since you're likely running low on sugar, we've added it"
  
  ← This is a real computation from order dates, not a hallucination
```

<br/>

---

## 🔄 User Journey Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as Next.js UI
    participant API as FastAPI Backend
    participant Pipeline as AI Pipeline
    participant Graph as Product Graph

    User->>UI: "Italian dinner for 4 tonight"
    UI->>API: POST /api/chat {message, user_id, budget, people}
    
    par Parallel execution
        API->>Pipeline: GPT-4o (intent + signals + cart)
        API->>Graph: Real graph traversal (0ms)
    end
    
    Pipeline-->>API: Cart items + bullets
    Graph-->>API: Complementary associations
    API->>API: Pin prices to catalog (anti-hallucination)
    API->>API: Apply Smart Saver discounts
    API->>API: Scale quantities × people_count
    API-->>UI: SmartCartResponse (+ processing_time_ms)
    UI-->>User: ⚡ AI-Built Cart in 3.1s
```

<br/>

```mermaid
sequenceDiagram
    participant User
    participant UI as Next.js UI
    participant API as FastAPI Backend
    participant Vision as GPT-4o Vision

    User->>UI: Uploads fridge photo 📸
    UI->>API: POST /api/inventory/upload
    API->>Vision: Detect missing items
    Vision-->>API: ['Milk', 'Eggs', 'Bread']
    API->>Vision: Convert to structured cart
    Vision-->>API: CartItems with prices
    API-->>UI: SmartCartResponse
    UI-->>User: Replenishment cart ready
```

<br/>

---

## 🏛️ Target Scale Architecture (6-Month Roadmap)

> *"Traditional e-retail platforms will continue to thrive, protected by brand trust, product fulfillment, and personalisation."* — Bain & Company
>
> Amazon Now AI is the conversational layer that makes those moats actionable.

```mermaid
graph TD
    User([🛒 Amazon Customer]) -->|Voice / App| CDN[Amazon CloudFront]
    CDN --> APIG[Amazon API Gateway]

    APIG --> Lambda[AWS Lambda · Orchestrator]

    subgraph AI Layer
        Lambda <-->|Intent + Cart| Bedrock[Amazon Bedrock\nClaude 3.5 Sonnet]
        Lambda <-->|Vision| BedrockV[Amazon Bedrock\nTitan Multimodal]
    end

    subgraph Data Layer
        Lambda <--> Cache[Amazon ElastiCache\nHot cart sessions]
        Lambda <--> DB[Amazon DynamoDB\nUser purchase history]
        Lambda <--> S3[Amazon S3\nFridge photos]
        Lambda <--> Neptune[Amazon Neptune\nBillion-edge product graph]
    end

    subgraph Amazon Ecosystem
        Lambda --> Personalize[Amazon Personalize\nReal purchase predictions]
        Lambda --> OrderAPI[Amazon Order API\nLive fulfillment]
        Lambda --> PrimeAir[Prime Air / Zoox\nDrone + autonomous delivery]
    end
```

<br/>

| Today (Prototype) | 6-Month Target | Why |
|---|---|---|
| OpenAI GPT-4o | **Amazon Bedrock** | Data stays in AWS, no 3rd-party dependency |
| In-process graph | **Amazon Neptune** | Billion-edge co-purchase graph at catalog scale |
| JSON flat files | **DynamoDB + Personalize** | Real-time purchase history for all 300M+ Amazon customers |
| Mock checkout | **Amazon Order API + Prime Air** | Live fulfilment + drone dispatch |
| Single process | **Lambda + API Gateway** | Auto-scale 1 → 100M users |
| OpenAI Vision | **Bedrock Titan Multimodal** | AWS-native image analysis |

> **These are explicitly roadmap items — not claimed as built. Today's prototype is entirely self-contained.**

<br/>

---

## ⚙️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│  Next.js 15 (App Router) · React · TailwindCSS          │
│  Web Speech API (voice) · open-meteo.com (weather)      │
└──────────────────────┬──────────────────────────────────┘
                       │ REST
┌──────────────────────▼──────────────────────────────────┐
│                    BACKEND                               │
│  FastAPI · Uvicorn · Pydantic (strict structured output) │
│  Startup pre-warmer (lifespan) · Async throughout        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  AI PIPELINE                             │
│  LangChain · OpenAI GPT-4o + GPT-4o Vision              │
│  Pure-Python product graph (50 nodes, weighted edges)    │
│  Purchase history store (5 profiles, real order data)    │
└─────────────────────────────────────────────────────────┘
```

<br/>

---

## 🛡️ Hallucination Guard — By Design

> *"Brands are pivoting to RAG to ensure AI agents are grounded in a verified database."* — Stord State of AI, 2026

Every response field is verified before it reaches the user:

| Field | Source | Hallucination possible? |
|-------|--------|------------------------|
| Product ID | LLM selects from catalog | Unknown ID → silently skipped |
| **Product name** | `CATALOG_BY_ID[id]["name"]` | ❌ **Always exact catalog string** |
| **Price** | `CATALOG_BY_ID[id]["price"]` | ❌ **Always exact catalog value** |
| **Discount** | `CATALOG_BY_ID[id]["discount_percentage"]` | ❌ **Always exact catalog value** |
| Quantity | LLM × people_count | Clamped 1–20 |
| Reasoning/bullets | LLM generates | Subjective text, not factual |

**22 automated tests verify this.** Including 9 live hallucination tests that run real API calls and assert every returned item has a valid catalog ID, correct name, and price ≤ catalog base price.

<br/>

---

## 🧪 Tests — 22 Passing

```bash
python -m pytest tests/ -v
```

```
tests/test_graph.py          7 tests   Graph edges, pasta↔sauce, symmetry
tests/test_agents.py         6 tests   Budget fitting, variety preservation  
tests/test_hallucination.py  9 tests   Live API: IDs, names, prices, domains
─────────────────────────────────────
TOTAL: 22 passed in ~45s
```

<br/>

---

## 🚀 Quick Start

### Prerequisites
- Python 3.12+ · Node.js 18+ · OpenAI API key

### 1. Backend

```bash
# Clone & setup
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

pip install -r requirements.txt

# Configure
cp .env.example .env
# Add OPENAI_API_KEY=sk-... to .env

# Run
uvicorn backend.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 3. (Optional) Docker

```bash
# Ensure .env has OPENAI_API_KEY
docker-compose up
```

### 4. Run Tests

```bash
pip install pytest
python -m pytest tests/ -v
```

<br/>

---

## 🎬 Demo Scenarios — Try These

| Prompt | What to observe |
|--------|----------------|
| `"I have a fever and feel terrible"` | Emergency cart: Advil + Gatorade + Chicken Soup |
| `"Italian dinner for 4, Priya's profile"` | Uses Barilla + Rao's (her actual preferred brands) |
| `"Bake a cake, Meera's profile"` | Includes sugar + bullet: *"you're likely running low"* |
| `"Movie night for 4, budget ₹2000"` | Budget respected, Smart Saver badges, split bill shows |
| Upload a fridge photo | GPT-4o Vision detects missing items → replenishment cart |
| Click **Movie Night** pack | Instant pre-filled cart, zero AI latency |
| Weather banner (if shown) | Tapping pre-fills context-aware query (hot/cold/rainy) |

<br/>

---

## 📁 Project Structure

```
amazon-now-ai/
├── ai_engine/
│   ├── agents/
│   │   ├── graph_agent/
│   │   │   └── graph_query.py        ← Real product knowledge graph
│   │   └── consumption_agent/
│   │       └── history.py            ← Purchase history store
│   └── workflow/
│       └── langgraph_flow.py         ← Single-hop AI pipeline
├── backend/
│   ├── main.py                       ← FastAPI app + startup pre-warmer
│   ├── services/
│   │   └── inventory_service.py      ← GPT-4o Vision endpoint
│   └── routes/                       ← Cart, checkout, recommendation
├── data/
│   ├── products/products.json        ← 50-product catalog
│   └── users/purchase_history.json  ← 5 demo profiles with real orders
├── frontend/
│   └── src/app/page.tsx              ← Full UI (authentic Amazon design)
├── neo4j/
│   └── product_graph.json            ← Exported product graph adjacency list
└── tests/
    ├── test_graph.py                 ← Graph traversal tests
    ├── test_agents.py                ← Budget logic tests
    └── test_hallucination.py         ← Live hallucination guard tests
```

<br/>

---

<div align="center">

## 🏆 Judging Criteria Checklist

| Criterion | Evidence |
|-----------|----------|
| **Customer obsession** | Priya's persona, 5 personas with real history, weather context, emergency mode |
| **Quality of implementation** | End-to-end working prototype, 22 passing tests, verifiable in 5 minutes |
| **Scalability & system design** | AWS-native architecture diagram, explicit current vs roadmap split |
| **Futuristic vision** | Bedrock + Neptune + Personalize + Prime Air + UCP protocol roadmap |

<br/>

---

### *"AI is the next paradigm shift in e-commerce. Just as we moved from catalogs to online, from online to mobile, and from mobile to platforms — AI will fundamentally change how customers shop and how we serve them."*
### *— McKinsey, 2026*

<br/>

**Built for Amazon HackOn Season 6 by Rohit Kumar**

*Need-centric commerce. Customer obsession. Built to ship.*

</div>
