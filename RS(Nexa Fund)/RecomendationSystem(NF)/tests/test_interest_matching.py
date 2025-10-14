# test_interest_matching.py - Test if interest matching works correctly

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml_recommender_db import DatabaseMLRecommender
from weighted_recommender import WeightedRecommender

def test_interest_matching():
    """Test interest matching algorithm specifically"""
    
    print("=" * 80)
    print("INTEREST MATCHING VALIDATION TEST")
    print("=" * 80)
    
    # Initialize ML recommender
    print("\n📡 Connecting to backend and loading data...")
    recommender = DatabaseMLRecommender(n_components=10, backend_url="http://localhost:5050/api")
    
    if not recommender.load_data_from_backend():
        print("❌ Failed to load data from backend. Make sure backend is running on port 5050.")
        return
    
    # Check what categories exist in campaigns
    print("\n" + "=" * 80)
    print("1️⃣ CAMPAIGN CATEGORIES IN DATABASE")
    print("=" * 80)
    
    if 'category' in recommender.campaign_df.columns:
        unique_categories = recommender.campaign_df['category'].unique()
        print(f"\n✅ Found {len(unique_categories)} unique categories:")
        for i, cat in enumerate(unique_categories, 1):
            count = len(recommender.campaign_df[recommender.campaign_df['category'] == cat])
            print(f"   {i}. '{cat}' - {count} campaigns")
    else:
        print("❌ No 'category' column found in campaign data!")
        return
    
    # Check user preferences format
    print("\n" + "=" * 80)
    print("2️⃣ USER PREFERENCES FORMAT")
    print("=" * 80)
    
    interest_categories = [
        'education',
        'healthcare',
        'technology',
        'environment',
        'arts-culture',
        'community-development',
        'emergency-relief',
        'animal-welfare',
    ]
    
    print("\n✅ Expected preference categories:")
    for i, cat in enumerate(interest_categories, 1):
        print(f"   {i}. '{cat}'")
    
    # Check for category mismatch
    print("\n" + "=" * 80)
    print("3️⃣ CATEGORY MATCHING ANALYSIS")
    print("=" * 80)
    
    campaign_categories_lower = [cat.lower() for cat in unique_categories]
    
    print("\n🔍 Checking if preference categories match campaign categories:")
    matches = []
    partial_matches = []
    no_matches = []
    
    for pref_cat in interest_categories:
        pref_lower = pref_cat.lower()
        
        # Exact match
        if pref_lower in campaign_categories_lower:
            matches.append(pref_cat)
            print(f"   ✅ '{pref_cat}' - EXACT MATCH found in campaigns")
        else:
            # Check for partial/fuzzy matches
            found_partial = False
            for camp_cat in unique_categories:
                camp_lower = camp_cat.lower()
                if pref_lower in camp_lower or camp_lower in pref_lower:
                    partial_matches.append((pref_cat, camp_cat))
                    print(f"   ⚠️  '{pref_cat}' - PARTIAL MATCH with '{camp_cat}'")
                    found_partial = True
                    break
            
            if not found_partial:
                no_matches.append(pref_cat)
                print(f"   ❌ '{pref_cat}' - NO MATCH in campaigns")
    
    # Summary
    print("\n" + "-" * 80)
    print(f"Summary: {len(matches)} exact, {len(partial_matches)} partial, {len(no_matches)} no match")
    print("-" * 80)
    
    # Test interest matching algorithm
    print("\n" + "=" * 80)
    print("4️⃣ TESTING INTEREST MATCHING ALGORITHM")
    print("=" * 80)
    
    weighted_rec = WeightedRecommender(recommender)
    
    # Test with different preference combinations
    test_cases = [
        {
            'name': 'Education + Technology',
            'preferences': {
                'interests': ['education', 'technology'],
                'fundingPreference': 'medium',
                'riskTolerance': 'medium',
                'interestKeywords': ['school', 'learning', 'software']
            }
        },
        {
            'name': 'Healthcare Only',
            'preferences': {
                'interests': ['healthcare'],
                'fundingPreference': 'large',
                'riskTolerance': 'low',
                'interestKeywords': ['hospital', 'medicine', 'clinic']
            }
        },
        {
            'name': 'Environment + Animal Welfare',
            'preferences': {
                'interests': ['environment', 'animal-welfare'],
                'fundingPreference': 'small',
                'riskTolerance': 'high',
                'interestKeywords': ['climate', 'wildlife', 'conservation']
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n📝 Test Case: {test_case['name']}")
        print(f"   Interests: {test_case['preferences']['interests']}")
        print(f"   Keywords: {test_case['preferences']['interestKeywords']}")
        
        # Test each campaign against preferences
        campaigns = recommender.campaign_df.to_dict('records')
        scored_campaigns = []
        
        for campaign in campaigns[:10]:  # Test first 10 campaigns
            interest_score = weighted_rec.compute_interest_match_score(
                test_case['preferences'], 
                campaign
            )
            
            if interest_score > 0:
                scored_campaigns.append({
                    'title': campaign['title'][:50] + '...' if len(campaign['title']) > 50 else campaign['title'],
                    'category': campaign.get('category', 'N/A'),
                    'interest_score': interest_score
                })
        
        if scored_campaigns:
            scored_campaigns.sort(key=lambda x: x['interest_score'], reverse=True)
            print(f"\n   ✅ Found {len(scored_campaigns)} matching campaigns (showing top 5):")
            for i, camp in enumerate(scored_campaigns[:5], 1):
                print(f"      {i}. Score: {camp['interest_score']:.3f} | Category: {camp['category']} | {camp['title']}")
        else:
            print(f"\n   ❌ No campaigns matched the interests!")
            print(f"   This indicates a PROBLEM with category matching.")
    
    # Full recommendation test
    print("\n" + "=" * 80)
    print("5️⃣ FULL RECOMMENDATION SYSTEM TEST")
    print("=" * 80)
    
    if len(recommender.donor_df) > 0:
        test_user_id = recommender.donor_df.iloc[0]['id']
        test_user_name = recommender.donor_df.iloc[0].get('name', 'Unknown')
        
        print(f"\n👤 Test User: {test_user_name} (ID: {test_user_id})")
        
        # Initialize weighted recommender properly
        recommender.create_interaction_matrix(sparsity=0.7)
        recommender.fit_nmf()
        
        mock_preferences = {
            'interests': ['education', 'technology'],
            'fundingPreference': 'small',
            'riskTolerance': 'medium',
            'interestKeywords': ['school', 'software', 'learning']
        }
        
        print(f"   Preferences: {mock_preferences['interests']}")
        
        recommendations = weighted_rec.get_personalized_recommendations(
            user_id=test_user_id,
            user_preferences=mock_preferences,
            top_n=10
        )
        
        if recommendations:
            print(f"\n   ✅ Generated {len(recommendations)} recommendations")
            print("\n   📊 Top 5 Recommendations:")
            print("   " + "-" * 76)
            
            for i, rec in enumerate(recommendations[:5], 1):
                print(f"\n   {i}. {rec['title'][:60]}")
                print(f"      Category: {rec.get('category', 'N/A')}")
                print(f"      Final Score: {rec['recommendationScore']:.3f} | Badge: {rec['badge']}")
                print(f"      Algorithm Breakdown:")
                print(f"        • Interest Match:    {rec['scores'].get('interest', 0):.3f} (40% weight)")
                print(f"        • Collaborative:     {rec['scores'].get('collaborative', 0):.3f} (30% weight)")
                print(f"        • Content Similarity: {rec['scores'].get('content', 0):.3f} (20% weight)")
                print(f"        • Trending:          {rec['scores'].get('trending', 0):.3f} (10% weight)")
            
            # Analyze interest scores
            avg_interest_score = sum(r['scores'].get('interest', 0) for r in recommendations) / len(recommendations)
            print(f"\n   📈 Average Interest Match Score: {avg_interest_score:.3f}")
            
            if avg_interest_score < 0.1:
                print(f"   ⚠️  WARNING: Very low interest match scores!")
                print(f"   This suggests categories don't match between preferences and campaigns.")
        else:
            print("   ❌ No recommendations generated!")
    
    print("\n" + "=" * 80)
    print("✅ INTEREST MATCHING TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_interest_matching()
