import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Activity, AlertTriangle, Users } from 'lucide-react';

interface SecurityAuditEvent {
  id: string;
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  error_message?: string;
  metadata?: any;
  created_at: string;
}

const SecurityDashboard = () => {
  const [auditEvents, setAuditEvents] = useState<SecurityAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    failedAttempts: 0,
    uniqueUsers: 0,
    recentLogins: 0
  });

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      // Load recent audit events
      const { data: events, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;

      // Transform the data to match our interface, handling the ip_address type properly
      const transformedEvents: SecurityAuditEvent[] = (events || []).map(event => ({
        ...event,
        ip_address: event.ip_address ? String(event.ip_address) : undefined
      }));

      setAuditEvents(transformedEvents);

      // Calculate stats
      const totalEvents = transformedEvents.length;
      const failedAttempts = transformedEvents.filter(e => !e.success).length;
      const uniqueUsers = new Set(transformedEvents.map(e => e.user_id)).size;
      const recentLogins = transformedEvents.filter(e => 
        e.action === 'user_login' && 
        new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      setStats({
        totalEvents,
        failedAttempts,
        uniqueUsers,
        recentLogins
      });

    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string, success: boolean) => {
    if (!success) return 'bg-red-100 text-red-800';
    
    switch (action) {
      case 'user_login':
        return 'bg-green-100 text-green-800';
      case 'user_logout':
        return 'bg-blue-100 text-blue-800';
      case 'data_access':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffMs = now.getTime() - eventDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

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

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Recent Security Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditEvents.length === 0 ? (
              <p className="text-gray-500">No security events recorded yet.</p>
            ) : (
              auditEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between py-3 px-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getActionBadgeColor(event.action, event.success)}>
                      {event.action.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">
                        {event.action.replace('_', ' ')}
                      </p>
                      {event.resource_type && (
                        <p className="text-sm text-gray-600">
                          {event.resource_type}: {event.resource_id}
                        </p>
                      )}
                      {event.error_message && (
                        <p className="text-sm text-red-600">
                          Error: {event.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatTimeAgo(event.created_at)}
                    </p>
                    {event.ip_address && (
                      <p className="text-xs text-gray-400">
                        {event.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
