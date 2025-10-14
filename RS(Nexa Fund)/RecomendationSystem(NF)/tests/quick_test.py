# quick_test.py - Quick validation of interest matching improvements

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from weighted_recommender import WeightedRecommender

# Mock campaign data
mock_campaigns = [
    {'id': '1', 'title': 'Medical Clinic', 'category': 'Health & Fitness', 'description': 'hospital clinic', 'targetAmount': 10000, 'status': 'ACTIVE'},
    {'id': '2', 'title': 'Art Gallery', 'category': 'Arts', 'description': 'paintings sculptures', 'targetAmount': 5000, 'status': 'ACTIVE'},
    {'id': '3', 'title': 'Community Center', 'category': 'Community', 'description': 'neighborhood development', 'targetAmount': 15000, 'status': 'ACTIVE'},
]

# Mock weighted recommender (we only need the compute_interest_match_score method)
class MockRecommender:
    pass

weighted_rec = WeightedRecommender(MockRecommender())

print("=" * 80)
print("TESTING IMPROVED INTEREST MATCHING")
print("=" * 80)

test_preferences = [
    {
        'name': 'Healthcare preference',
        'prefs': {'interests': ['healthcare'], 'fundingPreference': 'medium', 'riskTolerance': 'medium', 'interestKeywords': []},
        'expected_match': 'Health & Fitness'
    },
    {
        'name': 'Arts-culture preference',
        'prefs': {'interests': ['arts-culture'], 'fundingPreference': 'small', 'riskTolerance': 'high', 'interestKeywords': []},
        'expected_match': 'Arts'
    },
    {
        'name': 'Community-development preference',
        'prefs': {'interests': ['community-development'], 'fundingPreference': 'large', 'riskTolerance': 'low', 'interestKeywords': []},
        'expected_match': 'Community'
    },
]

for test in test_preferences:
    print(f"\n{'='*80}")
    print(f"Test: {test['name']}")
    print(f"User interests: {test['prefs']['interests']}")
    print(f"Expected to match: {test['expected_match']}")
    print("-" * 80)
    
    best_match = None
    best_score = 0
    
    for campaign in mock_campaigns:
        score = weighted_rec.compute_interest_match_score(test['prefs'], campaign)
        print(f"  Campaign '{campaign['title']}' (Category: {campaign['category']})")
        print(f"    → Interest Score: {score:.3f}")
        
        if score > best_score:
            best_score = score
            best_match = campaign
    
    if best_match and best_match['category'] == test['expected_match']:
        print(f"\n  ✅ SUCCESS: Best match is '{best_match['category']}' (score: {best_score:.3f})")
    else:
        print(f"\n  ❌ FAILED: Expected '{test['expected_match']}' but got '{best_match['category'] if best_match else 'None'}'")

print(f"\n{'='*80}")
print("TEST COMPLETE")
print("=" * 80)
