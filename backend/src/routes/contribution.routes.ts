import { Router } from 'express';
import { contributionController } from '../controllers/contribution.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/contributions
 * @desc    Create a new contribution
 * @access  Private
 */
router.post('/', authMiddleware, contributionController.createContribution);

/**
 * @route   GET /api/contributions/campaign/:campaignId
 * @desc    Get all contributions for a specific campaign
 * @access  Public
 */
router.get('/campaign/:campaignId', contributionController.getContributionsByCampaign);

/**
 * @route   GET /api/contributions/user/:userId
 * @desc    Get all contributions by a specific user
 * @access  Private
 */
router.get('/user/:userId', authMiddleware, contributionController.getContributionsByUser);

/**
 * @route   GET /api/contributions/stats/:campaignId
 * @desc    Get contribution statistics for a campaign
 * @access  Public
 */
router.get('/stats/:campaignId', contributionController.getCampaignStats);

export default router; 