"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignController = void 0;
const database_1 = require("../config/database");
const prisma_1 = require("../generated/prisma");
/**
 * Campaign Controller
 * Handles all campaign-related operations
 */
exports.campaignController = {
    /**
     * Get all campaigns with optional filtering
     */
    getAllCampaigns: async (req, res) => {
        try {
            const { status, category, creatorId, limit = 10, page = 1 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            // Build filter object
            const where = {};
            if (status) {
                where.status = status;
            }
            if (category) {
                where.category = category;
            }
            if (creatorId) {
                where.creatorId = creatorId;
            }
            // Get campaigns with pagination
            const campaigns = await database_1.prisma.campaign.findMany({
                where,
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                            isVerified: true
                        }
                    },
                    _count: {
                        select: {
                            contributions: true,
                            milestones: true,
                            reports: true
                        }
                    }
                },
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' }
            });
            // Get total count for pagination
            const total = await database_1.prisma.campaign.count({ where });
            return res.status(200).json({
                campaigns,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(total / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Error getting campaigns:', error);
            return res.status(500).json({ error: 'Failed to retrieve campaigns' });
        }
    },
    /**
     * Get a single campaign by ID
     */
    getCampaignById: async (req, res) => {
        try {
            const { id } = req.params;
            const campaign = await database_1.prisma.campaign.findUnique({
                where: { id },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            walletAddress: true,
                            isVerified: true
                        }
                    },
                    milestones: true,
                    rewardTiers: {
                        orderBy: { minimumAmount: 'asc' }
                    },
                    _count: {
                        select: {
                            contributions: true,
                            reports: true
                        }
                    }
                }
            });
            if (!campaign) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            return res.status(200).json(campaign);
        }
        catch (error) {
            console.error('Error getting campaign:', error);
            return res.status(500).json({ error: 'Failed to retrieve campaign' });
        }
    },
    /**
     * Create a new campaign
     */
    createCampaign: async (req, res) => {
        try {
            const { title, description, 
            // @ts-ignore
            story, imageUrl, targetAmount, category, startDate, endDate, additionalMedia, milestones, rewardTiers } = req.body;
            // Get user from auth middleware
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            // Validate required fields
            if (!title || !description || !targetAmount || !category || !startDate || !endDate) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            // Create campaign with optional milestones and reward tiers
            const campaign = await database_1.prisma.campaign.create({
                data: {
                    title,
                    description,
                    // @ts-ignore
                    story,
                    imageUrl,
                    targetAmount: parseFloat(targetAmount),
                    category,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    status: prisma_1.CampaignStatus.PENDING,
                    creatorId: userId,
                    additionalMedia: additionalMedia ? (Array.isArray(additionalMedia) ? additionalMedia : JSON.parse(additionalMedia)) : undefined,
                    milestones: milestones ? {
                        create: milestones.map((milestone) => ({
                            title: milestone.title,
                            description: milestone.description,
                            amount: parseFloat(milestone.amount),
                            deadline: new Date(milestone.deadline)
                        }))
                    } : undefined,
                    rewardTiers: rewardTiers && Array.isArray(rewardTiers) && rewardTiers.length > 0 ? {
                        create: rewardTiers.map((tier) => ({
                            title: tier.title,
                            description: tier.description,
                            minimumAmount: parseFloat(tier.minimumAmount)
                        }))
                    } : undefined
                },
                include: {
                    milestones: true,
                    rewardTiers: true
                }
            });
            return res.status(201).json(campaign);
        }
        catch (error) {
            console.error('Error creating campaign:', error);
            return res.status(500).json({ error: 'Failed to create campaign' });
        }
    },
    /**
     * Update an existing campaign
     */
    updateCampaign: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, 
            // @ts-ignore
            story, imageUrl, targetAmount, category, startDate, endDate, additionalMedia, status } = req.body;
            // Get user from auth middleware
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            // Check if campaign exists and belongs to user
            const existingCampaign = await database_1.prisma.campaign.findUnique({
                where: { id }
            });
            if (!existingCampaign) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            // Only allow creator or admin to update
            const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
            if (existingCampaign.creatorId !== userId && !isAdmin) {
                return res.status(403).json({ error: 'Not authorized to update this campaign' });
            }
            // Prepare update data
            const updateData = {};
            if (title)
                updateData.title = title;
            if (description)
                updateData.description = description;
            // @ts-ignore
            if (story)
                updateData.story = story;
            if (imageUrl)
                updateData.imageUrl = imageUrl;
            if (targetAmount)
                updateData.targetAmount = parseFloat(targetAmount);
            if (category)
                updateData.category = category;
            if (startDate)
                updateData.startDate = new Date(startDate);
            if (endDate)
                updateData.endDate = new Date(endDate);
            if (additionalMedia) {
                updateData.additionalMedia = Array.isArray(additionalMedia) ? additionalMedia : (typeof additionalMedia === 'string' ? JSON.parse(additionalMedia) : []);
            }
            // Only admins can change status
            if (status && isAdmin) {
                updateData.status = status;
            }
            // Update campaign
            const updatedCampaign = await database_1.prisma.campaign.update({
                where: { id },
                data: updateData,
                include: {
                    milestones: true
                }
            });
            return res.status(200).json(updatedCampaign);
        }
        catch (error) {
            console.error('Error updating campaign:', error);
            return res.status(500).json({ error: 'Failed to update campaign' });
        }
    },
    /**
     * Delete a campaign
     */
    deleteCampaign: async (req, res) => {
        try {
            const { id } = req.params;
            // Get user from auth middleware
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            // Check if campaign exists and belongs to user
            const existingCampaign = await database_1.prisma.campaign.findUnique({
                where: { id }
            });
            if (!existingCampaign) {
                return res.status(404).json({ error: 'Campaign not found' });
            }
            // Only allow creator or admin to delete
            const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
            if (existingCampaign.creatorId !== userId && !isAdmin) {
                return res.status(403).json({ error: 'Not authorized to delete this campaign' });
            }
            // Delete campaign and related data (cascading delete for milestones, contributions, etc.)
            await database_1.prisma.campaign.delete({
                where: { id }
            });
            return res.status(200).json({ message: 'Campaign deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting campaign:', error);
            return res.status(500).json({ error: 'Failed to delete campaign' });
        }
    },
    /**
     * Get campaign statistics (Admin only)
     */
    getCampaignStats: async (req, res) => {
        try {
            // Get user from auth middleware
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            // Only allow admins to access stats
            const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
            if (!isAdmin) {
                return res.status(403).json({ error: 'Admin access required' });
            }
            // Get campaign counts by status
            const totalCampaigns = await database_1.prisma.campaign.count();
            const activeCampaigns = await database_1.prisma.campaign.count({
                where: { status: 'ACTIVE' }
            });
            const pendingCampaigns = await database_1.prisma.campaign.count({
                where: { status: 'PENDING' }
            });
            const completedCampaigns = await database_1.prisma.campaign.count({
                where: { status: 'COMPLETED' }
            });
            // Get total funding amount
            const totalFundingResult = await database_1.prisma.campaign.aggregate({
                _sum: {
                    currentAmount: true
                }
            });
            const totalFunded = totalFundingResult._sum.currentAmount || 0;
            return res.status(200).json({
                totalCampaigns,
                activeCampaigns,
                pendingCampaigns,
                completedCampaigns,
                totalFunded
            });
        }
        catch (error) {
            console.error('Error getting campaign stats:', error);
            return res.status(500).json({ error: 'Failed to retrieve campaign statistics' });
        }
    }
};
//# sourceMappingURL=campaign.controller.js.map