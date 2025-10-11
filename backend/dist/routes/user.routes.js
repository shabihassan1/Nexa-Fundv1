"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permissions_1 = require("../constants/permissions");
const router = express_1.default.Router();
// Admin-only routes
router.get('/', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, user_controller_1.userController.getAllUsers);
router.put('/:userId/role', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_MANAGE_ROLES), user_controller_1.userController.updateUserRole);
router.put('/:userId/status', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_BAN), user_controller_1.userController.updateUserStatus);
router.put('/:userId/verify', auth_middleware_1.authMiddleware, (0, auth_middleware_1.requirePermission)(permissions_1.PERMISSIONS.USER_VERIFY), user_controller_1.userController.verifyUser);
router.get('/stats', auth_middleware_1.authMiddleware, auth_middleware_1.requireAdmin, user_controller_1.userController.getUserStats);
exports.default = router;
//# sourceMappingURL=user.routes.js.map