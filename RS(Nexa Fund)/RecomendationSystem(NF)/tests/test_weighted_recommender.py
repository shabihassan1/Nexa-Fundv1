# test_weighted_recommender.py - Test script for weighted recommendation engine

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml_recommender_db import DatabaseMLRecommender
from weighted_recommender import WeightedRecommender

def test_weighted_recommender():
    """Test the weighted recommendation engine"""
    
    print("=" * 60)
    print("Testing Weighted Recommendation Engine")
    print("=" * 60)
    
    # Initialize ML recommender
    print("\n1️⃣ Initializing ML Recommender...")
    recommender = DatabaseMLRecommender(n_components=10, backend_url="http://localhost:5050/api")
    
    if not recommender.load_data_from_backend():
        print("❌ Failed to load data from backend")
        return
    
    recommender.create_interaction_matrix(sparsity=0.7)
    recommender.fit_nmf()
    
    # Initialize weighted recommender
    print("\n2️⃣ Initializing Weighted Recommender...")
    weighted_rec = WeightedRecommender(recommender)
    
    # Test with mock user preferences
    print("\n3️⃣ Testing Personalized Recommendations...")
    
    # Get first user ID
    test_user_id = recommender.donor_df.iloc[0]['id']
    print(f"Test User ID: {test_user_id}")
    
    # Mock user preferences
    mock_preferences = {
        'interests': ['education', 'technology'],
        'fundingPreference': 'small',
        'riskTolerance': 'medium',
        'interestKeywords': ['school', 'learning']
    }
    
    print(f"User Preferences: {mock_preferences}")
    
    # Get recommendations
    recommendations = weighted_rec.get_personalized_recommendations(
        user_id=test_user_id,
        user_preferences=mock_preferences,
        top_n=10
    )
    
    print(f"\n📊 Top 10 Personalized Recommendations:")
    print("-" * 60)
    
    for i, rec in enumerate(recommendations, 1):
        print(f"\n{i}. {rec['title']}")
        print(f"   Category: {rec.get('category', 'N/A')}")
        print(f"   Final Score: {rec['recommendationScore']:.3f}")
        print(f"   Badge: {rec['badge']}")
        print(f"   Algorithm Scores:")
        for algo, score in rec['scores'].items():
            print(f"     - {algo}: {score:.3f}")
    
    # Test trending (no preferences)
    print("\n\n4️⃣ Testing Trending Recommendations (No Preferences)...")
    trending = weighted_rec.get_non_personalized_recommendations(top_n=5)
    
    print(f"\n🔥 Top 5 Trending Campaigns:")
    print("-" * 60)
    
    for i, rec in enumerate(trending, 1):
        print(f"\n{i}. {rec['title']}")
        print(f"   Category: {rec.get('category', 'N/A')}")
        print(f"   Trending Score: {rec['recommendationScore']:.3f}")
        print(f"   Badge: {rec['badge']}")
    
    print("\n" + "=" * 60)
    print("✅ Weighted Recommender Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_weighted_recommender()
