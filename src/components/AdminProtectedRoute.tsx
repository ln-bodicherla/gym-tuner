import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { user, loading: authLoading, session } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  console.log('AdminProtectedRoute check:', { 
    user: user?.email || 'none', 
    hasSession: !!session, 
    authLoading,
    isAdmin,
    adminLoading,
    path: location.pathname 
  });

  // Show loading while checking auth or admin status
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user || !session) {
    console.log('Access denied - no valid authentication');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Show access denied if not admin
  if (!isAdmin) {
    console.log('Access denied - user is not admin');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You don't have admin privileges to access this page.</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  console.log('Admin access granted');
  return <>{children}</>;
};

export default AdminProtectedRoute;