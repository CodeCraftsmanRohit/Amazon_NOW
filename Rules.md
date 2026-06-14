# Coding Rules & Standards

## 1. Python (Backend)
- **Type Hinting:** All functions must have strict type hints (`Dict`, `List`, `Optional`, `Any`).
- **Pydantic:** Use Pydantic `BaseModel` for all API request/response contracts and LLM structured outputs.
- **Environment Variables:** Never hardcode API keys. Always use `.env` and load via `pydantic-settings`.
- **Error Handling:** Graceful fallbacks (try/except blocks) especially around LLM API calls to ensure the UI never crashes during a live demo.

## 2. TypeScript/React (Frontend)
- **Strict Typing:** Define interfaces for all data objects (`CartItem`, `SmartCartResponse`). No `any` types.
- **Component State:** Use functional components and hooks (`useState`, `useEffect`).
- **Styling:** TailwindCSS utility classes ONLY. Avoid custom CSS unless absolutely necessary (e.g., specific keyframe animations).
- **Client Components:** Use `"use client";` at the top of interactive Next.js files.

## 3. General Architecture
- **Stateless Backend:** Keep the FastAPI backend stateless. Request state is passed in the `MessageRequest` or stored in the frontend during the session.
- **Explainability:** The AI must always populate the `explainability` array so the frontend can render transparency logs to the user.
