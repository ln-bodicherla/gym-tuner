
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    if (!user?.id) return;

    try {
      // Get client IP and user agent (limited in browser context)
      const userAgent = navigator.userAgent;
      
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          user_agent: userAgent,
          metadata: entry.metadata,
          success: true
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw error to avoid breaking app functionality
    }
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
