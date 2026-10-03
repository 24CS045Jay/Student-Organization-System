export type OrgRole = 'student' | 'volunteer' | 'event_manager' | 'treasurer' | 'admin';

export const PERMISSIONS = {
  'events:read': ['student', 'volunteer', 'event_manager', 'treasurer', 'admin'],
  'events:write': ['event_manager', 'admin'],
  'finance:read': ['treasurer', 'admin'],
  'finance:write': ['treasurer', 'admin'],
  'members:read': ['student', 'volunteer', 'event_manager', 'treasurer', 'admin'],
  'members:write': ['admin'],
  'members:verify': ['volunteer', 'event_manager', 'treasurer', 'admin'],
  'membership_types:read': ['student', 'volunteer', 'event_manager', 'treasurer', 'admin'],
  'membership_types:write': ['admin'],
  'settings:write': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: OrgRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS[permission] as readonly OrgRole[];
  return allowedRoles.includes(role);
}
