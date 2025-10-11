"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireVerified = exports.requireSuperAdmin = exports.requireAdmin = exports.requireOwnershipOrPermission = exports.requireAllPermissions = exports.requireAnyPermission = exports.requirePermission = exports.requireRole = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const database_1 = require("../config/database");
const permissionService_1 = require("../services/permissionService");
/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authMiddleware = async (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
        if (!decoded || !decoded.id) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        // Find user in database
        const user = await database_1.prisma.user.findUnique({
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Role-based authorization middleware
 * Checks if user has required role
 */
const requireRole = (roles) => {
    return async (req, res, next) => {
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
exports.requireRole = requireRole;
/**
 * Permission-based authorization middleware
 * Checks if user has required permission
 */
const requirePermission = (permission) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const hasPermission = await permissionService_1.PermissionService.hasPermission(req.user.id, permission);
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
exports.requirePermission = requirePermission;
/**
 * Multiple permissions middleware (user needs ANY of the permissions)
 */
const requireAnyPermission = (permissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const hasAnyPermission = await permissionService_1.PermissionService.hasAnyPermission(req.user.id, permissions);
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
exports.requireAnyPermission = requireAnyPermission;
/**
 * Multiple permissions middleware (user needs ALL of the permissions)
 */
const requireAllPermissions = (permissions) => {
    return async (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const hasAllPermissions = await permissionService_1.PermissionService.hasAllPermissions(req.user.id, permissions);
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
exports.requireAllPermissions = requireAllPermissions;
/**
 * Resource ownership middleware
 * Checks if user owns the resource or has admin permissions
 */
const requireOwnershipOrPermission = (resourceType, resourceIdParam, adminPermission) => {
    return async (req, res, next) => {
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
        const hasAdminPermission = await permissionService_1.PermissionService.hasPermission(req.user.id, adminPermission);
        if (hasAdminPermission) {
            next();
            return;
        }
        // Check ownership
        const canPerformAction = await permissionService_1.PermissionService.canPerformAction(req.user.id, `${resourceType}:update:own`, resourceType, resourceId);
        if (!canPerformAction) {
            res.status(403).json({
                error: 'You can only access your own resources or need admin permissions'
            });
            return;
        }
        next();
    };
};
exports.requireOwnershipOrPermission = requireOwnershipOrPermission;
/**
 * Admin middleware (shorthand for ADMIN or SUPER_ADMIN roles)
 */
exports.requireAdmin = (0, exports.requireRole)(['ADMIN', 'SUPER_ADMIN']);
/**
 * Super Admin middleware
 */
exports.requireSuperAdmin = (0, exports.requireRole)('SUPER_ADMIN');
/**
 * Verified user middleware
 */
const requireVerified = async (req, res, next) => {
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
exports.requireVerified = requireVerified;
//# sourceMappingURL=auth.middleware.js.map