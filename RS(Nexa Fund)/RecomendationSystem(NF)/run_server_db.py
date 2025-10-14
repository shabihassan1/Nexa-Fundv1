#!/usr/bin/env python3
"""
Run script for Database ML Recommendation System
This version fetches real data from your PostgreSQL database via the backend API
"""

import os
import sys
from pathlib import Path

def main():
    print("🚀 Starting Database ML Recommendation System FastAPI Server")
    print("=" * 60)
    print("📊 Data Source: PostgreSQL Database via Backend API")
    print("🔗 Backend URL: http://localhost:5050/api")
    print("🌐 Recommender URL: http://localhost:8000")
    print("=" * 60)
    
    # Check if required files exist
    required_files = [
        "ml_recommender_db.py",
        "fastapi_app_db.py", 
        "embed_utils_tfidf.py"
    ]
    
    missing_files = [f for f in required_files if not Path(f).exists()]
    if missing_files:
        print(f"❌ Missing required files: {missing_files}")
        print("Please ensure all files are in the current directory")
        return False
    
    print("✅ All required files found")
    
    # Check if backend is accessible
    try:
        import requests
        backend_url = os.getenv('BACKEND_API_URL', 'http://localhost:5050/api')
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is accessible")
        else:
            print(f"⚠️  Backend responded with status: {response.status_code}")
    except (requests.RequestException, ConnectionError, TimeoutError) as e:
        print(f"⚠️  Could not reach backend: {e}")
        print("Make sure your backend is running on http://localhost:5050")
    
    print("\n📋 Available endpoints:")
    print("   • GET  / - Root endpoint with API info")
    print("   • GET  /status - System status")
    print("   • GET  /donors - List all donors from database")
    print("   • GET  /campaigns - List all campaigns from database")
    print("   • POST /recommendations - Get campaign recommendations")
    print("   • POST /similar-donors - Get similar donors")
    print("   • GET  /test - Test endpoint with database data")
    print("   • POST /refresh - Refresh data and retrain model")
    
    print("\n📖 Interactive docs: http://localhost:8000/docs")
    print("📖 ReDoc docs: http://localhost:8000/redoc")
    print("=" * 60)
    
    # Start the FastAPI server
    try:
        import uvicorn
        uvicorn.run(
            "fastapi_app_db:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except (ImportError, OSError, RuntimeError) as e:
        print(f"❌ Error starting server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 