import { prisma } from '../config/database';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLE_HIERARCHY } from '../constants/permissions';
import { UserRole } from '../generated/prisma';

export class PermissionService {
  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      // Get user with role and custom permissions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!user) {
        return false;
      }

      // Check if user is suspended or banned
      if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
        return false;
      }

      // Check role-based permissions
      const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
      if (rolePermissions.includes(permission as any)) {
        return true;
      }

      // Check custom user permissions
      const userPermission = user.userPermissions.find(
        up => up.permission.name === permission && up.granted
      );

      return !!userPermission;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if a user has any of the specified permissions
   */
  static async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a user has all of the specified permissions
   */
  static async hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all permissions for a user (role-based + custom)
   */
  static async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userPermissions: {
            include: {
              permission: true
            }
          }
        }
      });

      if (!user) {
        return [];
      }

      // Get role-based permissions
      const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
      
      // Get custom permissions (only granted ones)
      const customPermissions = user.userPermissions
        .filter(up => up.granted)
        .map(up => up.permission.name);

      // Combine and deduplicate
      return [...new Set([...rolePermissions, ...customPermissions])];
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Grant a custom permission to a user
   */
  static async grantPermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      // Find or create permission
      let permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });

      if (!permission) {
        permission = await prisma.permission.create({
          data: {
            name: permissionName,
            description: `Custom permission: ${permissionName}`
          }
        });
      }

      // Grant permission to user
      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        update: {
          granted: true,
          revokedAt: null
        },
        create: {
          userId,
          permissionId: permission.id,
          granted: true
        }
      });

      return true;
    } catch (error) {
      console.error('Error granting permission:', error);
      return false;
    }
  }

  /**
   * Revoke a custom permission from a user
   */
  static async revokePermission(userId: string, permissionName: string): Promise<boolean> {
    try {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName }
      });

      if (!permission) {
        return false;
      }

      await prisma.userPermission.upsert({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id
          }
        },
        update: {
          granted: false,
          revokedAt: new Date()
        },
        create: {
          userId,
          permissionId: permission.id,
          granted: false,
          revokedAt: new Date()
        }
      });

      return true;
    } catch (error) {
      console.error('Error revoking permission:', error);
      return false;
    }
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
      });

      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      return false;
    }
  }

  /**
   * Check if user can perform action on resource
   * This handles ownership-based permissions (e.g., update own campaign)
   */
  static async canPerformAction(
    userId: string, 
    action: string, 
    resourceType: string, 
    resourceId?: string
  ): Promise<boolean> {
    // Check basic permission first
    if (!(await this.hasPermission(userId, action))) {
      return false;
    }

    // If it's an "own" permission, check ownership
    if (action.includes(':own') && resourceId) {
      return await this.checkOwnership(userId, resourceType, resourceId);
    }

    return true;
  }

  /**
   * Check if user owns a resource
   */
  private static async checkOwnership(
    userId: string, 
    resourceType: string, 
    resourceId: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'campaign':
          const campaign = await prisma.campaign.findUnique({
            where: { id: resourceId },
            select: { creatorId: true }
          });
          return campaign?.creatorId === userId;

        case 'contribution':
          const contribution = await prisma.contribution.findUnique({
            where: { id: resourceId },
            select: { userId: true }
          });
          return contribution?.userId === userId;

        case 'report':
          const report = await prisma.report.findUnique({
            where: { id: resourceId },
            select: { reporterId: true }
          });
          return report?.reporterId === userId;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
      return false;
    }
  }

  /**
   * Auto-upgrade user role based on activity
   */
  static async autoUpgradeRole(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          contributions: true,
          campaignsCreated: true
        }
      });

      if (!user) return;

      // Auto-upgrade to BACKER after first contribution
      if (user.role === 'USER' && user.contributions.length > 0) {
        await this.updateUserRole(userId, 'BACKER');
      }

      // Auto-upgrade to CREATOR if verified and has created campaigns
      if (user.role === 'BACKER' && user.isVerified && user.campaignsCreated.length > 0) {
        await this.updateUserRole(userId, 'CREATOR');
      }
    } catch (error) {
      console.error('Error auto-upgrading role:', error);
    }
  }

  /**
   * Initialize default permissions in database
   */
  static async initializePermissions(): Promise<void> {
    try {
      // Create all permissions
      for (const [key, permission] of Object.entries(PERMISSIONS)) {
        await prisma.permission.upsert({
          where: { name: permission },
          update: {},
          create: {
            name: permission,
            description: `Permission: ${key.replace(/_/g, ' ').toLowerCase()}`,
            category: this.getPermissionCategory(permission)
          }
        });
      }

      // Create role permissions
      for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
        for (const permission of permissions) {
          const permissionRecord = await prisma.permission.findUnique({
            where: { name: permission }
          });

          if (permissionRecord) {
            await prisma.rolePermission.upsert({
              where: {
                role_permissionId: {
                  role: role as UserRole,
                  permissionId: permissionRecord.id
                }
              },
              update: {},
              create: {
                role: role as UserRole,
                permissionId: permissionRecord.id
              }
            });
          }
        }
      }

      console.log('Permissions initialized successfully');
    } catch (error) {
      console.error('Error initializing permissions:', error);
    }
  }

  /**
   * Get permission category based on permission name
   */
  private static getPermissionCategory(permission: string): string {
    if (permission.startsWith('campaign:')) return 'Campaign Management';
    if (permission.startsWith('user:')) return 'User Management';
    if (permission.startsWith('contribution:')) return 'Contribution Management';
    if (permission.startsWith('report:')) return 'Report Management';
    if (permission.startsWith('milestone:')) return 'Milestone Management';
    if (permission.startsWith('reward_tier:')) return 'Reward Tier Management';
    if (permission.startsWith('platform:')) return 'Platform Management';
    if (permission.startsWith('moderate:')) return 'Moderation';
    return 'General';
  }
} 