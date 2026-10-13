import { UserRole } from './user.model';

export const normalizeRole = (role: unknown): UserRole | null => {
  if (typeof role !== 'string') {
    return null;
  }

  const normalizedRole = role.trim().toUpperCase();
  return normalizedRole === 'ADMIN'
    || normalizedRole === 'DEVELOPER'
    || normalizedRole === 'VIEWER'
    ? normalizedRole
    : null;
};
