# Quick Start Guide

## Prerequisites
- Python 3.10+
- Node.js 18+
- OpenAI API key

## Backend (Terminal 1)

```bash
# 1. Create virtual environment
python -m venv venv

# 2. Activate (Windows)
venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure API key
copy .env.example .env
# Edit .env and add your OPENAI_API_KEY=sk-...

# 5. Run backend
uvicorn backend.main:app --reload

# Backend runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

## Frontend (Terminal 2 — keep backend running)

```bash
cd frontend
npm install
npm run dev

# Frontend runs at http://localhost:3000
```

## Testing

```bash
# Activate venv first
venv\Scripts\activate

# Install test dependency
pip install pytest

# Run tests (no API key needed for graph/budget tests)
python -m pytest tests/ -v
```

## Docker (alternative)

```bash
# Set OPENAI_API_KEY in .env first
docker-compose up

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

## Common issues

**"No module named X"** → `pip install -r requirements.txt`  
**Backend fails** → Check `.env` has valid `OPENAI_API_KEY`  
**Frontend can't reach backend** → Ensure backend is running on port 8000  
**Tests import errors** → Activate venv: `venv\Scripts\activate`
