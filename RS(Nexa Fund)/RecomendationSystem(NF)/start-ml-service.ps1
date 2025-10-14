# ===================================================================
# NexaFund ML Recommendation Service - Startup Script
# ===================================================================
# This script starts the FastAPI ML recommendation service
# Run from: RS(Nexa Fund)/RecomendationSystem(NF)/
#
# Usage: .\start-ml-service.ps1
# If execution policy error, run first:
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# ===================================================================

# Ensure script stops on errors
$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  NexaFund AI Recommendation System - Startup" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Host "ERROR: Python not found! Please install Python 3.9+ from python.org" -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}
$pythonVersion = python --version 2>&1
Write-Host "SUCCESS: Python: $pythonVersion" -ForegroundColor Green

# Check if we're in the correct directory
if (-not (Test-Path "run_server_db.py")) {
    Write-Host "ERROR: run_server_db.py not found!" -ForegroundColor Red
    Write-Host "Please run this script from: RS(Nexa Fund)/RecomendationSystem(NF)/" -ForegroundColor Yellow
    exit 1
}

# Set environment variable (must be done before backend check)
if (-not $env:BACKEND_API_URL) {
    $env:BACKEND_API_URL = "http://localhost:5050/api"
}

# Check if backend is running
Write-Host ""
Write-Host "Checking backend connection..." -ForegroundColor Yellow
Write-Host "   Using backend URL: $env:BACKEND_API_URL" -ForegroundColor Cyan
try {
    $null = Invoke-WebRequest -Uri "$env:BACKEND_API_URL/recommender/export-donors" -TimeoutSec 3 -ErrorAction Stop -UseBasicParsing
    Write-Host "SUCCESS: Backend connected successfully" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Backend not responding at $env:BACKEND_API_URL" -ForegroundColor Yellow
    Write-Host "   Make sure backend is running in another terminal:" -ForegroundColor Yellow
    Write-Host "   cd backend; npm run dev" -ForegroundColor Cyan
    Write-Host "   ML service will start anyway (backend check on first request)..." -ForegroundColor Yellow
}

# Start the service
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  Starting FastAPI ML Recommendation Service..." -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Service URL: http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs:    http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  Backend API: $env:BACKEND_API_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""

# Run the service
Write-Host "Starting Python service..." -ForegroundColor Cyan
python run_server_db.py
$exitCode = $LASTEXITCODE

# Check if service exited with error
if ($exitCode -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Service stopped with error code: $exitCode" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if port 8000 is available:" -ForegroundColor Yellow
    Write-Host "   netstat -ano | findstr :8000" -ForegroundColor Cyan
    Write-Host "2. Check dependencies are installed:" -ForegroundColor Yellow
    Write-Host "   .\venv\Scripts\pip.exe list" -ForegroundColor Cyan
    Write-Host "3. Verify run_server_db.py exists:" -ForegroundColor Yellow
    Write-Host "   Get-Item run_server_db.py" -ForegroundColor Cyan
    Write-Host "4. Check Python version (need 3.9+):" -ForegroundColor Yellow
    Write-Host "   python --version" -ForegroundColor Cyan
    Write-Host "5. See SETUP_GUIDE.md for detailed help" -ForegroundColor Yellow
    Write-Host ""
    exit $exitCode
}
