"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canUserPerformAction = exports.hasPermission = exports.ROLE_PERMISSIONS = exports.Permission = void 0;
var Permission;
(function (Permission) {
    // Campaign permissions
    Permission["CREATE_CAMPAIGN"] = "CREATE_CAMPAIGN";
    Permission["EDIT_OWN_CAMPAIGN"] = "EDIT_OWN_CAMPAIGN";
    Permission["EDIT_ANY_CAMPAIGN"] = "EDIT_ANY_CAMPAIGN";
    Permission["DELETE_OWN_CAMPAIGN"] = "DELETE_OWN_CAMPAIGN";
    Permission["DELETE_ANY_CAMPAIGN"] = "DELETE_ANY_CAMPAIGN";
    Permission["APPROVE_CAMPAIGN"] = "APPROVE_CAMPAIGN";
    Permission["REJECT_CAMPAIGN"] = "REJECT_CAMPAIGN";
    // User permissions
    Permission["VIEW_USER_PROFILES"] = "VIEW_USER_PROFILES";
    Permission["EDIT_USER_ROLES"] = "EDIT_USER_ROLES";
    Permission["BAN_USERS"] = "BAN_USERS";
    // Financial permissions
    Permission["MAKE_CONTRIBUTION"] = "MAKE_CONTRIBUTION";
    Permission["WITHDRAW_FUNDS"] = "WITHDRAW_FUNDS";
    Permission["VIEW_FINANCIAL_REPORTS"] = "VIEW_FINANCIAL_REPORTS";
    // Moderation permissions
    Permission["MODERATE_CONTENT"] = "MODERATE_CONTENT";
    Permission["VIEW_REPORTS"] = "VIEW_REPORTS";
    Permission["HANDLE_DISPUTES"] = "HANDLE_DISPUTES";
    // Platform permissions
    Permission["MANAGE_PLATFORM_SETTINGS"] = "MANAGE_PLATFORM_SETTINGS";
    Permission["VIEW_ANALYTICS"] = "VIEW_ANALYTICS";
})(Permission || (exports.Permission = Permission = {}));
exports.ROLE_PERMISSIONS = {
    ADMIN: [
        // All permissions
        ...Object.values(Permission)
    ],
    CREATOR: [
        Permission.CREATE_CAMPAIGN,
        Permission.EDIT_OWN_CAMPAIGN,
        Permission.DELETE_OWN_CAMPAIGN,
        Permission.MAKE_CONTRIBUTION,
        Permission.WITHDRAW_FUNDS,
        Permission.VIEW_USER_PROFILES,
    ],
    BACKER: [
        Permission.MAKE_CONTRIBUTION,
        Permission.VIEW_USER_PROFILES,
    ],
    MODERATOR: [
        Permission.APPROVE_CAMPAIGN,
        Permission.REJECT_CAMPAIGN,
        Permission.MODERATE_CONTENT,
        Permission.VIEW_REPORTS,
        Permission.HANDLE_DISPUTES,
        Permission.VIEW_USER_PROFILES,
        Permission.MAKE_CONTRIBUTION,
    ],
};
const hasPermission = (userRole, userPermissions, permission) => {
    // Check role-based permissions
    const rolePermissions = exports.ROLE_PERMISSIONS[userRole] || [];
    if (rolePermissions.includes(permission)) {
        return true;
    }
    // Check custom user permissions
    return userPermissions.includes(permission);
};
exports.hasPermission = hasPermission;
const canUserPerformAction = (user, permission, resourceOwnerId) => {
    // Check if user has the permission
    if (!(0, exports.hasPermission)(user.role, user.permissions, permission)) {
        return false;
    }
    // For "own" permissions, check ownership
    if (permission.includes('OWN') && resourceOwnerId && user.id !== resourceOwnerId) {
        return false;
    }
    return true;
};
exports.canUserPerformAction = canUserPerformAction;
//# sourceMappingURL=permissions.js.map