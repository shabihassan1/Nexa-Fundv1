import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { PermissionService } from '../services/permissionService';
import { UserRole, UserStatus } from '../generated/prisma';

export const userController = {
  // Get all users (Admin only)
  getAllUsers: async (req: Request, res: Response): Promise<void> => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      
      const where: any = {};
      
      if (role) {
        where.role = role;
      }
      
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }
      
      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          isVerified: true,
          walletAddress: true,
          createdAt: true,
          _count: {
            select: {
              campaignsCreated: true,
              contributions: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      });
      
      const total = await prisma.user.count({ where });
      
      res.status(200).json({
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Failed to retrieve users' });
    }
  },

  // Update user role (Admin only)
  updateUserRole: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'CREATOR', 'BACKER', 'USER'].includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }

      // Prevent non-super-admins from creating super admins
      if (role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Only super admins can assign super admin role' });
        return;
      }
      
      const success = await PermissionService.updateUserRole(userId, role as UserRole);
      
      if (!success) {
        res.status(500).json({ error: 'Failed to update user role' });
        return;
      }
      
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          isVerified: true
        }
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: 'Failed to update user role' });
    }
  },

  // Update user status (Admin only)
  updateUserStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { status } = req.body;
      
      if (!['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      // Prevent admins from suspending/banning super admins
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, email: true }
      });

      if (targetUser?.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Only super admins can modify super admin accounts' });
        return;
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { status: status as UserStatus },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          isVerified: true
        }
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ error: 'Failed to update user status' });
    }
  },

  // Verify user (Admin/Moderator)
  verifyUser: async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
        select: {
          id: true,
          email: true,
          name: true,
          isVerified: true
        }
      });
      
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error verifying user:', error);
      res.status(500).json({ error: 'Failed to verify user' });
    }
  },

  // Get user statistics (Admin only)
  getUserStats: async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await prisma.user.groupBy({
        by: ['role'],
        _count: {
          id: true
        }
      });
      
      const totalUsers = await prisma.user.count();
      const verifiedUsers = await prisma.user.count({
        where: { isVerified: true }
      });
      
      res.status(200).json({
        totalUsers,
        verifiedUsers,
        roleDistribution: stats
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Failed to retrieve user statistics' });
    }
  },

  // Get current user's activity stats
  getMyActivity: async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get user's contributions count and total amount
      const contributions = await prisma.contribution.findMany({
        where: { userId },
        select: {
          amount: true,
          campaignId: true,
        }
      });

      const backedCount = new Set(contributions.map(c => c.campaignId)).size; // Unique campaigns backed
      const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

      // Get campaigns created by user
      const campaignsCreated = await prisma.campaign.count({
        where: { creatorId: userId }
      });

      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          interests: true,
          fundingPreference: true,
          riskTolerance: true,
          preferencesSet: true,
        }
      });

      res.status(200).json({
        activity: {
          backedCount,
          totalContributed,
          campaignsCreated,
          viewedCount: 0, // TODO: Implement view tracking
          savedCount: 0,  // TODO: Implement saved campaigns feature
        },
        preferences: {
          interests: user?.interests || [],
          fundingPreference: user?.fundingPreference,
          riskTolerance: user?.riskTolerance,
          preferencesSet: user?.preferencesSet || false,
        }
      });
    } catch (error) {
      console.error('Error getting user activity:', error);
      res.status(500).json({ error: 'Failed to retrieve user activity' });
    }
  }
}; 