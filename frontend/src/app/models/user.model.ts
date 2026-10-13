export type UserRole = 'ADMIN' | 'DEVELOPER' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}
