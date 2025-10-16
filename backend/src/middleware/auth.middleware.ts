import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { PermissionService } from '../services/permissionService';
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

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    
    if (!decoded || !decoded.id) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        role: true,
        status: true,
        isVerified: true
      }
    });
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Check if user is suspended or banned
    if (user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Account suspended' });
      return;
    }

    if (user.status === 'BANNED') {
      res.status(403).json({ error: 'Account banned' });
      return;
    }
    
    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email || undefined,
      walletAddress: user.walletAddress,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Optional authentication middleware
 * Extracts user from token if provided, but doesn't require it
 * Used for endpoints that should work for both authenticated and anonymous users
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    // If no token provided, continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      next();
      return;
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    
    if (!decoded || !decoded.id) {
      next();
      return;
    }
    
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        walletAddress: true,
        role: true,
        status: true,
        isVerified: true
      }
    });
    
    if (user && user.status !== 'SUSPENDED' && user.status !== 'BANNED') {
      // Attach user to request object
      req.user = {
        id: user.id,
        email: user.email || undefined,
        walletAddress: user.walletAddress,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified
      };
    }
    
    next();
  } catch (error) {
    // On any error, just continue without user (don't block request)
    next();
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 * Checks if user has required permission
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasPermission = await PermissionService.hasPermission(req.user.id, permission);
    
    if (!hasPermission) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission
      });
      return;
    }

    next();
  };
};

/**
 * Multiple permissions middleware (user needs ANY of the permissions)
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasAnyPermission = await PermissionService.hasAnyPermission(req.user.id, permissions);
    
    if (!hasAnyPermission) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `Any of: ${permissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Multiple permissions middleware (user needs ALL of the permissions)
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasAllPermissions = await PermissionService.hasAllPermissions(req.user.id, permissions);
    
    if (!hasAllPermissions) {
      res.status(403).json({ 
        error: 'Insufficient permissions',
        required: `All of: ${permissions.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Resource ownership middleware
 * Checks if user owns the resource or has admin permissions
 */
export const requireOwnershipOrPermission = (
  resourceType: string,
  resourceIdParam: string,
  adminPermission: string
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const resourceId = req.params[resourceIdParam];
    
    if (!resourceId) {
      res.status(400).json({ error: 'Resource ID required' });
      return;
    }

    // Check if user has admin permission
    const hasAdminPermission = await PermissionService.hasPermission(req.user.id, adminPermission);
    
    if (hasAdminPermission) {
      next();
      return;
    }

    // Check ownership
    const canPerformAction = await PermissionService.canPerformAction(
      req.user.id,
      `${resourceType}:update:own`,
      resourceType,
      resourceId
    );

    if (!canPerformAction) {
      res.status(403).json({ 
        error: 'You can only access your own resources or need admin permissions'
      });
      return;
    }

    next();
  };
};

/**
 * Admin middleware (shorthand for ADMIN or SUPER_ADMIN roles)
 */
export const requireAdmin = requireRole(['ADMIN', 'SUPER_ADMIN']);

/**
 * Super Admin middleware
 */
export const requireSuperAdmin = requireRole('SUPER_ADMIN');

/**
 * Verified user middleware
 */
export const requireVerified = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({ error: 'Account verification required' });
    return;
  }

  next();
}; 