
import { ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';

interface RoleBasedAccessProps {
  requiredRole: 'admin' | 'moderator' | 'user';
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleBasedAccess = ({ requiredRole, children, fallback = null }: RoleBasedAccessProps) => {
  const { hasRole, loading } = useUserRole();

  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>;
  }

  if (!hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedAccess;
