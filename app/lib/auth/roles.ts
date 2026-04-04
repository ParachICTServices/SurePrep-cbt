import type { User } from '@/app/type';

export function isAdminUser(user: User | null | undefined): boolean {
  if (!user?.role) return false;
  return user.role.toLowerCase() === 'admin';
}

export function getPostLoginPath(user: User): string {
  return isAdminUser(user) ? '/admin/dashboard' : '/dashboard';
}
