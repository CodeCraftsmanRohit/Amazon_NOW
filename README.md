<div align="center">
  <h1>Amazon Now AI 🚀</h1>
  <p><strong>Reimagining Urgent Shopping · Need-Centric Commerce</strong></p>
  <p>Turn a 25-minute search-browse-compare grind into a 5-second need-fulfillment moment.</p>
</div>

---

## 📖 The problem (working backwards from the customer)

Quick-commerce solved **delivery** (10-minute drop-off) but not **shopping**. A customer who needs to host a dinner tonight still has to search, compare 15 brands, add to cart, repeat — ~25 minutes of effort for a 10-minute delivery.

**Amazon Now AI flips the model from product-centric to need-centric:**

> User states a need → AI builds the cart → 1-click checkout.

### Meet Priya
It's 6:00 PM. Priya has to host dinner for 4 friends at 7:30.
- **Old way:** search pasta → compare → add → search sauce → compare → add → … *25 min.*
- **Amazon Now way:** *"Italian dinner for 4 tonight"* → a complete, complementary cart appears. *Seconds.*

---

## ✅ What's actually built today (the prototype)

This repo is a **working end-to-end prototype**, not slideware. Everything below runs locally.

| Capability | Status | How it works |
|---|---|---|
| Natural-language → cart | ✅ Real | LangGraph pipeline, GPT-4o |
| Voice input | ✅ Real | Web Speech API in the Next.js UI |
| Vision (fridge photo → restock cart) | ✅ Real | GPT-4o Vision endpoint |
| Product knowledge graph | ✅ Real | **In-process** weighted co-occurrence graph over the catalog (no LLM, deterministic) |
| Budget constraint + headcount scaling | ✅ Real | Quantity-aware budget fitting that preserves variety |
| Smart Saver (near-expiry deals) | ✅ Real | Discount logic on catalog items |
| 1-click checkout + tracking | ✅ Real (mock orders) | FastAPI routes |

### The pipeline (and an honest note on latency)

```
                 ┌─────────────┐
   message ─────▶│ Intent      │  (gpt-4o-mini, fast)
                 └──────┬──────┘
        fan-out (run concurrently, async)
        ┌───────────┬───────────┬──────────────┐
        ▼           ▼           ▼              ▼
   ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
   │ Context │ │Consumption│ │Inventory │ │ Graph        │
   │ (mini)  │ │ (mini)    │ │ (mini)   │ │ (NO LLM —    │
   └────┬────┘ └────┬─────┘ └────┬─────┘ │ real graph)  │
        └───────────┴────────────┴───────┴──────┬───────┘
                          fan-in                 ▼
                                          ┌──────────────┐
                                          │ Cart + why   │  (gpt-4o)
                                          └──────┬───────┘
                                                 ▼
                                         SmartCartResponse
```

**Why this matters:** the original design made 7 sequential model calls (~30–60s — which breaks the whole "seconds" promise). The current design:
- runs the 4 enrichment agents **concurrently** (`async` fan-out),
- uses **gpt-4o-mini** for the lightweight agents and **gpt-4o** only for cart synthesis,
- makes the Graph Agent a **real, instant graph traversal** instead of an LLM guess,
- merges explainability into the cart call to remove a round trip.

Result: **~6–8 seconds end-to-end**, and every `/api/chat` response returns `processing_time_ms` so the speed is measurable, not claimed.

### The product graph is real
`ai_engine/agents/graph_agent/graph_query.py` builds a weighted graph where products that share tags or sit in complementary categories are connected (e.g. *Barilla Spaghetti — Rao's Marinara*, *Popcorn — Soda — Candy*). The Graph Agent traverses real edges to add complementary items. Run `python -m ai_engine.agents.graph_agent.graph_query` to regenerate `neo4j/product_graph.json` (the exported adjacency list).

---

## 🔮 6-month vision (NOT yet built — roadmap, stated honestly)

To run this at Amazon scale, the path is to migrate the in-process pieces to managed services:

| Prototype today | 6-month target |
|---|---|
| GPT-4o via OpenAI | **Amazon Bedrock** (Claude / Titan) |
| In-process product graph | **Amazon Neptune** for a billion-edge co-purchase graph |
| Static catalog JSON | **DynamoDB** + **Amazon Personalize** (real purchase history) |
| Mock orders | **Amazon Order API** + **Prime Air / Zoox** dispatch |
| Single process | **API Gateway + Lambda**, **ElastiCache** for hot carts |

> These are aspirational and intentionally **not** drawn as if they exist. Today's prototype is self-contained.

---

## 💻 Tech stack
- **Frontend:** Next.js (App Router), React, TailwindCSS, Web Speech API
- **Backend:** FastAPI, Uvicorn
- **AI:** LangGraph, LangChain, OpenAI (`gpt-4o`, `gpt-4o-mini`)
- **Structure enforcement:** Pydantic structured outputs
- **Graph:** pure-Python weighted co-occurrence graph (no external DB)

---

## 🛠️ Local setup

```bash
# Backend
python -m venv venv
venv\Scripts\activate        # Windows  (source venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
cp .env.example .env         # add your OPENAI_API_KEY
uvicorn backend.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Tests
```bash
pip install pytest
python -m pytest tests/ -v      # graph traversal + budget-fitting logic
```

---
*Built for the Amazon Hackathon.*
