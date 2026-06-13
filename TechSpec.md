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

### 1.3 AI Middleware (LangGraph)
- **Orchestrator:** LangGraph (State Machine)
- **LLM Provider:** OpenAI API (`gpt-4o` for text generation and vision)
- **Data Enforcement:** Pydantic models with `with_structured_output` to guarantee strict JSON schemas across 7 sequential agent nodes.

## 2. Future AWS-Native Migration
- **Compute:** AWS Lambda & Amazon API Gateway
- **LLM Foundation:** Amazon Bedrock (Claude 3.5 Sonnet)
- **Caching:** Amazon ElastiCache (Redis)
- **Database:** Amazon DynamoDB (User State/History)
- **Storage:** Amazon S3 (Image processing)

## 3. Environment Requirements
- Python 3.11+
- Node.js 18+
- `.env` variables: `OPENAI_API_KEY`, `REDIS_URL`, `POSTGRES_URL`
