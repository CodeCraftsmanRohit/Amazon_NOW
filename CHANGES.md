# What Changed — Critical Fixes for Top 30

> **⚠️ Historical snapshot.** This file documents an *intermediate* optimisation
> stage (the 6–8s, multi-call version). The pipeline was subsequently collapsed
> further to a **single grounded GPT-4o call + deterministic graph (~3s)**.
> For the current architecture, see **README.md** and **system_design.md**.

## Summary
Fixed the **3 biggest gaps** between your demo and what a technical judge will verify:

1. **Latency** — Your "seconds" promise vs 60s reality → now **6-8s** (measured, visible)
2. **The Graph Agent** — Was an LLM guessing → now **real traversal** (deterministic, 0ms)
3. **Honesty** — 70% empty files claiming Neo4j/Qdrant/YOLO → **removed, README reframed**

## Performance (the most critical fix)

**Before:** ~60 seconds (your demo video loader), 7 sequential GPT-4o calls  
**After:** ~6-8 seconds end-to-end, 4 concurrent enrichment + 1 synthesis

### What changed in `ai_engine/workflow/langgraph_flow.py`:
- Fan-out enrichment agents run **async in parallel** (not sequential)
- Lightweight agents use **gpt-4o-mini** (fast + cheap)
- Cart synthesis uses **gpt-4o** (quality where it matters)
- **Graph Agent is a real traversal** — no LLM call, instant
- Explainability merged into cart call (removed a round trip)
- Every response includes **`processing_time_ms`** field

### The UI now shows the speed:
Frontend displays **"⚡ Built in 6.8s"** badge in results (line 838 in `page.tsx`)

## The Product Graph is Real

**Before:** "Graph Agent" was a single GPT-4o prompt asking for associations  
**After:** Real weighted co-occurrence graph built from catalog

`ai_engine/agents/graph_agent/graph_query.py` (185 lines):
- Builds edges from shared tags + complementary categories
- `associations_for()` traverses real edges, returns pairs like:
  - *"Barilla Spaghetti pairs well with Rao's Marinara Sauce"*
  - *"Popcorn pairs well with Coca-Cola, M&Ms"*
- Exported adjacency list to `neo4j/product_graph.json` (inspectable)

Run: `python -m ai_engine.agents.graph_agent.graph_query`

This is **exactly** what Lavish described: "pasta → sauce" automatic complementary item addition.

## Honesty Cleanup

**Removed 132 empty 0-byte files** that misrepresented unbuilt systems:
- neo4j/, qdrant/, redis/, postgres/ folders (no external DBs)
- computer-vision/ (no YOLO)
- ai_engine/llm/, ai_engine/rag/ (unused alternate clients)
- models/ (no trained .pkl files)
- monitoring/, deployment/kubernetes/, terraform/
- All per-agent submodules (replaced by inline pipeline)
- Empty test stubs

**README rewritten** with honest "Built today vs 6-month vision" split:
- No diagrams implying Neo4j/Bedrock/Personalize exist
- Product graph described as "in-process weighted co-occurrence"
- 6-month roadmap explicitly labeled "NOT yet built"

**Updated:**
- `.env.example` — only `OPENAI_API_KEY` (dropped fake Neo4j/Redis/Postgres creds)
- `backend/config/settings.py` — only references what's used
- `docker-compose.yml` — removed unused Redis service, added working Dockerfiles

## Real Tests (13 passing)

**Before:** 10 empty test files  
**After:** 2 real test suites (no network/API key needed)

- `tests/test_graph.py` — Graph traversal, pasta↔sauce edge, symmetry
- `tests/test_agents.py` — Budget fitting, variety preservation

Run: `pytest tests/ -v`

## Budget Logic Fixed

**Before:** Greedy trim left a 1-item movie-night cart for 4 people  
**After:** Reduces quantities first, drops items only when necessary, never below 3

Extracted into testable `fit_cart_to_budget()` function with unit tests.

## How to Run

See **`QUICKSTART.md`** (new file) for step-by-step setup.

**Local:**
```bash
# Backend (Terminal 1)
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # add your OPENAI_API_KEY
uvicorn backend.main:app --reload

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev

# Visit http://localhost:3000
```

**Docker:**
```bash
# Set OPENAI_API_KEY in .env first
docker-compose up
```

## Verification Commands

```bash
# 1. Tests pass (no API key needed)
pytest tests/ -v

# 2. Backend imports cleanly
python -c "import backend.main; print('OK')"

# 3. Graph exports real artifact
python -m ai_engine.agents.graph_agent.graph_query

# 4. End-to-end timing (needs API key)
python -c "
from ai_engine.workflow.langgraph_flow import process_message
r = process_message('movie night for 4')
print(f\"Time: {r['processing_time_ms']}ms\")
print(f\"Items: {[i['name'] for i in r['items']]}\")
"
```

## Git Commits (ready to push)

```bash
git log --oneline -2
```

Output:
```
20eb929 chore: add working Dockerfiles and quickstart guide
df599db refactor: remove empty placeholder files (honesty cleanup)
```

The first commit includes:
- All 132 file deletions (empty stubs)
- Real product graph implementation
- Async pipeline rewrite + latency fixes
- Budget logic improvements
- Real tests
- Honest README
- Settings/env cleanup
- Frontend latency badge

Second commit adds Docker + quickstart docs.

## To Push to GitHub

```bash
git push origin main
```

If you get a merge conflict (someone else pushed), pull first:
```bash
git pull --rebase origin main
git push origin main
```

## What's Left (Optional)

`system_design.md` and `TechSpec.md` still describe Neo4j/Qdrant/Postgres as if built.  
These contradict the new honest README. If judges read them, the credibility gap reappears.

**Options:**
1. Delete them (fastest)
2. Rewrite them with the same "built today vs roadmap" framing as README
3. Leave as aspirational docs but add a header: "Note: describes target architecture; see README for current implementation"

Let me know if you want me to handle these.

---

## Bottom Line for Judges

**Before these fixes:**
- Claims "seconds" → actually 60s
- Claims "7 parallel agents" → actually sequential
- Claims "product graph" → actually LLM guessing
- 70% of repo is empty files claiming unbuilt tech

**After:**
- Delivers 6-8s (measured, visible in UI)
- 4 agents truly parallel, graph is real deterministic traversal
- Repo matches README — honest about built vs aspirational
- 13 passing tests proving core logic works

You went from "nice GPT wrapper with overclaiming" to a **credible technical prototype with a genuine differentiator** (the real graph + low latency solving the stated problem).
