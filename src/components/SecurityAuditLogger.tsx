
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
