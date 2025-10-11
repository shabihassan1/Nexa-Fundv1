"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const milestone_controller_1 = require("../controllers/milestone.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes
router.use(auth_middleware_1.authMiddleware);
// Campaign milestone routes
router.post('/campaigns/:campaignId/milestones', milestone_controller_1.MilestoneController.createMilestones);
router.get('/campaigns/:campaignId/milestones', milestone_controller_1.MilestoneController.getMilestones);
router.get('/campaigns/:campaignId/milestones/validate', milestone_controller_1.MilestoneController.validateRequirements);
router.get('/campaigns/:campaignId/milestones/stats', milestone_controller_1.MilestoneController.getMilestoneStats);
router.get('/campaigns/:campaignId/escrow', milestone_controller_1.MilestoneController.getEscrowTransactions);
// Individual milestone routes
router.get('/milestones/:milestoneId', milestone_controller_1.MilestoneController.getMilestone);
router.put('/milestones/:milestoneId', milestone_controller_1.MilestoneController.updateMilestone);
router.post('/milestones/:milestoneId/submit', milestone_controller_1.MilestoneController.submitMilestone);
router.post('/milestones/:milestoneId/vote', milestone_controller_1.MilestoneController.voteOnMilestone);
// Admin only routes
router.post('/milestones/:milestoneId/start-voting', (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), milestone_controller_1.MilestoneController.startVoting);
router.post('/milestones/:milestoneId/approve', (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), milestone_controller_1.MilestoneController.approveMilestone);
router.post('/milestones/:milestoneId/reject', (0, auth_middleware_1.requireRole)(['ADMIN', 'SUPER_ADMIN']), milestone_controller_1.MilestoneController.rejectMilestone);
// User voting history
router.get('/votes/my-votes', milestone_controller_1.MilestoneController.getUserVotes);
exports.default = router;
//# sourceMappingURL=milestone.routes.js.map