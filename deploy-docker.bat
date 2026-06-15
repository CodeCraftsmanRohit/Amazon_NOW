@echo off
echo ===============================================
echo Amazon Now AI - Docker Deployment
echo ===============================================
echo.

if not exist .env (
    echo [ERROR] .env file not found!
    echo Please create .env and add: OPENAI_API_KEY=sk-...
    pause
    exit /b 1
)

echo [1/2] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker not found! Install Docker Desktop
    pause
    exit /b 1
)

echo [2/2] Building and starting...
docker-compose down
docker-compose up -d --build

echo.
echo Waiting for services...
timeout /t 15 /nobreak >nul

echo.
echo ===============================================
echo Deployment complete!
echo ===============================================
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo.
echo To stop: docker-compose down
echo.
pause
start http://localhost:3000
