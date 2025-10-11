"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rewardTier_controller_1 = require("../controllers/rewardTier.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Get all reward tiers for a campaign
router.get('/campaign/:campaignId', rewardTier_controller_1.rewardTierController.getRewardTiersByCampaign);
// Get a single reward tier by ID
router.get('/:id', rewardTier_controller_1.rewardTierController.getRewardTierById);
// Create a new reward tier (requires authentication)
router.post('/', auth_middleware_1.authMiddleware, rewardTier_controller_1.rewardTierController.createRewardTier);
// Update a reward tier (requires authentication)
router.put('/:id', auth_middleware_1.authMiddleware, rewardTier_controller_1.rewardTierController.updateRewardTier);
// Delete a reward tier (requires authentication)
router.delete('/:id', auth_middleware_1.authMiddleware, rewardTier_controller_1.rewardTierController.deleteRewardTier);
exports.default = router;
//# sourceMappingURL=rewardTier.routes.js.map