import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../generated/prisma';
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
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
export declare const requireRole: (roles: UserRole | UserRole[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Permission-based authorization middleware
 * Checks if user has required permission
 */
export declare const requirePermission: (permission: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Multiple permissions middleware (user needs ANY of the permissions)
 */
export declare const requireAnyPermission: (permissions: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Multiple permissions middleware (user needs ALL of the permissions)
 */
export declare const requireAllPermissions: (permissions: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Resource ownership middleware
 * Checks if user owns the resource or has admin permissions
 */
export declare const requireOwnershipOrPermission: (resourceType: string, resourceIdParam: string, adminPermission: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Admin middleware (shorthand for ADMIN or SUPER_ADMIN roles)
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Super Admin middleware
 */
export declare const requireSuperAdmin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Verified user middleware
 */
export declare const requireVerified: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map