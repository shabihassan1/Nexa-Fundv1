import { Router } from 'express';
import { updateController } from '../controllers/update.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Get all updates for a campaign (public)
router.get('/campaigns/:campaignId/updates', updateController.getUpdatesByCampaign);

// Get single update by ID (public)
router.get('/updates/:id', updateController.getUpdateById);

// Create new update (auth required, creator only)
router.post('/updates', authMiddleware, updateController.createUpdate);

// Update existing update (auth required, creator only)
router.put('/updates/:id', authMiddleware, updateController.updateUpdate);

// Delete update (auth required, creator or admin only)
router.delete('/updates/:id', authMiddleware, updateController.deleteUpdate);

export default router; 