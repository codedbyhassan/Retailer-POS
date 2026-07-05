export const ROLES = {
  ADMIN: 'admin',
  CASHIER: 'cashier',
};

export const PERMISSIONS = {
  [ROLES.ADMIN]: [
    'products:read',
    'products:write',
    'inventory:read',
    'inventory:write',
    'sales:read',
    'sales:write',
    'reports:read',
    'settings:read',
    'settings:write',
    'users:read',
    'users:write',
  ],
  [ROLES.CASHIER]: [
    'products:read',
    'sales:read',
    'sales:write',
  ],
};

export function hasPermission(role, permission) {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
