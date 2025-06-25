
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type UserRole = 'admin' | 'moderator' | 'user' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserRole = async () => {
      if (!user?.id) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_current_user_role');

        if (error) {
          console.error('Error loading user role:', error);
          setRole('user'); // Default to user role
        } else {
          setRole(data || 'user');
        }
      } catch (error) {
        console.error('Error loading user role:', error);
        setRole('user'); // Default to user role
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [user?.id]);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!role || !requiredRole) return false;
    
    const roleHierarchy = { admin: 3, moderator: 2, user: 1 };
    return roleHierarchy[role] >= roleHierarchy[requiredRole];
  };

  const isAdmin = (): boolean => role === 'admin';
  const isModerator = (): boolean => role === 'moderator' || role === 'admin';

  return {
    role,
    loading,
    hasRole,
    isAdmin,
    isModerator
  };
};
