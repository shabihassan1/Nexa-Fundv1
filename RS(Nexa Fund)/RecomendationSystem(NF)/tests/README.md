# Recommendation System Tests

This folder contains test scripts for validating the ML recommendation engine.

## Test Files

### `test_weighted_recommender.py`
Tests the complete weighted recommendation system with mock user preferences.

**Run:**
```bash
python tests/test_weighted_recommender.py
```

**Tests:**
- Personalized recommendations with preferences
- Trending recommendations (no preferences)
- Algorithm scoring breakdown
- Badge classification

---

### `test_interest_matching.py`
Comprehensive validation of interest matching algorithm and category alignment.

**Run:**
```bash
python tests/test_interest_matching.py
```

**Tests:**
- Campaign category analysis
- Category matching (exact, partial, fuzzy)
- Interest scoring for different preference combinations
- Full recommendation system integration
- Algorithm breakdown per campaign

---

### `quick_test.py`
Quick unit test for improved fuzzy matching logic.

**Run:**
```bash
python tests/quick_test.py
```

**Tests:**
- Healthcare → Health & Fitness matching
- Arts-culture → Arts matching
- Community-development → Community matching

---

## Test Results Summary

**Status:** ✅ All tests passing

**Interest Matching:** 7.5/10 (working correctly, enhanced fuzzy matching)
- Exact matches: 1.0 score
- Partial matches: 0.7-0.8 score
- Word overlap: 0.5-0.7 score

**Recommendation Quality:**
- With preferences: 0.3-0.4 final scores (limited by 1 contribution in DB)
- Expected with 10+ contributions: 0.6-0.9 final scores
- Algorithm properly prioritizes matching categories

**Validation:** System working as designed, needs more interaction data for full potential.

See `INTEREST_MATCHING_VALIDATION.md` for detailed analysis.
