"use strict";
/**
 * Permission Constants
 * Defines all available permissions in the system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_ASSIGNMENT_RULES = exports.ROLE_HIERARCHY = exports.PERMISSION_CATEGORIES = exports.ROLE_PERMISSIONS = exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
    // Campaign Management
    CAMPAIGN_CREATE: 'campaign:create',
    CAMPAIGN_UPDATE_OWN: 'campaign:update:own',
    CAMPAIGN_UPDATE_ANY: 'campaign:update:any',
    CAMPAIGN_DELETE_OWN: 'campaign:delete:own',
    CAMPAIGN_DELETE_ANY: 'campaign:delete:any',
    CAMPAIGN_APPROVE: 'campaign:approve',
    CAMPAIGN_REJECT: 'campaign:reject',
    CAMPAIGN_FLAG: 'campaign:flag',
    CAMPAIGN_VIEW_ALL: 'campaign:view:all',
    // User Management
    USER_VIEW_PROFILE: 'user:view:profile',
    USER_UPDATE_OWN: 'user:update:own',
    USER_UPDATE_ANY: 'user:update:any',
    USER_DELETE_OWN: 'user:delete:own',
    USER_DELETE_ANY: 'user:delete:any',
    USER_BAN: 'user:ban',
    USER_SUSPEND: 'user:suspend',
    USER_VERIFY: 'user:verify',
    USER_MANAGE_ROLES: 'user:manage:roles',
    // Contribution Management
    CONTRIBUTION_CREATE: 'contribution:create',
    CONTRIBUTION_VIEW_OWN: 'contribution:view:own',
    CONTRIBUTION_VIEW_ALL: 'contribution:view:all',
    CONTRIBUTION_REFUND: 'contribution:refund',
    // Report Management
    REPORT_CREATE: 'report:create',
    REPORT_VIEW_OWN: 'report:view:own',
    REPORT_VIEW_ALL: 'report:view:all',
    REPORT_REVIEW: 'report:review',
    REPORT_RESOLVE: 'report:resolve',
    // Milestone Management
    MILESTONE_CREATE: 'milestone:create',
    MILESTONE_UPDATE: 'milestone:update',
    MILESTONE_DELETE: 'milestone:delete',
    MILESTONE_VOTE: 'milestone:vote',
    MILESTONE_APPROVE: 'milestone:approve',
    // Reward Tier Management
    REWARD_TIER_CREATE: 'reward_tier:create',
    REWARD_TIER_UPDATE: 'reward_tier:update',
    REWARD_TIER_DELETE: 'reward_tier:delete',
    // Platform Management
    PLATFORM_ANALYTICS: 'platform:analytics',
    PLATFORM_SETTINGS: 'platform:settings',
    PLATFORM_AUDIT_LOGS: 'platform:audit:logs',
    // Moderation
    MODERATE_CONTENT: 'moderate:content',
    MODERATE_COMMENTS: 'moderate:comments',
    MODERATE_USERS: 'moderate:users',
};
/**
 * Role-based permission mapping
 * Defines what permissions each role has by default
 */
