# ================================================================================================
# NexaFund AI Recommendation System - Quick Start Guide
# ================================================================================================
# This guide will help you set up and run the Python ML recommendation service
# ================================================================================================

## 🎯 Overview

The AI Recommendation System uses:
- **Machine Learning**: TF-IDF + NMF (Non-negative Matrix Factorization)
- **FastAPI**: REST API server on port 8000
- **Real-time Data**: Fetches from PostgreSQL via backend API

## 📋 Prerequisites

### Required Software
- ✅ Python 3.9+ (check: `python --version`)
- ✅ pip (check: `pip --version`)
- ✅ Backend running on port 5050
- ✅ Database with campaigns and users

### Check Prerequisites (PowerShell)
```powershell
# Check Python version
python --version

# Check pip
pip --version

# Check backend is running
curl http://localhost:5050/api/recommender/status
```

## ⚡ Quick Start (PowerShell)

### 1. Navigate to ML Service Directory
```powershell
cd "RS(Nexa Fund)/RecomendationSystem(NF)"
```

### 2. Create Virtual Environment (Recommended)
```powershell
# Create venv
python -m venv venv

# Activate venv (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# If you get execution policy error, run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

Expected output:
```
Successfully installed fastapi uvicorn pandas numpy scikit-learn requests
```

### 4. Set Backend URL (Optional)
```powershell
# Default is http://localhost:5050/api
# Only set if your backend is on different port
$env:BACKEND_API_URL="http://localhost:5050/api"
```

### 5. Start FastAPI Service
```powershell
python run_server_db.py
```

Expected output:
```
🚀 Initializing Database ML Recommendation System...
📡 Backend API URL: http://localhost:5050/api
✅ Database ML Recommendation System initialized successfully!
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 6. Verify Service is Running
Open new PowerShell terminal:
```powershell
# Test status endpoint
curl http://localhost:8000/status

# Test donors endpoint
curl http://localhost:8000/donors

# Test campaigns endpoint
curl http://localhost:8000/campaigns
```

## 🧪 Testing

### Test Recommendations (PowerShell)
```powershell
# Replace USER_ID with actual user ID from database
$body = @{
    donor_id = "cmgmrvdij0004rdis3xq313t6"
    top_k = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/recommendations" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### Test via Backend Proxy
```powershell
# This is how frontend calls it
$body = @{
    donor_id = "cmgmrvdij0004rdis3xq313t6"
    top_k = 5
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5050/api/recommender/recommendations" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## 📊 API Endpoints

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/status` | GET | System status and stats |
| `/donors` | GET | List all donors |
| `/campaigns` | GET | List all campaigns |
| `/recommendations` | POST | Get campaign recommendations |
| `/similar-donors` | POST | Find similar donors |
| `/docs` | GET | Interactive API documentation |

### Interactive API Docs
Open browser: http://localhost:8000/docs

## 🔧 Troubleshooting

### Issue 1: "Cannot open script file... Activate.ps1"
**Solution:** Wrong directory. Navigate to ML folder first:
```powershell
cd "RS(Nexa Fund)/RecomendationSystem(NF)"
```

### Issue 2: "Execution policy error"
**Solution:** Allow script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue 3: "Backend API URL: None"
**Solution:** Backend not running. Start backend first:
```powershell
cd backend
npm run dev
```

### Issue 4: "Failed to load data from backend"
**Solution:** Check backend endpoints:
```powershell
# These must return data:
curl http://localhost:5050/api/recommender/export-donors
curl http://localhost:5050/api/recommender/export-campaigns
```

### Issue 5: "No module named 'fastapi'"
**Solution:** Install dependencies:
```powershell
pip install -r requirements.txt
```

### Issue 6: Port 8000 already in use
**Solution:** Kill existing process or change port:
```powershell
# Find process on port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in run_server_db.py
```

## 🚀 Integration with Main App

### Startup Order
1. ✅ Start Backend (port 5050)
   ```powershell
   cd backend
   npm run dev
   ```

2. ✅ Start Python ML Service (port 8000)
   ```powershell
   cd "RS(Nexa Fund)/RecomendationSystem(NF)"
   python run_server_db.py
   ```

3. ✅ Start Frontend (port 8080)
   ```powershell
   cd frontend
   npm run dev
   ```

### Environment Variables

**Backend `.env`:**
```properties
RECOMMENDER_URL="http://localhost:8000"
```

**Python Service (optional):**
```powershell
$env:BACKEND_API_URL="http://localhost:5050/api"
```

## 📝 Development Notes

### Data Refresh
When new campaigns/users are added, refresh ML model:
```powershell
curl -X POST http://localhost:8000/refresh
```

### Logs
Enable debug logging:
```powershell
# Python service prints logs to console
# Check for:
# ✅ = Success
# ⚠️ = Warning
# ❌ = Error
```

### Performance
- First request: ~2-3 seconds (loads data, trains model)
- Subsequent requests: ~100-200ms (cached)
- Data cached for 5 minutes in frontend

## 🎯 Success Indicators

When everything is working correctly:

1. ✅ Python service starts without errors
2. ✅ `/status` endpoint returns system info
3. ✅ `/donors` and `/campaigns` return data
4. ✅ `/recommendations` returns campaign IDs with scores
5. ✅ Frontend Browse page shows "🎯 Personalized for you" badge
6. ✅ Campaigns are sorted by ML recommendations

## 📚 Additional Resources

- **Interactive API Docs:** http://localhost:8000/docs
- **ML Algorithm:** TF-IDF + NMF (Non-negative Matrix Factorization)
- **Backend API:** http://localhost:5050/api/recommender/
- **Frontend Integration:** `frontend/src/pages/Browse.tsx`

## ❓ Still Need Help?

Check these files:
- `AI_RECOMMENDER_ANALYSIS.md` - Detailed system analysis
- `RS(Nexa Fund)/RecomendationSystem(NF)/README.md` - Original documentation
- Backend logs in terminal
- Python service logs in terminal

## 🎉 Quick Test Script

Save this as `test-ml-service.ps1`:

```powershell
# Test ML Service Quick Script
Write-Host "🧪 Testing ML Recommendation Service..." -ForegroundColor Green

# Test 1: Status
Write-Host "`n1️⃣ Testing /status..." -ForegroundColor Cyan
curl http://localhost:8000/status

# Test 2: Donors
Write-Host "`n2️⃣ Testing /donors..." -ForegroundColor Cyan
curl http://localhost:8000/donors

# Test 3: Campaigns
Write-Host "`n3️⃣ Testing /campaigns..." -ForegroundColor Cyan
curl http://localhost:8000/campaigns

Write-Host "`n✅ All tests complete!" -ForegroundColor Green
Write-Host "Visit http://localhost:8000/docs for interactive testing" -ForegroundColor Yellow
```

Run with: `.\test-ml-service.ps1`
