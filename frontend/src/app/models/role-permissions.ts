import { UserRole } from './user.model';

export const ROLE_PERMISSIONS: Record<UserRole, readonly string[]> = {
  ADMIN: [
    'Create tickets',
    'Edit tickets',
    'Delete tickets',
    'Move tickets',
    'Manage users',
  ],
  DEVELOPER: [
    'Create tickets',
    'Edit assigned tickets',
    'Move tickets',
  ],
  VIEWER: ['View tickets only'],
};
