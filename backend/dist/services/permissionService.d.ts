import { UserRole } from '../generated/prisma';
export declare class PermissionService {
    /**
     * Check if a user has a specific permission
     */
    static hasPermission(userId: string, permission: string): Promise<boolean>;
    /**
     * Check if a user has any of the specified permissions
     */
    static hasAnyPermission(userId: string, permissions: string[]): Promise<boolean>;
    /**
     * Check if a user has all of the specified permissions
     */
    static hasAllPermissions(userId: string, permissions: string[]): Promise<boolean>;
    /**
     * Get all permissions for a user (role-based + custom)
     */
    static getUserPermissions(userId: string): Promise<string[]>;
    /**
     * Grant a custom permission to a user
     */
    static grantPermission(userId: string, permissionName: string): Promise<boolean>;
    /**
     * Revoke a custom permission from a user
     */
    static revokePermission(userId: string, permissionName: string): Promise<boolean>;
    /**
     * Update user role
     */
    static updateUserRole(userId: string, newRole: UserRole): Promise<boolean>;
    /**
     * Check if user can perform action on resource
     * This handles ownership-based permissions (e.g., update own campaign)
     */
    static canPerformAction(userId: string, action: string, resourceType: string, resourceId?: string): Promise<boolean>;
    /**
     * Check if user owns a resource
     */
    private static checkOwnership;
    /**
     * Auto-upgrade user role based on activity
     */
    static autoUpgradeRole(userId: string): Promise<void>;
    /**
     * Initialize default permissions in database
     */
    static initializePermissions(): Promise<void>;
    /**
     * Get permission category based on permission name
     */
    private static getPermissionCategory;
}
//# sourceMappingURL=permissionService.d.ts.map