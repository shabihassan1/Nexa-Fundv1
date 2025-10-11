import express from 'express';
import { userController } from '../controllers/user.controller';
import { authMiddleware, requireAdmin, requirePermission } from '../middleware/auth.middleware';
import { PERMISSIONS } from '../constants/permissions';

const router = express.Router();

// Admin-only routes
router.get('/', authMiddleware, requireAdmin, userController.getAllUsers);
router.put('/:userId/role', authMiddleware, requirePermission(PERMISSIONS.USER_MANAGE_ROLES), userController.updateUserRole);
router.put('/:userId/status', authMiddleware, requirePermission(PERMISSIONS.USER_BAN), userController.updateUserStatus);
router.put('/:userId/verify', authMiddleware, requirePermission(PERMISSIONS.USER_VERIFY), userController.verifyUser);
router.get('/stats', authMiddleware, requireAdmin, userController.getUserStats);

export default router; 