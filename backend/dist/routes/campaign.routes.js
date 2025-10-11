"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const express_1 = __importDefault(require("express"));
const campaign_controller_1 = require("../controllers/campaign.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
/**
 * @route   GET /api/campaigns
 * @desc    Get all campaigns with optional filtering
 * @access  Public
 */
router.get('/', campaign_controller_1.campaignController.getAllCampaigns);
/**
 * @route   GET /api/campaigns/stats
 * @desc    Get campaign statistics
 * @access  Private (Admin only)
 */
router.get('/stats', auth_middleware_1.authMiddleware, campaign_controller_1.campaignController.getCampaignStats);
/**
 * @route   GET /api/campaigns/:id
 * @desc    Get a single campaign by ID
 * @access  Public
 */
router.get('/:id', campaign_controller_1.campaignController.getCampaignById);
/**
 * @route   POST /api/campaigns
 * @desc    Create a new campaign
 * @access  Private
 */
router.post('/', auth_middleware_1.authMiddleware, campaign_controller_1.campaignController.createCampaign);
/**
 * @route   PUT /api/campaigns/:id
 * @desc    Update an existing campaign
 * @access  Private (creator or admin only)
 */
router.put('/:id', auth_middleware_1.authMiddleware, campaign_controller_1.campaignController.updateCampaign);
/**
 * @route   DELETE /api/campaigns/:id
 * @desc    Delete a campaign
 * @access  Private (creator or admin only)
 */
router.delete('/:id', auth_middleware_1.authMiddleware, campaign_controller_1.campaignController.deleteCampaign);
exports.default = router;
//# sourceMappingURL=campaign.routes.js.map