# Amazon Now AI - Quick Start Guide

## ⚡ Fastest Way to Run (5 Minutes)

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key (starts with `sk-...`)

### Step 2: Configure Environment
```bash
# Create .env file
echo OPENAI_API_KEY=sk-your-key-here > .env
```

### Step 3: Choose Your Method

#### 🐳 Option A: Docker (Recommended for Demo)
```bash
docker-compose up -d --build
```
**Access:** http://localhost:3000

#### 💻 Option B: Local Development
```bash
# Backend (Terminal 1)
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn backend.main:app --reload

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```
**Access:** http://localhost:3000

## 🎬 Quick Demo Test Scenarios

1. **Sick Emergency:** Type `"I have high fever and body aches"`
2. **Weather:** Click weather banner (if location enabled)
3. **Personalization:** Select Priya → `"Italian dinner for 4"`
4. **Vision AI:** Upload handwritten list photo

## 🌐 Cloud Deployment

See `DEPLOYMENT.md` for Vercel + Render free hosting guide.

## ❓ Troubleshooting

- **Connection refused:** Check backend at http://localhost:8000/health
- **OpenAI error:** Verify API key in `.env`
- **Port in use:** Kill process on port 8000/3000

**Full guide:** See `DEPLOYMENT.md`
