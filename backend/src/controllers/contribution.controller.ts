import { Request, Response } from 'express';
import { prisma } from '../config/database';

/**
 * Contribution Controller
 * Handles all contribution-related operations
 */
export const contributionController = {
  /**
   * Get all contributions for a campaign
   */
  getContributionsByCampaign: async (req: Request, res: Response): Promise<void> => {
    try {
      const { campaignId } = req.params;
      
      const contributions = await prisma.contribution.findMany({
        where: { campaignId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              walletAddress: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.status(200).json(contributions);
    } catch (error) {
      console.error('Error getting contributions:', error);
      res.status(500).json({ error: 'Failed to retrieve contributions' });
    }
  },

  /**
   * Get all contributions by a user
   */
  getContributionsByUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      const contributions = await prisma.contribution.findMany({
        where: { userId },
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.status(200).json(contributions);
    } catch (error) {
      console.error('Error getting user contributions:', error);
      res.status(500).json({ error: 'Failed to retrieve user contributions' });
    }
  },

  /**
   * Create a new contribution
   */
  createContribution: async (req: Request, res: Response): Promise<void> => {
    try {
      const { campaignId, amount, transactionHash, blockNumber, rewardTierId } = req.body;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Validate required fields
      if (!campaignId || !amount || !transactionHash) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      // Check if campaign exists
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      });
      
      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }
      
      // Prevent self-backing
      if (campaign.creatorId === userId) {
        res.status(403).json({ error: 'Cannot back your own campaign' });
        return;
      }
      
      // Check if transaction hash already exists (prevent double spending)
      const existingContribution = await prisma.contribution.findUnique({
        where: { transactionHash }
      });
      
      if (existingContribution) {
        res.status(400).json({ error: 'Transaction already recorded' });
        return;
      }
      
      // Prepare contribution data
      const contributionData: any = {
        userId,
        campaignId,
        amount: parseFloat(amount),
        transactionHash,
        blockNumber: blockNumber ? parseInt(blockNumber) : null
      };
      
      // Add reward tier if provided
      if (rewardTierId) {
        contributionData.rewardTierId = rewardTierId;
      }
      
      // Create contribution
      const contribution = await prisma.contribution.create({
        data: contributionData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              walletAddress: true
            }
          },
          campaign: {
            select: {
              id: true,
              title: true
            }
          },
          rewardTier: {
            select: {
              id: true,
              title: true,
              description: true,
              minimumAmount: true
            }
          }
        }
      });
      
      // Update campaign's current amount
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          currentAmount: {
            increment: parseFloat(amount)
          }
        }
      });
      
      // Trigger ML model refresh in background (non-blocking)
      // This updates collaborative filtering with new contribution data
      try {
        fetch('http://localhost:8000/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(() => {
          // Silently fail if ML service is unavailable
          console.log('ML service refresh triggered (async)');
        });
      } catch (error) {
        // Non-blocking, ignore errors
      }
      
      res.status(201).json(contribution);
    } catch (error) {
      console.error('Error creating contribution:', error);
      res.status(500).json({ error: 'Failed to create contribution' });
    }
  },

  /**
   * Get contribution statistics for a campaign
   */
  getCampaignStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const { campaignId } = req.params;
      
      const stats = await prisma.contribution.aggregate({
        where: { campaignId },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        },
        _avg: {
          amount: true
        }
      });
      
      const uniqueBackers = await prisma.contribution.findMany({
        where: { campaignId },
        select: { userId: true },
        distinct: ['userId']
      });
      
      res.status(200).json({
        totalAmount: stats._sum.amount || 0,
        totalContributions: stats._count.id || 0,
        averageContribution: stats._avg.amount || 0,
        uniqueBackers: uniqueBackers.length
      });
    } catch (error) {
      console.error('Error getting campaign stats:', error);
      res.status(500).json({ error: 'Failed to retrieve campaign statistics' });
    }
  }
}; 