export declare enum Permission {
    CREATE_CAMPAIGN = "CREATE_CAMPAIGN",
    EDIT_OWN_CAMPAIGN = "EDIT_OWN_CAMPAIGN",
    EDIT_ANY_CAMPAIGN = "EDIT_ANY_CAMPAIGN",
    DELETE_OWN_CAMPAIGN = "DELETE_OWN_CAMPAIGN",
    DELETE_ANY_CAMPAIGN = "DELETE_ANY_CAMPAIGN",
    APPROVE_CAMPAIGN = "APPROVE_CAMPAIGN",
    REJECT_CAMPAIGN = "REJECT_CAMPAIGN",
    VIEW_USER_PROFILES = "VIEW_USER_PROFILES",
    EDIT_USER_ROLES = "EDIT_USER_ROLES",
    BAN_USERS = "BAN_USERS",
    MAKE_CONTRIBUTION = "MAKE_CONTRIBUTION",
    WITHDRAW_FUNDS = "WITHDRAW_FUNDS",
    VIEW_FINANCIAL_REPORTS = "VIEW_FINANCIAL_REPORTS",
    MODERATE_CONTENT = "MODERATE_CONTENT",
    VIEW_REPORTS = "VIEW_REPORTS",
    HANDLE_DISPUTES = "HANDLE_DISPUTES",
    MANAGE_PLATFORM_SETTINGS = "MANAGE_PLATFORM_SETTINGS",
    VIEW_ANALYTICS = "VIEW_ANALYTICS"
}
export declare const ROLE_PERMISSIONS: Record<string, Permission[]>;
export declare const hasPermission: (userRole: string, userPermissions: string[], permission: Permission) => boolean;
export declare const canUserPerformAction: (user: {
    role: string;
    permissions: string[];
    id: string;
}, permission: Permission, resourceOwnerId?: string) => boolean;
//# sourceMappingURL=permissions.d.ts.map