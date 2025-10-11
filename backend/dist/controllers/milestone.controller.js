"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilestoneController = void 0;
const database_1 = require("../config/database");
const milestoneService_1 = require("../services/milestoneService");
const zod_1 = require("zod");
// Simple logging function
const safeLog = (message, data) => {
    console.log(`[${new Date().toISOString()}] ${message}`, data || '');
};
// Validation schemas
const createMilestonesSchema = zod_1.z.object({
    milestones: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        description: zod_1.z.string().min(1, 'Description is required'),
        amount: zod_1.z.number().positive('Amount must be positive'),
        deadline: zod_1.z.string().transform((str) => new Date(str)),
        order: zod_1.z.number().positive('Order must be positive')
    })).min(1, 'At least one milestone is required')
});
const submitMilestoneSchema = zod_1.z.object({
    evidence: zod_1.z.any(),
    description: zod_1.z.string().min(1, 'Description is required')
});
const voteSchema = zod_1.z.object({
    isApproval: zod_1.z.boolean(),
    comment: zod_1.z.string().optional()
});
class MilestoneController {
    // Create milestones for a campaign
    static async createMilestones(req, res) {
        try {
            const { campaignId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            // Validate request body
            const parsedData = createMilestonesSchema.parse(req.body);
            const milestones = parsedData.milestones;
            // Check if user owns the campaign
            const campaign = await database_1.prisma.campaign.findUnique({
                where: { id: campaignId },
                include: { milestones: true }
            });
            if (!campaign) {
                res.status(404).json({ error: 'Campaign not found' });
                return;
            }
            if (campaign.creatorId !== userId) {
                res.status(403).json({ error: 'Only campaign creator can create milestones' });
                return;
            }
            // Check if campaign already has milestones
            if (campaign.milestones.length > 0) {
                res.status(400).json({ error: 'Campaign already has milestones' });
                return;
            }
            const createdMilestones = await milestoneService_1.MilestoneService.createMilestones(campaignId, milestones);
            res.status(201).json({
                message: 'Milestones created successfully',
                milestones: createdMilestones
            });
        }
        catch (error) {
            safeLog('Error in createMilestones controller', { error: error?.message });
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Validation error',
                    details: error.errors
                });
                return;
            }
            res.status(500).json({ error: error?.message || 'Failed to create milestones' });
        }
    }
    // Get milestones for a campaign
    static async getMilestones(req, res) {
        try {
            const { campaignId } = req.params;
            const milestones = await database_1.prisma.milestone.findMany({
                where: { campaignId },
                include: {
                    votes: {
                        include: {
                            user: {
                                select: { id: true, name: true }
                            }
                        }
                    },
                    submissions: true
                },
                orderBy: { order: 'asc' }
            });
            res.json({ milestones });
        }
        catch (error) {
            safeLog('Error in getMilestones controller', { error: error?.message });
            res.status(500).json({ error: 'Failed to fetch milestones' });
        }
    }
    // Get single milestone details
    static async getMilestone(req, res) {
        try {
            const { milestoneId } = req.params;
            const milestone = await database_1.prisma.milestone.findUnique({
                where: { id: milestoneId },
                include: {
                    campaign: {
                        select: { id: true, title: true, creatorId: true }
                    },
                    votes: {
                        include: {
                            user: {
                                select: { id: true, name: true }
                            }
                        }
                    },
                    submissions: true,
                    escrowTransactions: true
                }
            });
            if (!milestone) {
                res.status(404).json({ error: 'Milestone not found' });
                return;
            }
            res.json({ milestone });
        }
        catch (error) {
            safeLog('Error in getMilestone controller', { error: error?.message });
            res.status(500).json({ error: 'Failed to fetch milestone' });
        }
    }
    // Submit milestone for review
    static async submitMilestone(req, res) {
        try {
            const { milestoneId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            // Validate request body
            const parsedData = submitMilestoneSchema.parse(req.body);
            const submissionData = parsedData;
            const result = await milestoneService_1.MilestoneService.submitMilestone(milestoneId, userId, submissionData);
            res.json({
                message: 'Milestone submitted successfully',
                milestone: result.milestone,
                submission: result.submission
            });
        }
        catch (error) {
            safeLog('Error in submitMilestone controller', { error: error?.message });
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Validation error',
                    details: error.errors
                });
                return;
            }
            res.status(500).json({ error: error?.message || 'Failed to submit milestone' });
        }
    }
    // Start voting for a milestone (admin only)
    static async startVoting(req, res) {
        try {
            const { milestoneId } = req.params;
            const userRole = req.user?.role;
            if (!userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }
            const milestone = await milestoneService_1.MilestoneService.startVoting(milestoneId);
            res.json({
                message: 'Voting started successfully',
                milestone
            });
        }
        catch (error) {
            safeLog('Error in startVoting controller', { error: error?.message });
            res.status(500).json({ error: error?.message || 'Failed to start voting' });
        }
    }
    // Vote on milestone
    static async voteOnMilestone(req, res) {
        try {
            const { milestoneId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            // Validate request body
            const parsedData = voteSchema.parse(req.body);
            const voteData = parsedData;
            const result = await milestoneService_1.MilestoneService.voteOnMilestone(milestoneId, userId, voteData);
            res.json({
                message: 'Vote cast successfully',
                vote: result.vote,
                milestone: result.milestone
            });
        }
        catch (error) {
            safeLog('Error in voteOnMilestone controller', { error: error?.message });
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Validation error',
                    details: error.errors
                });
                return;
            }
            res.status(500).json({ error: error?.message || 'Failed to cast vote' });
        }
    }
    // Approve milestone (admin only)
    static async approveMilestone(req, res) {
        try {
            const { milestoneId } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }
            const result = await milestoneService_1.MilestoneService.approveMilestone(milestoneId, userId || '');
            res.json({
                message: 'Milestone approved and funds released',
                milestone: result.milestone,
                escrowTransaction: result.escrowTransaction
            });
        }
        catch (error) {
            safeLog('Error in approveMilestone controller', { error: error?.message });
            res.status(500).json({ error: error?.message || 'Failed to approve milestone' });
        }
    }
    // Reject milestone (admin only)
    static async rejectMilestone(req, res) {
        try {
            const { milestoneId } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            const { reason } = req.body;
            if (!userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
                res.status(403).json({ error: 'Admin access required' });
                return;
            }
            if (!reason) {
                res.status(400).json({ error: 'Rejection reason is required' });
                return;
            }
            const milestone = await milestoneService_1.MilestoneService.rejectMilestone(milestoneId, userId || '', reason);
            res.json({
                message: 'Milestone rejected',
                milestone
            });
        }
        catch (error) {
            safeLog('Error in rejectMilestone controller', { error: error?.message });
            res.status(500).json({ error: error?.message || 'Failed to reject milestone' });
        }
    }
    // Validate campaign milestone requirements
    static async validateRequirements(req, res) {
        try {
            const { campaignId } = req.params;
            const validation = await milestoneService_1.MilestoneService.validateMilestoneRequirements(campaignId);
            res.json(validation);
        }
        catch (error) {
            safeLog('Error in validateRequirements controller', { error: error?.message });
            res.status(500).json({ error: 'Failed to validate milestone requirements' });
        }
    }
    // Get milestone statistics for a campaign
    static async getMilestoneStats(req, res) {
        try {
            const { campaignId } = req.params;
            const stats = await milestoneService_1.MilestoneService.getMilestoneStats(campaignId);
            res.json({ stats });
        }
        catch (error) {
            safeLog('Error in getMilestoneStats controller', { error: error?.message });
            res.status(500).json({ error: 'Failed to fetch milestone statistics' });
        }
    }
    // Get user's voting history
    static async getUserVotes(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            const votes = await database_1.prisma.vote.findMany({
                where: { userId },
                include: {
                    milestone: {
                        include: {
                            campaign: {
                                select: { id: true, title: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ votes });
        }
        catch (error) {
            safeLog('Error in getUserVotes controller', { error: error?.message });
            res.status(500).json({ error: 'Failed to fetch user votes' });
        }
    }
    // Get campaign's escrow transactions (creator/admin only)
    static async getEscrowTransactions(req, res) {
        try {
            const { campaignId } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;
            if (!userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            // Check permissions
            const campaign = await database_1.prisma.campaign.findUnique({
                where: { id: campaignId }
            });
            if (!campaign) {
                res.status(404).json({ error: 'Campaign not found' });
                return;
            }
            const isCreator = campaign.creatorId === userId;
            const isAdmin = userRole && ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
            if (!isCreator && !isAdmin) {
                res.status(403).json({ error: 'Access denied' });
                return;
            }
            const transactions = await database_1.prisma.escrowTransaction.findMany({
                where: { campaignId },
                include: {
                    milestone: {
                        select: { id: true, title: true, order: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json({ transactions });
        }
        catch (error) {
            safeLog('Error in getEscrowTransactions controller', { error: error?.message });
            res.status(500).json({ error: 'Failed to fetch escrow transactions' });
        }
    }
    // Update milestone (creator only, before submission)
    static async updateMilestone(req, res) {
        try {
            const { milestoneId } = req.params;
            const userId = req.user?.id;
            const { title, description, amount, deadline } = req.body;
            if (!userId) {
                res.status(401).json({ error: 'Authentication required' });
                return;
            }
            const milestone = await database_1.prisma.milestone.findUnique({
                where: { id: milestoneId },
                include: { campaign: true }
            });
            if (!milestone) {
                res.status(404).json({ error: 'Milestone not found' });
                return;
            }
            if (milestone.campaign.creatorId !== userId) {
                res.status(403).json({ error: 'Only campaign creator can update milestones' });
                return;
            }
            if (milestone.status !== 'PENDING') {
                res.status(400).json({ error: 'Can only update pending milestones' });
                return;
            }
            const updatedMilestone = await database_1.prisma.milestone.update({
                where: { id: milestoneId },
                data: {
                    ...(title && { title }),
                    ...(description && { description }),
                    ...(amount && { amount }),
                    ...(deadline && { deadline: new Date(deadline) })
                }
            });
            res.json({
                message: 'Milestone updated successfully',
                milestone: updatedMilestone
            });
        }
        catch (error) {
            safeLog('Error in updateMilestone controller', { error: error?.message });
            res.status(500).json({ error: 'Failed to update milestone' });
        }
    }
}
exports.MilestoneController = MilestoneController;
exports.default = MilestoneController;
//# sourceMappingURL=milestone.controller.js.map