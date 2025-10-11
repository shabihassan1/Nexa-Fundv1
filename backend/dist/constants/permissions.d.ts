/**
 * Permission Constants
 * Defines all available permissions in the system
 */
export declare const PERMISSIONS: {
    readonly CAMPAIGN_CREATE: "campaign:create";
    readonly CAMPAIGN_UPDATE_OWN: "campaign:update:own";
    readonly CAMPAIGN_UPDATE_ANY: "campaign:update:any";
    readonly CAMPAIGN_DELETE_OWN: "campaign:delete:own";
    readonly CAMPAIGN_DELETE_ANY: "campaign:delete:any";
    readonly CAMPAIGN_APPROVE: "campaign:approve";
    readonly CAMPAIGN_REJECT: "campaign:reject";
    readonly CAMPAIGN_FLAG: "campaign:flag";
    readonly CAMPAIGN_VIEW_ALL: "campaign:view:all";
    readonly USER_VIEW_PROFILE: "user:view:profile";
    readonly USER_UPDATE_OWN: "user:update:own";
    readonly USER_UPDATE_ANY: "user:update:any";
    readonly USER_DELETE_OWN: "user:delete:own";
    readonly USER_DELETE_ANY: "user:delete:any";
    readonly USER_BAN: "user:ban";
    readonly USER_SUSPEND: "user:suspend";
    readonly USER_VERIFY: "user:verify";
    readonly USER_MANAGE_ROLES: "user:manage:roles";
    readonly CONTRIBUTION_CREATE: "contribution:create";
    readonly CONTRIBUTION_VIEW_OWN: "contribution:view:own";
    readonly CONTRIBUTION_VIEW_ALL: "contribution:view:all";
    readonly CONTRIBUTION_REFUND: "contribution:refund";
    readonly REPORT_CREATE: "report:create";
    readonly REPORT_VIEW_OWN: "report:view:own";
    readonly REPORT_VIEW_ALL: "report:view:all";
    readonly REPORT_REVIEW: "report:review";
    readonly REPORT_RESOLVE: "report:resolve";
    readonly MILESTONE_CREATE: "milestone:create";
    readonly MILESTONE_UPDATE: "milestone:update";
    readonly MILESTONE_DELETE: "milestone:delete";
    readonly MILESTONE_VOTE: "milestone:vote";
    readonly MILESTONE_APPROVE: "milestone:approve";
    readonly REWARD_TIER_CREATE: "reward_tier:create";
    readonly REWARD_TIER_UPDATE: "reward_tier:update";
    readonly REWARD_TIER_DELETE: "reward_tier:delete";
    readonly PLATFORM_ANALYTICS: "platform:analytics";
    readonly PLATFORM_SETTINGS: "platform:settings";
    readonly PLATFORM_AUDIT_LOGS: "platform:audit:logs";
    readonly MODERATE_CONTENT: "moderate:content";
    readonly MODERATE_COMMENTS: "moderate:comments";
    readonly MODERATE_USERS: "moderate:users";
};
/**
 * Role-based permission mapping
 * Defines what permissions each role has by default
 */
export declare const ROLE_PERMISSIONS: {
    readonly SUPER_ADMIN: readonly ("campaign:create" | "campaign:update:own" | "campaign:update:any" | "campaign:delete:own" | "campaign:delete:any" | "campaign:approve" | "campaign:reject" | "campaign:flag" | "campaign:view:all" | "user:view:profile" | "user:update:own" | "user:update:any" | "user:delete:own" | "user:delete:any" | "user:ban" | "user:suspend" | "user:verify" | "user:manage:roles" | "contribution:create" | "contribution:view:own" | "contribution:view:all" | "contribution:refund" | "report:create" | "report:view:own" | "report:view:all" | "report:review" | "report:resolve" | "milestone:create" | "milestone:update" | "milestone:delete" | "milestone:vote" | "milestone:approve" | "reward_tier:create" | "reward_tier:update" | "reward_tier:delete" | "platform:analytics" | "platform:settings" | "platform:audit:logs" | "moderate:content" | "moderate:comments" | "moderate:users")[];
    readonly ADMIN: readonly ["campaign:view:all", "campaign:update:any", "campaign:delete:any", "campaign:approve", "campaign:reject", "campaign:flag", "user:view:profile", "user:update:any", "user:ban", "user:suspend", "user:verify", "report:view:all", "report:review", "report:resolve", "moderate:content", "moderate:comments", "moderate:users", "platform:analytics"];
    readonly MODERATOR: readonly ["campaign:view:all", "campaign:flag", "user:view:profile", "user:suspend", "report:view:all", "report:review", "moderate:content", "moderate:comments"];
    readonly CREATOR: readonly ["campaign:create", "campaign:update:own", "campaign:delete:own", "user:view:profile", "user:update:own", "user:delete:own", "contribution:create", "contribution:view:own", "report:create", "report:view:own", "milestone:create", "milestone:update", "milestone:delete", "milestone:vote", "reward_tier:create", "reward_tier:update", "reward_tier:delete"];
    readonly BACKER: readonly ["user:view:profile", "user:update:own", "user:delete:own", "contribution:create", "contribution:view:own", "report:create", "report:view:own", "milestone:vote"];
    readonly USER: readonly ["user:view:profile", "user:update:own", "user:delete:own", "report:create", "report:view:own"];
};
/**
 * Permission categories for better organization
 */
export declare const PERMISSION_CATEGORIES: {
    readonly CAMPAIGN: "Campaign Management";
    readonly USER: "User Management";
    readonly CONTRIBUTION: "Contribution Management";
    readonly REPORT: "Report Management";
    readonly MILESTONE: "Milestone Management";
    readonly REWARD_TIER: "Reward Tier Management";
    readonly PLATFORM: "Platform Management";
    readonly MODERATION: "Moderation";
};
/**
 * Role hierarchy for permission inheritance
 * Higher roles inherit permissions from lower roles
 */
export declare const ROLE_HIERARCHY: {
    readonly SUPER_ADMIN: 6;
    readonly ADMIN: 5;
    readonly MODERATOR: 4;
    readonly CREATOR: 3;
    readonly BACKER: 2;
    readonly USER: 1;
};
/**
 * Default role assignment rules
 */
export declare const ROLE_ASSIGNMENT_RULES: {
    readonly DEFAULT_ROLE: "USER";
    readonly AUTO_UPGRADE: {
        readonly BACKER: {
            readonly condition: "first_contribution";
            readonly description: "Automatically upgraded to BACKER after first contribution";
        };
        readonly CREATOR: {
            readonly condition: "verified_and_requested";
            readonly description: "Can be upgraded to CREATOR after verification and request";
        };
    };
};
//# sourceMappingURL=permissions.d.ts.map