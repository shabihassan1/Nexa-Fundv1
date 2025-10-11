import { Request, Response } from 'express';
import { prisma } from '../config/database';

/**
 * Reward Tier Controller
 * Handles all reward tier-related operations
 */
export const rewardTierController = {
  /**
   * Get all reward tiers for a campaign
   */
  getRewardTiersByCampaign: async (req: Request, res: Response): Promise<void> => {
    try {
      const { campaignId } = req.params;
      
      const rewardTiers = await prisma.rewardTier.findMany({
        where: { campaignId },
        include: {
          _count: {
            select: {
              contributions: true
            }
          }
        },
        orderBy: { minimumAmount: 'asc' }
      });
      
      res.status(200).json(rewardTiers);
    } catch (error) {
      console.error('Error getting reward tiers:', error);
      res.status(500).json({ error: 'Failed to retrieve reward tiers' });
    }
  },

  /**
   * Get a single reward tier by ID
   */
  getRewardTierById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const rewardTier = await prisma.rewardTier.findUnique({
        where: { id },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              creatorId: true
            }
          },
          _count: {
            select: {
              contributions: true
            }
          }
        }
      });
      
      if (!rewardTier) {
        res.status(404).json({ error: 'Reward tier not found' });
        return;
      }
      
      res.status(200).json(rewardTier);
    } catch (error) {
      console.error('Error getting reward tier:', error);
      res.status(500).json({ error: 'Failed to retrieve reward tier' });
    }
  },

  /**
   * Create a new reward tier
   */
  createRewardTier: async (req: Request, res: Response): Promise<void> => {
    try {
      const { campaignId, title, description, minimumAmount } = req.body;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Validate required fields
      if (!campaignId || !title || !description || !minimumAmount) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      // Check if campaign exists and user is the creator
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });
      
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }
      
      if (campaign.creatorId !== userId) {
        res.status(403).json({ error: 'Only campaign creator can add reward tiers' });
        return;
      }
      
      // Create reward tier
      const rewardTier = await prisma.rewardTier.create({
        data: {
          campaignId,
          title,
          description,
          minimumAmount: parseFloat(minimumAmount)
        },
        include: {
          _count: {
            select: {
              contributions: true
            }
          }
        }
      });
      
      res.status(201).json(rewardTier);
    } catch (error) {
      console.error('Error creating reward tier:', error);
      res.status(500).json({ error: 'Failed to create reward tier' });
    }
  },

  /**
   * Update an existing reward tier
   */
  updateRewardTier: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, minimumAmount } = req.body;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Check if reward tier exists and user is the campaign creator
      const rewardTier = await prisma.rewardTier.findUnique({
        where: { id },
        include: {
          campaign: true
        }
      });
      
      if (!rewardTier) {
        res.status(404).json({ error: 'Reward tier not found' });
        return;
      }
      
      if (rewardTier.campaign.creatorId !== userId) {
        res.status(403).json({ error: 'Only campaign creator can update reward tiers' });
        return;
      }
      
      // Prepare update data
      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (minimumAmount) updateData.minimumAmount = parseFloat(minimumAmount);
      
      // Update reward tier
      const updatedRewardTier = await prisma.rewardTier.update({
        where: { id },
        data: updateData,
        include: {
          _count: {
            select: {
              contributions: true
            }
          }
        }
      });
      
      res.status(200).json(updatedRewardTier);
    } catch (error) {
      console.error('Error updating reward tier:', error);
      res.status(500).json({ error: 'Failed to update reward tier' });
    }
  },

  /**
   * Delete a reward tier
   */
  deleteRewardTier: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Check if reward tier exists and user is the campaign creator
      const rewardTier = await prisma.rewardTier.findUnique({
        where: { id },
        include: {
          campaign: true,
          _count: {
            select: {
              contributions: true
            }
          }
        }
      });
      
      if (!rewardTier) {
        res.status(404).json({ error: 'Reward tier not found' });
        return;
      }
      
      if (rewardTier.campaign.creatorId !== userId) {
        res.status(403).json({ error: 'Only campaign creator can delete reward tiers' });
        return;
      }
      
      // Check if reward tier has contributions
      if (rewardTier._count.contributions > 0) {
        res.status(400).json({ error: 'Cannot delete reward tier with existing contributions' });
        return;
      }
      
      // Delete reward tier
      await prisma.rewardTier.delete({
        where: { id }
      });
      
      res.status(200).json({ message: 'Reward tier deleted successfully' });
    } catch (error) {
      console.error('Error deleting reward tier:', error);
      res.status(500).json({ error: 'Failed to delete reward tier' });
    }
  }
}; 