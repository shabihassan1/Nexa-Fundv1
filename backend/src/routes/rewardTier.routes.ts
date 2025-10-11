import { Router } from 'express';
import { rewardTierController } from '../controllers/rewardTier.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Get all reward tiers for a campaign
router.get('/campaign/:campaignId', rewardTierController.getRewardTiersByCampaign);

// Get a single reward tier by ID
router.get('/:id', rewardTierController.getRewardTierById);

// Create a new reward tier (requires authentication)
router.post('/', authMiddleware, rewardTierController.createRewardTier);

// Update a reward tier (requires authentication)
router.put('/:id', authMiddleware, rewardTierController.updateRewardTier);

// Delete a reward tier (requires authentication)
router.delete('/:id', authMiddleware, rewardTierController.deleteRewardTier);

export default router; 