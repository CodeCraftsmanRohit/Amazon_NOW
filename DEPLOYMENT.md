# Amazon Now AI - Deployment Guide

This guide covers multiple deployment options from local development to production cloud hosting.

---

## 📋 Prerequisites

- **OpenAI API Key** (required for AI features)
- Python 3.12+ (for local backend)
- Node.js 18+ (for local frontend)
- Docker & Docker Compose (for containerized deployment)
- Git (for version control)

---

## 🚀 Deployment Options

### Option 1: Local Development (Recommended for Testing)

**Best for:** Development, testing, demo preparation

#### Step 1: Clone & Setup Environment

```bash
cd c:\Users\Rohit Kumar\Desktop\hackon\amazon-now-ai

# Create .env file
copy .env.example .env

# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-...
```

#### Step 2: Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be available at:** `http://localhost:8000`  
**API Docs (Swagger):** `http://localhost:8000/docs`


#### Step 3: Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

**Frontend will be available at:** `http://localhost:3000`

#### Step 4: Test the Setup

1. Open browser: `http://localhost:3000`
2. Click "Try AI Shopping"
3. Type: `"I have high fever and body aches"`
4. Verify cart appears in ~5 seconds

---

### Option 2: Docker Compose (Recommended for Demo Video)

**Best for:** Clean demo environment, consistent behavior, easy reset

#### Step 1: Ensure .env File Exists

```bash
# Make sure .env has your OpenAI key
copy .env.example .env
# Edit .env: OPENAI_API_KEY=sk-...
```

#### Step 2: Build & Run

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

**Services:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

#### Step 3: Stop Services

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (complete cleanup)
docker-compose down -v
```


---

### Option 3: Cloud Deployment (Vercel + Render)

**Best for:** Public demo URL for judges, permanent hosting

#### A. Deploy Frontend to Vercel (Free)

**Why Vercel:** Built for Next.js, automatic CI/CD, free SSL, global CDN

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "feat: production deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import `amazon-now-ai` repository
   - Select `frontend` as root directory
   - Add environment variable:
     - Key: `NEXT_PUBLIC_API_URL`
     - Value: `https://your-backend-url.onrender.com` (wait for backend first)
   - Click "Deploy"

3. **Get your URL:** `https://amazon-now-ai.vercel.app`

#### B. Deploy Backend to Render (Free Tier)

**Why Render:** Free tier for Python apps, automatic deployments, managed hosting

1. **Create render.yaml** (already exists, verify):
   ```yaml
   services:
     - type: web
       name: amazon-now-ai-backend
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
       envVars:
         - key: OPENAI_API_KEY
           sync: false
   ```

2. **Deploy to Render:**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub
   - Click "New +" → "Web Service"
   - Connect `amazon-now-ai` repository
   - Select root directory (not frontend)
   - Render detects Python automatically
   - Add environment variable:
     - Key: `OPENAI_API_KEY`
     - Value: `sk-...` (your OpenAI key)
   - Click "Create Web Service"

3. **Get your backend URL:** `https://amazon-now-ai-backend.onrender.com`

4. **Update Vercel Frontend:**
   - Go back to Vercel dashboard
   - Settings → Environment Variables
   - Update `NEXT_PUBLIC_API_URL` to Render backend URL
   - Redeploy frontend


---

### Option 4: AWS Deployment (Production-Grade)

**Best for:** Scalability, AWS ecosystem integration, enterprise demo

#### A. AWS EC2 (Simple VM Deployment)

1. **Launch EC2 Instance:**
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.medium (2 vCPU, 4 GB RAM)
   - Security Group: Open ports 80, 443, 8000, 3000

2. **SSH into Instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Python 3.12
   sudo apt install python3.12 python3.12-venv python3-pip -y

   # Install Node.js 20
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install nodejs -y

   # Install Docker (optional)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu
   ```

4. **Clone Repository:**
   ```bash
   git clone https://github.com/your-username/amazon-now-ai.git
   cd amazon-now-ai
   ```

5. **Setup Environment:**
   ```bash
   # Create .env file
   nano .env
   # Add: OPENAI_API_KEY=sk-...

   # Backend
   python3.12 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Frontend
   cd frontend
   npm install
   npm run build
   cd ..
   ```

6. **Run with PM2 (Process Manager):**
   ```bash
   # Install PM2
   sudo npm install -g pm2

   # Start backend
   pm2 start "uvicorn backend.main:app --host 0.0.0.0 --port 8000" --name backend

   # Start frontend
   cd frontend
   pm2 start "npm start" --name frontend
   cd ..

   # Save PM2 config
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx Reverse Proxy:**
   ```bash
   sudo apt install nginx -y
   sudo nano /etc/nginx/sites-available/amazon-now-ai
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/amazon-now-ai /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Access:** `http://your-ec2-ip` or `http://your-domain.com`


#### B. AWS App Runner (Serverless, Fully Managed)

**Easiest AWS option, auto-scales, pay per use**

1. **Prepare source connection** (one-time):
   - AWS Console → App Runner → Source connections
   - Connect to GitHub

