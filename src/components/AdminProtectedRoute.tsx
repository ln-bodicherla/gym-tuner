import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { adminUser, loading } = useAdminAuth();
  const location = useLocation();

  console.log('AdminProtectedRoute check:', { 
    adminUser: adminUser?.email || 'none', 
    loading,
    path: location.pathname 
  });

  // Show loading while checking admin auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to admin login if not authenticated
  if (!adminUser) {
    console.log('Access denied - no admin user');
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  console.log('Admin access granted for:', adminUser.email);
  return <>{children}</>;
};

export default AdminProtectedRoute;