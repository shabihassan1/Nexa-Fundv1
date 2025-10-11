export enum Permission {
  // Campaign permissions
  CREATE_CAMPAIGN = 'CREATE_CAMPAIGN',
  EDIT_OWN_CAMPAIGN = 'EDIT_OWN_CAMPAIGN',
  EDIT_ANY_CAMPAIGN = 'EDIT_ANY_CAMPAIGN',
  DELETE_OWN_CAMPAIGN = 'DELETE_OWN_CAMPAIGN',
  DELETE_ANY_CAMPAIGN = 'DELETE_ANY_CAMPAIGN',
  APPROVE_CAMPAIGN = 'APPROVE_CAMPAIGN',
  REJECT_CAMPAIGN = 'REJECT_CAMPAIGN',
  
  // User permissions
  VIEW_USER_PROFILES = 'VIEW_USER_PROFILES',
  EDIT_USER_ROLES = 'EDIT_USER_ROLES',
  BAN_USERS = 'BAN_USERS',
  
  // Financial permissions
  MAKE_CONTRIBUTION = 'MAKE_CONTRIBUTION',
  WITHDRAW_FUNDS = 'WITHDRAW_FUNDS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
  
  // Moderation permissions
  MODERATE_CONTENT = 'MODERATE_CONTENT',
  VIEW_REPORTS = 'VIEW_REPORTS',
  HANDLE_DISPUTES = 'HANDLE_DISPUTES',
  
  // Platform permissions
  MANAGE_PLATFORM_SETTINGS = 'MANAGE_PLATFORM_SETTINGS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
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

export const hasPermission = (userRole: string, userPermissions: string[], permission: Permission): boolean => {
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  if (rolePermissions.includes(permission)) {
    return true;
  }
  
  // Check custom user permissions
  return userPermissions.includes(permission);
};

export const canUserPerformAction = (
  user: { role: string; permissions: string[]; id: string },
  permission: Permission,
  resourceOwnerId?: string
): boolean => {
  // Check if user has the permission
  if (!hasPermission(user.role, user.permissions, permission)) {
    return false;
  }
  
  // For "own" permissions, check ownership
  if (permission.includes('OWN') && resourceOwnerId && user.id !== resourceOwnerId) {
    return false;
  }
  
  return true;
}; 