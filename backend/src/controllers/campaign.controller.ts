import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { CampaignStatus } from '../generated/prisma';

/**
 * Campaign Controller
 * Handles all campaign-related operations
 */
export const campaignController = {
  /**
   * Get all campaigns with optional filtering
   */
  getAllCampaigns: async (req: Request, res: Response) => {
    try {
      const { 
        status, 
        category, 
        creatorId,
        limit = 10, 
        page = 1 
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      
      // Build filter object
      const where: any = {};
      
      if (status) {
        where.status = status as CampaignStatus;
      }
      
      if (category) {
        where.category = category as string;
      }
      
      if (creatorId) {
        where.creatorId = creatorId as string;
      }
      
      // Parallelize queries for better performance
      const [campaigns, total] = await Promise.all([
        prisma.campaign.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            targetAmount: true,
            currentAmount: true,
            category: true,
            status: true,
            startDate: true,
            endDate: true,
            createdAt: true,
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
                contributions: true
              }
            }
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.campaign.count({ where })
      ]);
      
      return res.status(200).json({
        campaigns,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting campaigns:', error);
      return res.status(500).json({ error: 'Failed to retrieve campaigns' });
    }
  },
  
  /**
   * Get a single campaign by ID
   */
  getCampaignById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          story: true,
          imageUrl: true,
          additionalMedia: true,
          targetAmount: true,
          currentAmount: true,
          escrowAmount: true,
          releasedAmount: true,
          contractAddress: true,
          category: true,
          status: true,
          riskScore: true,
          isFraudulent: true,
          requiresMilestones: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
          creatorId: true,
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
              rewardTiers: true
            }
          }
        }
      });
      
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
      
      return res.status(200).json(campaign);
    } catch (error) {
      console.error('Error getting campaign:', error);
      return res.status(500).json({ error: 'Failed to retrieve campaign' });
    }
  },
  
  /**
   * Create a new campaign
   */
  createCampaign: async (req: Request, res: Response) => {
    try {
      const { 
        title, 
        description, 
        // @ts-ignore
        story,
        imageUrl, 
        targetAmount, 
        category, 
        startDate, 
        endDate,
        additionalMedia,
        milestones,
        rewardTiers 
      } = req.body;
      
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
      const campaign = await prisma.campaign.create({
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
          status: CampaignStatus.PENDING,
          creatorId: userId,
          additionalMedia: additionalMedia ? (Array.isArray(additionalMedia) ? additionalMedia : JSON.parse(additionalMedia)) : undefined,
          milestones: milestones ? {
            create: milestones.map((milestone: any) => ({
              title: milestone.title,
              description: milestone.description,
              amount: parseFloat(milestone.amount),
              deadline: new Date(milestone.deadline)
            }))
          } : undefined,
          rewardTiers: rewardTiers && Array.isArray(rewardTiers) && rewardTiers.length > 0 ? {
            create: rewardTiers.map((tier: any) => ({
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
    } catch (error) {
      console.error('Error creating campaign:', error);
      return res.status(500).json({ error: 'Failed to create campaign' });
    }
  },
  
  /**
   * Update an existing campaign
   */
  updateCampaign: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { 
        title, 
        description, 
        // @ts-ignore
        story,
        imageUrl, 
        targetAmount, 
        category, 
        startDate, 
        endDate,
        additionalMedia,
        status
      } = req.body;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Check if campaign exists and belongs to user
      const existingCampaign = await prisma.campaign.findUnique({
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
      const updateData: any = {};
      
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      // @ts-ignore
      if (story) updateData.story = story;
      if (imageUrl) updateData.imageUrl = imageUrl;
      if (targetAmount) updateData.targetAmount = parseFloat(targetAmount);
      if (category) updateData.category = category;
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      if (additionalMedia) {
        updateData.additionalMedia = Array.isArray(additionalMedia) ? additionalMedia : (typeof additionalMedia === 'string' ? JSON.parse(additionalMedia) : []);
      }
      
      // Only admins can change status
      if (status && isAdmin) {
        updateData.status = status as CampaignStatus;
      }
      
      // Update campaign
      const updatedCampaign = await prisma.campaign.update({
        where: { id },
        data: updateData,
        include: {
          milestones: true
        }
      });
      
      return res.status(200).json(updatedCampaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      return res.status(500).json({ error: 'Failed to update campaign' });
    }
  },
  
  /**
   * Delete a campaign
   */
  deleteCampaign: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Check if campaign exists and belongs to user
      const existingCampaign = await prisma.campaign.findUnique({
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
      await prisma.campaign.delete({
        where: { id }
      });
      
      return res.status(200).json({ message: 'Campaign deleted successfully' });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return res.status(500).json({ error: 'Failed to delete campaign' });
    }
  },

  /**
   * Get campaign statistics (Admin only)
   */
  getCampaignStats: async (req: Request, res: Response) => {
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
      const totalCampaigns = await prisma.campaign.count();
      const activeCampaigns = await prisma.campaign.count({
        where: { status: 'ACTIVE' }
      });
      const pendingCampaigns = await prisma.campaign.count({
        where: { status: 'PENDING' }
      });
      const completedCampaigns = await prisma.campaign.count({
        where: { status: 'COMPLETED' }
      });
      
      // Get total funding amount
      const totalFundingResult = await prisma.campaign.aggregate({
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
    } catch (error) {
      console.error('Error getting campaign stats:', error);
      return res.status(500).json({ error: 'Failed to retrieve campaign statistics' });
    }
  },

  /**
   * Get active milestone for a campaign
   * @route GET /api/campaigns/:id/active-milestone
   */
  getActiveMilestone: async (req: Request, res: Response) => {
    try {
      const { id: campaignId } = req.params;

      const { MilestoneService } = await import('../services/milestoneService');
      const activeMilestone = await MilestoneService.getActiveMilestone(campaignId);

      if (!activeMilestone) {
        return res.status(404).json({ error: 'No active milestone found for this campaign' });
      }

      return res.status(200).json(activeMilestone);
    } catch (error) {
      console.error('Error getting active milestone:', error);
      return res.status(500).json({ error: 'Failed to retrieve active milestone' });
    }
  }
}; 