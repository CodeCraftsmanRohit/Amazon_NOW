# Technical Specification

## 1. System Architecture
Amazon Now AI utilizes a decoupled frontend/backend architecture with a heavily orchestrated AI middleware layer.

### 1.1 Frontend
- **Framework:** Next.js (React)
- **Styling:** TailwindCSS, Vanilla CSS (Glassmorphism UI)
- **Features:** Server-Side Rendering (SSR) where applicable, heavily optimized client-side interactions for the chat and cart interfaces.

### 1.2 Backend
- **Framework:** FastAPI (Python)
- **Runtime:** Uvicorn
- **API Architecture:** RESTful endpoints (`/api/chat`, `/api/inventory/upload`)

### 1.3 AI Layer (Single-Shot Synthesis)
- **Core:** One grounded GPT-4o structured-output call performs intent, context, history, inventory reasoning, cart selection, and explainability in a single pass.
- **Product graph:** pure-Python weighted association graph (deterministic, 0ms, no LLM) runs concurrently and feeds real complementary pairings into the prompt.
- **Provider layer:** model-agnostic (`ai_engine/llm/provider.py`) — OpenAI `gpt-4o` by default, Amazon Bedrock (Claude 3.5) selectable via `LLM_PROVIDER=bedrock`.
- **Data enforcement:** Pydantic `with_structured_output` guarantees a strict JSON schema; a post-processor then pins every price/name to the catalog (anti-hallucination).
- **Design history:** evolved from 7 sequential agent calls (~60s) to 1 grounded call + graph (~3s).

## 2. Future AWS-Native Migration
- **Compute:** AWS Lambda & Amazon API Gateway
- **LLM Foundation:** Amazon Bedrock (Claude 3.5 Sonnet)
- **Caching:** Amazon ElastiCache (Redis)
- **Database:** Amazon DynamoDB (User State/History)
- **Storage:** Amazon S3 (Image processing)

## 3. Environment Requirements
- Python 3.12+
- Node.js 18+
- `.env` variables: `OPENAI_API_KEY` (required), `LLM_PROVIDER` (optional, default `openai`)