exports.ROLE_PERMISSIONS = {
    SUPER_ADMIN: [
        // All permissions
        ...Object.values(exports.PERMISSIONS)
    ],
    ADMIN: [
        // Campaign management
        exports.PERMISSIONS.CAMPAIGN_VIEW_ALL,
        exports.PERMISSIONS.CAMPAIGN_UPDATE_ANY,
        exports.PERMISSIONS.CAMPAIGN_DELETE_ANY,
        exports.PERMISSIONS.CAMPAIGN_APPROVE,
        exports.PERMISSIONS.CAMPAIGN_REJECT,
        exports.PERMISSIONS.CAMPAIGN_FLAG,
        // User management
        exports.PERMISSIONS.USER_VIEW_PROFILE,
        exports.PERMISSIONS.USER_UPDATE_ANY,
        exports.PERMISSIONS.USER_BAN,
        exports.PERMISSIONS.USER_SUSPEND,
        exports.PERMISSIONS.USER_VERIFY,
        // Report management
        exports.PERMISSIONS.REPORT_VIEW_ALL,
        exports.PERMISSIONS.REPORT_REVIEW,
        exports.PERMISSIONS.REPORT_RESOLVE,
        // Moderation
        exports.PERMISSIONS.MODERATE_CONTENT,
        exports.PERMISSIONS.MODERATE_COMMENTS,
        exports.PERMISSIONS.MODERATE_USERS,
        // Platform
        exports.PERMISSIONS.PLATFORM_ANALYTICS,
    ],
    MODERATOR: [
        // Campaign moderation
        exports.PERMISSIONS.CAMPAIGN_VIEW_ALL,
        exports.PERMISSIONS.CAMPAIGN_FLAG,
        // User moderation
        exports.PERMISSIONS.USER_VIEW_PROFILE,
        exports.PERMISSIONS.USER_SUSPEND,
        // Report management
        exports.PERMISSIONS.REPORT_VIEW_ALL,
        exports.PERMISSIONS.REPORT_REVIEW,
        // Moderation
        exports.PERMISSIONS.MODERATE_CONTENT,
        exports.PERMISSIONS.MODERATE_COMMENTS,
    ],
    CREATOR: [
        // Campaign management (own)
        exports.PERMISSIONS.CAMPAIGN_CREATE,
        exports.PERMISSIONS.CAMPAIGN_UPDATE_OWN,
        exports.PERMISSIONS.CAMPAIGN_DELETE_OWN,
        // User management (own)
        exports.PERMISSIONS.USER_VIEW_PROFILE,
        exports.PERMISSIONS.USER_UPDATE_OWN,
        exports.PERMISSIONS.USER_DELETE_OWN,
        // Contribution
        exports.PERMISSIONS.CONTRIBUTION_CREATE,
        exports.PERMISSIONS.CONTRIBUTION_VIEW_OWN,
        // Reports
        exports.PERMISSIONS.REPORT_CREATE,
        exports.PERMISSIONS.REPORT_VIEW_OWN,
        // Milestones
        exports.PERMISSIONS.MILESTONE_CREATE,
        exports.PERMISSIONS.MILESTONE_UPDATE,
        exports.PERMISSIONS.MILESTONE_DELETE,
        exports.PERMISSIONS.MILESTONE_VOTE,
        // Reward tiers
        exports.PERMISSIONS.REWARD_TIER_CREATE,
        exports.PERMISSIONS.REWARD_TIER_UPDATE,
        exports.PERMISSIONS.REWARD_TIER_DELETE,
    ],
    BACKER: [
        // User management (own)
        exports.PERMISSIONS.USER_VIEW_PROFILE,
        exports.PERMISSIONS.USER_UPDATE_OWN,
        exports.PERMISSIONS.USER_DELETE_OWN,
        // Contribution
        exports.PERMISSIONS.CONTRIBUTION_CREATE,
        exports.PERMISSIONS.CONTRIBUTION_VIEW_OWN,
        // Reports
        exports.PERMISSIONS.REPORT_CREATE,
        exports.PERMISSIONS.REPORT_VIEW_OWN,
        // Milestones
        exports.PERMISSIONS.MILESTONE_VOTE,
    ],
    USER: [
        // Basic user permissions
        exports.PERMISSIONS.USER_VIEW_PROFILE,
        exports.PERMISSIONS.USER_UPDATE_OWN,
        exports.PERMISSIONS.USER_DELETE_OWN,
        // Can view and report
        exports.PERMISSIONS.REPORT_CREATE,
        exports.PERMISSIONS.REPORT_VIEW_OWN,
    ],
};
/**
 * Permission categories for better organization
 */
exports.PERMISSION_CATEGORIES = {
    CAMPAIGN: 'Campaign Management',
    USER: 'User Management',
    CONTRIBUTION: 'Contribution Management',
    REPORT: 'Report Management',
    MILESTONE: 'Milestone Management',
    REWARD_TIER: 'Reward Tier Management',
    PLATFORM: 'Platform Management',
    MODERATION: 'Moderation',
};
/**
 * Role hierarchy for permission inheritance
 * Higher roles inherit permissions from lower roles
 */
exports.ROLE_HIERARCHY = {
    SUPER_ADMIN: 6,
    ADMIN: 5,
    MODERATOR: 4,
    CREATOR: 3,
    BACKER: 2,
    USER: 1,
};
/**
 * Default role assignment rules
 */
exports.ROLE_ASSIGNMENT_RULES = {
    // New users start as USER
    DEFAULT_ROLE: 'USER',
    // Auto-upgrade rules
    AUTO_UPGRADE: {
        // Users become BACKER after first contribution
        BACKER: {
            condition: 'first_contribution',
            description: 'Automatically upgraded to BACKER after first contribution'
        },
        // Users can become CREATOR after verification
        CREATOR: {
            condition: 'verified_and_requested',
            description: 'Can be upgraded to CREATOR after verification and request'
        }
    }
};
//# sourceMappingURL=permissions.js.map