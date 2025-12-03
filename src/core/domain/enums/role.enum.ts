export enum Role {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export const RoleHierarchy: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.MODERATOR]: 2,
  [Role.ADMIN]: 3,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
}
