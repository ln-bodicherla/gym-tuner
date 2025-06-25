
import { ReactNode } from 'react';

interface RoleBasedAccessProps {
  requiredRole: 'admin' | 'moderator' | 'user';
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleBasedAccess = ({ requiredRole, children, fallback = null }: RoleBasedAccessProps) => {
  // Since we removed the complex role system, we'll just show admin content for now
  // In a real implementation, you might check user permissions differently
  const isAdmin = requiredRole === 'admin'; // Simplified logic
  
  if (!isAdmin && requiredRole !== 'user') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedAccess;
