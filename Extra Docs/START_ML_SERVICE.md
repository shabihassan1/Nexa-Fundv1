# Starting the ML Recommendation Service

## Quick Start

### Step 1: Navigate to ML Service Directory
```powershell
cd "RS(Nexa Fund)\RecomendationSystem(NF)"
```

### Step 2: Start the FastAPI Server
```powershell
python -m uvicorn fastapi_app_db:app --reload --port 8000
```

### Step 3: Verify Service is Running
Open browser to: http://localhost:8000/docs

You should see the FastAPI Swagger documentation with endpoints:
- POST /personalized
- POST /trending
- POST /refresh
- GET /algorithm-info

## Troubleshooting

### Error: Module not found
Install dependencies:
```powershell
pip install fastapi uvicorn numpy pandas scikit-learn psycopg2-binary python-dotenv requests
```

### Error: Database connection failed
Check your `.env` file has correct Neon PostgreSQL credentials:
```
DATABASE_URL=postgresql://user:password@host/database
```

### Port already in use
Use a different port:
```powershell
python -m uvicorn fastapi_app_db:app --reload --port 8001
```

Then update frontend to use port 8001 in `recommendationService.ts`

## Testing the Service

### Test Personalized Recommendations
```powershell
curl -X POST http://localhost:8000/personalized `
  -H "Content-Type: application/json" `
  -d '{"user_id": "YOUR_USER_ID", "top_n": 10}'
```

### Test Trending Campaigns
```powershell
curl -X POST http://localhost:8000/trending `
  -H "Content-Type: application/json" `
  -d '{"top_n": 10}'
```

## Integration with Frontend

Once the ML service is running:
1. ✅ Backend `/api/recommendations/personalized` will call the ML service
2. ✅ Frontend Browse page will fetch recommendations
3. ✅ Campaigns will be separated into Top Matches, Recommended, Other sections
4. ✅ Badges will appear on campaign cards

## Expected Behavior

### With ML Service Running:
- Browse page shows 3 sections (Top Matches, Recommended, Other)
- Campaign cards have badges (⭐ Top Match, 🎯 Recommended)
- Right sidebar shows personalization widgets

### Without ML Service:
- Browse page shows "All Campaigns" (no sections)
- Backend gracefully falls back to regular campaign list
- Console shows warning: "⚠️ Recommendation service unavailable"