2. **Create Backend Service:**
   - Service name: `amazon-now-ai-backend`
   - Repository: Select your repo
   - Branch: `main`
   - Build settings:
     - Runtime: Python 3
     - Build command: `pip install -r requirements.txt`
     - Start command: `uvicorn backend.main:app --host 0.0.0.0 --port 8000`
   - Port: `8000`
   - Environment variables:
     - `OPENAI_API_KEY`: your key
   - Create service

3. **Create Frontend Service:**
   - Service name: `amazon-now-ai-frontend`
   - Source directory: `frontend`
   - Build settings:
     - Runtime: Nodejs 20
     - Build command: `npm install && npm run build`
     - Start command: `npm start`
   - Port: `3000`
   - Environment variables:
     - `NEXT_PUBLIC_API_URL`: backend App Runner URL
   - Create service

4. **Get URLs:**
   - Backend: `https://xxxxx.us-east-1.awsapprunner.com`
   - Frontend: `https://yyyyy.us-east-1.awsapprunner.com`

---

## 🔧 Configuration Options

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key for GPT-4o |
| `LLM_PROVIDER` | ❌ No | `openai` | LLM provider: `openai` or `bedrock` |
| `AWS_REGION` | ❌ No | `us-east-1` | AWS region for Bedrock (if using) |
| `PORT` | ❌ No | `8000` | Backend server port |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | ❌ No | `http://localhost:8000` | Backend API URL |


---

## 🧪 Testing Deployment

### Health Check Endpoints

```bash
# Backend health
curl http://localhost:8000/health

# API docs
open http://localhost:8000/docs

# Frontend
open http://localhost:3000
```

### Test AI Features

1. **Text Input:**
   - Type: `"I have high fever and body aches"`
   - Expected: Cart with Crocin, Electral, Vicks, Coconut Water in ~5s

2. **Weather Banner (if location enabled):**
   - Click blue weather banner
   - Expected: Context-aware cart based on temperature

3. **Persona Selection:**
   - Select "Priya" profile
   - Type: `"Italian dinner for 4 tonight"`
   - Expected: Barilla + Rao's cart with quantities ×4

4. **Vision Upload:**
   - Click camera icon
   - Upload handwritten list image
   - Expected: Matched products cart

5. **Budget Constraint:**
   - Select "Aisha" profile
   - Set budget: ₹500
   - Type: `"movie night with friends"`
   - Expected: Cart under ₹500

---

## 🐛 Troubleshooting

### Issue: "Connection refused" on Frontend

**Cause:** Backend not running or wrong API URL

**Fix:**
```bash
# Check backend is running
curl http://localhost:8000/health

# Verify frontend env variable
# In frontend/.env.local:
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Issue: "OpenAI API error"

**Cause:** Missing or invalid API key

**Fix:**
```bash
# Verify .env file exists and has valid key
cat .env
# Should show: OPENAI_API_KEY=sk-...

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```


### Issue: Slow Response Times

**Cause:** Cold start or network latency

**Fix:**
- First request is always slower (cold start pre-warming)
- Subsequent requests should be 2-6s
- Check OpenAI API status: https://status.openai.com

### Issue: Docker "port already in use"

**Cause:** Ports 3000 or 8000 occupied

**Fix:**
```bash
# Windows: Find and kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <process_id> /F

# Or use different ports in docker-compose.yml:
ports:
  - "3001:3000"  # Frontend on 3001
  - "8001:8000"  # Backend on 8001
```

---

## 📊 Performance Optimization

### Production Checklist

- [ ] **Enable caching:** Add Redis for repeated queries
- [ ] **Use CDN:** CloudFront for static assets
- [ ] **Compress responses:** Enable gzip in Nginx
- [ ] **Monitor logs:** CloudWatch or Datadog
- [ ] **Set rate limits:** Prevent API abuse
- [ ] **Use HTTPS:** SSL certificate (Let's Encrypt free)
- [ ] **Enable CORS properly:** Only allow your domain

### Recommended Production Settings

**Backend (uvicorn):**
```bash
# Use multiple workers for production
uvicorn backend.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info
```

**Frontend (Next.js):**
```bash
# Always use production build
npm run build
npm start
# NOT: npm run dev (development mode is slower)
```

---

## 🎥 Quick Start for Demo Video Recording

**Recommended: Docker Compose (Clean, Consistent)**

```bash
# 1. Ensure .env has OpenAI key
echo OPENAI_API_KEY=sk-... > .env

# 2. Start services
docker-compose up -d --build

# 3. Wait 30 seconds for startup

# 4. Open browser
start http://localhost:3000

# 5. Record your demo!

# 6. Stop when done
docker-compose down
```

---

## 📞 Support

**If deployment fails:**
1. Check logs: `docker-compose logs -f`
2. Verify .env file exists with valid OPENAI_API_KEY
3. Ensure ports 3000 and 8000 are free
4. Run tests: `pytest tests/ -v`

**For production deployment help:**
- AWS Documentation: https://docs.aws.amazon.com
- Vercel Documentation: https://vercel.com/docs
- Render Documentation: https://render.com/docs

---

**Last Updated:** June 15, 2026  
**Deployment tested on:** Windows 11, Ubuntu 22.04, macOS 14
