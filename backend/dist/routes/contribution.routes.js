"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contribution_controller_1 = require("../controllers/contribution.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/contributions
 * @desc    Create a new contribution
 * @access  Private
 */
router.post('/', auth_middleware_1.authMiddleware, contribution_controller_1.contributionController.createContribution);
/**
 * @route   GET /api/contributions/campaign/:campaignId
 * @desc    Get all contributions for a specific campaign
 * @access  Public
 */
router.get('/campaign/:campaignId', contribution_controller_1.contributionController.getContributionsByCampaign);
/**
 * @route   GET /api/contributions/user/:userId
 * @desc    Get all contributions by a specific user
 * @access  Private
 */
router.get('/user/:userId', auth_middleware_1.authMiddleware, contribution_controller_1.contributionController.getContributionsByUser);
/**
 * @route   GET /api/contributions/stats/:campaignId
 * @desc    Get contribution statistics for a campaign
 * @access  Public
 */
router.get('/stats/:campaignId', contribution_controller_1.contributionController.getCampaignStats);
exports.default = router;
//# sourceMappingURL=contribution.routes.js.map