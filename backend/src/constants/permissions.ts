/**
 * Permission Constants
 * Defines all available permissions in the system
 */

export const PERMISSIONS = {
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
} as const;

/**
 * Role-based permission mapping
 * Defines what permissions each role has by default
 */
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ],

  ADMIN: [
    // Campaign management
    PERMISSIONS.CAMPAIGN_VIEW_ALL,
    PERMISSIONS.CAMPAIGN_UPDATE_ANY,
    PERMISSIONS.CAMPAIGN_DELETE_ANY,
    PERMISSIONS.CAMPAIGN_APPROVE,
    PERMISSIONS.CAMPAIGN_REJECT,
    PERMISSIONS.CAMPAIGN_FLAG,

    // User management
    PERMISSIONS.USER_VIEW_PROFILE,
    PERMISSIONS.USER_UPDATE_ANY,
    PERMISSIONS.USER_BAN,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.USER_VERIFY,

    // Report management
    PERMISSIONS.REPORT_VIEW_ALL,
    PERMISSIONS.REPORT_REVIEW,
    PERMISSIONS.REPORT_RESOLVE,

    // Moderation
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MODERATE_COMMENTS,
    PERMISSIONS.MODERATE_USERS,

    // Platform
    PERMISSIONS.PLATFORM_ANALYTICS,
  ],

  MODERATOR: [
    // Campaign moderation
    PERMISSIONS.CAMPAIGN_VIEW_ALL,
    PERMISSIONS.CAMPAIGN_FLAG,

    // User moderation
    PERMISSIONS.USER_VIEW_PROFILE,
    PERMISSIONS.USER_SUSPEND,

    // Report management
    PERMISSIONS.REPORT_VIEW_ALL,
    PERMISSIONS.REPORT_REVIEW,

    // Moderation
    PERMISSIONS.MODERATE_CONTENT,
    PERMISSIONS.MODERATE_COMMENTS,
  ],

  CREATOR: [
    // Campaign management (own)
    PERMISSIONS.CAMPAIGN_CREATE,
    PERMISSIONS.CAMPAIGN_UPDATE_OWN,
    PERMISSIONS.CAMPAIGN_DELETE_OWN,

    // User management (own)
    PERMISSIONS.USER_VIEW_PROFILE,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.USER_DELETE_OWN,

    // Contribution
    PERMISSIONS.CONTRIBUTION_CREATE,
    PERMISSIONS.CONTRIBUTION_VIEW_OWN,

    // Reports
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_VIEW_OWN,

    // Milestones
    PERMISSIONS.MILESTONE_CREATE,
    PERMISSIONS.MILESTONE_UPDATE,
    PERMISSIONS.MILESTONE_DELETE,
    PERMISSIONS.MILESTONE_VOTE,

    // Reward tiers
    PERMISSIONS.REWARD_TIER_CREATE,
    PERMISSIONS.REWARD_TIER_UPDATE,
    PERMISSIONS.REWARD_TIER_DELETE,
  ],

  BACKER: [
    // User management (own)
    PERMISSIONS.USER_VIEW_PROFILE,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.USER_DELETE_OWN,

    // Contribution
    PERMISSIONS.CONTRIBUTION_CREATE,
    PERMISSIONS.CONTRIBUTION_VIEW_OWN,

    // Reports
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_VIEW_OWN,

    // Milestones
    PERMISSIONS.MILESTONE_VOTE,
  ],

  USER: [
    // Basic user permissions
    PERMISSIONS.USER_VIEW_PROFILE,
    PERMISSIONS.USER_UPDATE_OWN,
    PERMISSIONS.USER_DELETE_OWN,

    // Can view and report
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_VIEW_OWN,
  ],
} as const;

/**
 * Permission categories for better organization
 */
export const PERMISSION_CATEGORIES = {
  CAMPAIGN: 'Campaign Management',
  USER: 'User Management',
  CONTRIBUTION: 'Contribution Management',
  REPORT: 'Report Management',
  MILESTONE: 'Milestone Management',
  REWARD_TIER: 'Reward Tier Management',
  PLATFORM: 'Platform Management',
  MODERATION: 'Moderation',
} as const;

/**
 * Role hierarchy for permission inheritance
 * Higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY = {
  SUPER_ADMIN: 6,
  ADMIN: 5,
  MODERATOR: 4,
  CREATOR: 3,
  BACKER: 2,
  USER: 1,
} as const;

/**
 * Default role assignment rules
 */
export const ROLE_ASSIGNMENT_RULES = {
  // New users start as USER
  DEFAULT_ROLE: 'USER' as const,
  
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
} as const; 