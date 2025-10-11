import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { MilestoneService, CreateMilestoneData, SubmitMilestoneData, VoteMilestoneData } from '../services/milestoneService';
import { z } from 'zod';
import { UserRole } from '../generated/prisma';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        walletAddress?: string;
        role: UserRole;
        status: string;
        isVerified: boolean;
      };
    }
  }
}

// Simple logging function
const safeLog = (message: string, data?: any) => {
  console.log(`[${new Date().toISOString()}] ${message}`, data || '');
};

// Validation schemas
const createMilestonesSchema = z.object({
  milestones: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    amount: z.number().positive('Amount must be positive'),
    deadline: z.string().transform((str: string) => new Date(str)),
    order: z.number().positive('Order must be positive')
  })).min(1, 'At least one milestone is required')
});

const submitMilestoneSchema = z.object({
  evidence: z.any(),
  description: z.string().min(1, 'Description is required')
});

const voteSchema = z.object({
  isApproval: z.boolean(),
  comment: z.string().optional()
});

export class MilestoneController {
  // Create milestones for a campaign
  static async createMilestones(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Validate request body
      const parsedData = createMilestonesSchema.parse(req.body);
      const milestones = parsedData.milestones as CreateMilestoneData[];

      // Check if user owns the campaign
      const campaign = await prisma.campaign.findUnique({
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

      const createdMilestones = await MilestoneService.createMilestones(campaignId, milestones);

      res.status(201).json({
        message: 'Milestones created successfully',
        milestones: createdMilestones
      });
    } catch (error: any) {
      safeLog('Error in createMilestones controller', { error: error?.message });
      if (error instanceof z.ZodError) {
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
  static async getMilestones(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const milestones = await prisma.milestone.findMany({
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
    } catch (error: any) {
      safeLog('Error in getMilestones controller', { error: error?.message });
      res.status(500).json({ error: 'Failed to fetch milestones' });
    }
  }

  // Get single milestone details
  static async getMilestone(req: Request, res: Response): Promise<void> {
    try {
      const { milestoneId } = req.params;

      const milestone = await prisma.milestone.findUnique({
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
    } catch (error: any) {
      safeLog('Error in getMilestone controller', { error: error?.message });
      res.status(500).json({ error: 'Failed to fetch milestone' });
    }
  }

  // Submit milestone for review
  static async submitMilestone(req: Request, res: Response): Promise<void> {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Validate request body
      const parsedData = submitMilestoneSchema.parse(req.body);
      const submissionData = parsedData as SubmitMilestoneData;

      const result = await MilestoneService.submitMilestone(milestoneId, userId, submissionData);

      res.json({
        message: 'Milestone submitted successfully',
        milestone: result.milestone,
        submission: result.submission
      });
    } catch (error: any) {
      safeLog('Error in submitMilestone controller', { error: error?.message });
      if (error instanceof z.ZodError) {
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
  static async startVoting(req: Request, res: Response): Promise<void> {
    try {
      const { milestoneId } = req.params;
      const userRole = req.user?.role;

      if (!userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const milestone = await MilestoneService.startVoting(milestoneId);

      res.json({
        message: 'Voting started successfully',
        milestone
      });
    } catch (error: any) {
      safeLog('Error in startVoting controller', { error: error?.message });
      res.status(500).json({ error: error?.message || 'Failed to start voting' });
    }
  }

  // Vote on milestone
  static async voteOnMilestone(req: Request, res: Response): Promise<void> {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Validate request body
      const parsedData = voteSchema.parse(req.body);
      const voteData = parsedData as VoteMilestoneData;

      const result = await MilestoneService.voteOnMilestone(milestoneId, userId, voteData);

      res.json({
        message: 'Vote cast successfully',
        vote: result.vote,
        milestone: result.milestone
      });
    } catch (error: any) {
      safeLog('Error in voteOnMilestone controller', { error: error?.message });
      if (error instanceof z.ZodError) {
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
  static async approveMilestone(req: Request, res: Response): Promise<void> {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userRole || !['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        res.status(403).json({ error: 'Admin access required' });
        return;
      }

      const result = await MilestoneService.approveMilestone(milestoneId, userId || '');

      res.json({
        message: 'Milestone approved and funds released',
        milestone: result.milestone,
        escrowTransaction: result.escrowTransaction
      });
    } catch (error: any) {
      safeLog('Error in approveMilestone controller', { error: error?.message });
      res.status(500).json({ error: error?.message || 'Failed to approve milestone' });
    }
  }

  // Reject milestone (admin only)
  static async rejectMilestone(req: Request, res: Response): Promise<void> {
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

      const milestone = await MilestoneService.rejectMilestone(milestoneId, userId || '', reason);

      res.json({
        message: 'Milestone rejected',
        milestone
      });
    } catch (error: any) {
      safeLog('Error in rejectMilestone controller', { error: error?.message });
      res.status(500).json({ error: error?.message || 'Failed to reject milestone' });
    }
  }

  // Validate campaign milestone requirements
  static async validateRequirements(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const validation = await MilestoneService.validateMilestoneRequirements(campaignId);

      res.json(validation);
    } catch (error: any) {
      safeLog('Error in validateRequirements controller', { error: error?.message });
      res.status(500).json({ error: 'Failed to validate milestone requirements' });
    }
  }

  // Get milestone statistics for a campaign
  static async getMilestoneStats(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;

      const stats = await MilestoneService.getMilestoneStats(campaignId);

      res.json({ stats });
    } catch (error: any) {
      safeLog('Error in getMilestoneStats controller', { error: error?.message });
      res.status(500).json({ error: 'Failed to fetch milestone statistics' });
    }
  }

  // Get user's voting history
  static async getUserVotes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const votes = await prisma.vote.findMany({
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
    } catch (error: any) {
      safeLog('Error in getUserVotes controller', { error: error?.message });
      res.status(500).json({ error: 'Failed to fetch user votes' });
    }
  }

  // Get campaign's escrow transactions (creator/admin only)
  static async getEscrowTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Check permissions
      const campaign = await prisma.campaign.findUnique({
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

      const transactions = await prisma.escrowTransaction.findMany({
        where: { campaignId },
        include: {
          milestone: {
            select: { id: true, title: true, order: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ transactions });
    } catch (error: any) {
      safeLog('Error in getEscrowTransactions controller', { error: error?.message });
      res.status(500).json({ error: 'Failed to fetch escrow transactions' });
    }
  }

  // Update milestone (creator only, before submission)
  static async updateMilestone(req: Request, res: Response): Promise<void> {
    try {
      const { milestoneId } = req.params;
      const userId = req.user?.id;
      const { title, description, amount, deadline } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const milestone = await prisma.milestone.findUnique({
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

      const updatedMilestone = await prisma.milestone.update({
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
    } catch (error: any) {
      safeLog('Error in updateMilestone controller', { error: error?.message });
      res.status(500).json({ error: 'Failed to update milestone' });
    }
  }
}

export default MilestoneController; 