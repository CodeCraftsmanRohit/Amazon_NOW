@echo off
echo ===============================================
echo Amazon Now AI - Local Deployment
echo ===============================================
echo.

if not exist .env (
    echo [ERROR] .env file not found!
    echo Please create .env and add: OPENAI_API_KEY=sk-...
    pause
    exit /b 1
)

echo [1/3] Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found! Install Python 3.12+
    pause
    exit /b 1
)

echo [2/3] Setting up backend...
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt --quiet

echo [3/3] Starting servers...
start "Backend" cmd /k "venv\Scripts\activate && uvicorn backend.main:app --reload"
timeout /t 3 /nobreak >nul
cd frontend
start "Frontend" cmd /k "npm install && npm run dev"

echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo.
pause
