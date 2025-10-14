// recommendation.routes.ts - Routes for weighted recommendation system

import express from 'express';
import { recommendationController } from '../controllers/recommendation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @route   GET /api/recommendations/personalized
 * @desc    Get personalized campaign recommendations using multi-algorithm scoring
 * @access  Private (requires authentication)
 * @query   top_n - Number of recommendations (default: 20)
 */
router.get('/personalized', authMiddleware, recommendationController.getPersonalizedRecommendations);

/**
 * @route   GET /api/recommendations/trending
 * @desc    Get trending campaigns for non-authenticated users
 * @access  Public
 * @query   top_n - Number of recommendations (default: 20)
 */
router.get('/trending', recommendationController.getTrendingRecommendations);

/**
 * @route   GET /api/recommendations/algorithm-info
 * @desc    Get information about recommendation algorithms and weights
 * @access  Public
 */
router.get('/algorithm-info', recommendationController.getAlgorithmInfo);

export default router;
