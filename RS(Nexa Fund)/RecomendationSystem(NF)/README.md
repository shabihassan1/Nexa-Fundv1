# NexaFund AI Recommendation System

ML-powered personalized campaign recommendations using 4 weighted algorithms.

## Quick Start

```powershell
# From: RS(Nexa Fund)/RecomendationSystem(NF)/
.\start-ml-service.ps1
```

**Prerequisites**: Python 3.9+, Backend running on port 5050

## What It Does

**4 Algorithm System:**
- **Interest Match (60%)** - User preferences → campaign categories
- **Content Similarity (30%)** - Keyword overlap with campaign text  
- **Collaborative Filtering (5%)** - User behavior patterns
- **Trending (5%)** - Popularity + urgency boost

**Endpoints** (Port 8000):
- `GET /personalized/{user_id}?top_n=10` - Personalized recommendations
- `GET /trending?top_n=10` - Trending campaigns
- `GET /algorithm-info` - Current weights/config

## Architecture

```
FastAPI (Port 8000) → Neon PostgreSQL
    ↓
weighted_recommender.py (4 algorithms)
    ↓
ml_recommender_db.py (DB layer)
```

**Auto-refresh**: Models retrain after new contributions

## Files

- `start-ml-service.ps1` - Startup script with health checks
- `fastapi_app_db.py` - REST API server (713 lines)
- `weighted_recommender.py` - Core algorithm logic (415 lines)
- `ml_recommender_db.py` - Database integration (542 lines)
- `requirements.txt` - Python dependencies

## Integration

Backend calls ML service → Frontend displays badges:
- 🌟 **Top Match** (≥35%)
- 🎯 **Recommended** (20-35%)

See `Extra Docs/RECOMMENDATION_SYSTEM_PLAN.md` for full details.
