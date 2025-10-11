import { Request, Response } from 'express';
import { prisma } from '../config/database';

/**
 * Update Controller
 * Handles all campaign update-related operations
 */
export const updateController = {
  /**
   * Get all updates for a campaign
   */
  getUpdatesByCampaign: async (req: Request, res: Response): Promise<void> => {
    try {
      const { campaignId } = req.params;
      
      const updates = await prisma.update.findMany({
        where: { campaignId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              walletAddress: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      res.status(200).json(updates);
    } catch (error) {
      console.error('Error getting updates:', error);
      res.status(500).json({ error: 'Failed to retrieve updates' });
    }
  },

  /**
   * Create a new update
   */
  createUpdate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { campaignId, title, content, imageUrl } = req.body;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Validate required fields
      if (!campaignId || !title || !content) {
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
      
      // Only campaign creators can post updates
      if (campaign.creatorId !== userId) {
        res.status(403).json({ error: 'Only campaign creators can post updates' });
        return;
      }
      
      // Create update
      const update = await prisma.update.create({
        data: {
          campaignId,
          creatorId: userId,
          title,
          content,
          imageUrl: imageUrl || null
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              walletAddress: true
            }
          }
        }
      });
      
      res.status(201).json(update);
    } catch (error) {
      console.error('Error creating update:', error);
      res.status(500).json({ error: 'Failed to create update' });
    }
  },

  /**
   * Update an existing update
   */
  updateUpdate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, content, imageUrl } = req.body;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Check if update exists
      const existingUpdate = await prisma.update.findUnique({
        where: { id },
        include: {
          campaign: true
        }
      });
      
      if (!existingUpdate) {
        res.status(404).json({ error: 'Update not found' });
        return;
      }
      
      // Only the creator can edit their updates
      if (existingUpdate.creatorId !== userId) {
        res.status(403).json({ error: 'You can only edit your own updates' });
        return;
      }
      
      // Update the update
      const updatedUpdate = await prisma.update.update({
        where: { id },
        data: {
          title: title || existingUpdate.title,
          content: content || existingUpdate.content,
          imageUrl: imageUrl !== undefined ? imageUrl : existingUpdate.imageUrl
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              walletAddress: true
            }
          }
        }
      });
      
      res.status(200).json(updatedUpdate);
    } catch (error) {
      console.error('Error updating update:', error);
      res.status(500).json({ error: 'Failed to update update' });
    }
  },

  /**
   * Delete an update
   */
  deleteUpdate: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Get user from auth middleware
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }
      
      // Check if update exists
      const existingUpdate = await prisma.update.findUnique({
        where: { id }
      });
      
      if (!existingUpdate) {
        res.status(404).json({ error: 'Update not found' });
        return;
      }
      
      // Only the creator or admin can delete updates
      const isCreator = existingUpdate.creatorId === userId;
      const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
      
      if (!isCreator && !isAdmin) {
        res.status(403).json({ error: 'You can only delete your own updates' });
        return;
      }
      
      // Delete the update
      await prisma.update.delete({
        where: { id }
      });
      
      res.status(200).json({ message: 'Update deleted successfully' });
    } catch (error) {
      console.error('Error deleting update:', error);
      res.status(500).json({ error: 'Failed to delete update' });
    }
  },

  /**
   * Get a single update by ID
   */
  getUpdateById: async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      const update = await prisma.update.findUnique({
        where: { id },
        include: {
          creator: {
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
          }
        }
      });
      
      if (!update) {
        res.status(404).json({ error: 'Update not found' });
        return;
      }
      
      res.status(200).json(update);
    } catch (error) {
      console.error('Error getting update:', error);
      res.status(500).json({ error: 'Failed to retrieve update' });
    }
  }
}; 