
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuditLogEntry {
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: any;
}

export const useSecurityAuditLogger = () => {
  const { user } = useAuth();

  const logSecurityEvent = async (entry: AuditLogEntry) => {
    // Since we removed the security audit table, we'll just log to console
    // This maintains the interface but doesn't break the app
    if (!user?.id) return;

    console.log('Security Event:', {
      user_id: user.id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      metadata: entry.metadata,
      timestamp: new Date().toISOString()
    });
  };

  return { logSecurityEvent };
};

// Hook for automatic login/logout audit logging
export const useAuthAuditLogger = () => {
  const { user, session } = useAuth();
  const { logSecurityEvent } = useSecurityAuditLogger();

  useEffect(() => {
    if (user && session) {
      logSecurityEvent({
        action: 'user_login',
        metadata: { 
          login_method: session.user.app_metadata?.provider || 'email',
          user_email: user.email 
        }
      });
    }
  }, [user, session]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        logSecurityEvent({
          action: 'user_logout',
          metadata: { user_email: user.email }
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);
};
</ov-write>

<lov-write file_path="src/components/SecurityDashboard.tsx">
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, AlertTriangle, Users } from 'lucide-react';

const SecurityDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    failedAttempts: 0,
    uniqueUsers: 0,
    recentLogins: 0
  });

  useEffect(() => {
    // Since we removed the security audit system, just show placeholder data
    setStats({
      totalEvents: 0,
      failedAttempts: 0,
      uniqueUsers: 0,
      recentLogins: 0
    });
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Security Dashboard...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold">{stats.failedAttempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Unique Users</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Recent Logins</p>
                <p className="text-2xl font-bold">{stats.recentLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Security audit system has been simplified.</p>
            <p className="text-sm mt-2">Events are now logged to console for debugging purposes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
