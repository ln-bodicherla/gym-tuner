
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthState {
  isAuthenticated: boolean;
  loading: boolean;
  adminInfo: {
    id: string;
    email: string;
    full_name: string;
  } | null;
}

export const useAdminAuth = () => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    isAuthenticated: false,
    loading: true,
    adminInfo: null
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setAuthState(prev => ({ ...prev, loading: false }));
        return;
      }

      console.log('[ADMIN-AUTH] Checking auth status with token');

      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'verify', session_token: token }
      });

      if (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('admin_token');
        setAuthState({
          isAuthenticated: false,
          loading: false,
          adminInfo: null
        });
        return;
      }

      if (!data?.valid) {
        console.log('Token verification failed:', data?.error || 'Invalid token');
        localStorage.removeItem('admin_token');
        setAuthState({
          isAuthenticated: false,
          loading: false,
          adminInfo: null
        });
        return;
      }

      setAuthState({
        isAuthenticated: true,
        loading: false,
        adminInfo: data.admin
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('admin_token');
      setAuthState({
        isAuthenticated: false,
        loading: false,
        adminInfo: null
      });
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[ADMIN-AUTH] Attempting login for:', email);
      
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'login', email, password }
      });

      console.log('[ADMIN-AUTH] Login response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message || 'Login failed' };
      }

      if (!data?.success) {
        console.log('Login failed with data:', data);
        return { success: false, error: data?.error || 'Invalid credentials' };
      }

      localStorage.setItem('admin_token', data.session_token);
      await checkAuthStatus();
      return { success: true };
    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, error: 'Network error occurred' };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setAuthState({
      isAuthenticated: false,
      loading: false,
      adminInfo: null
    });
  };

  const getAnalytics = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('No admin session');

      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'analytics', session_token: token }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Analytics fetch failed:', error);
      throw error;
    }
  };

  return {
    ...authState,
    login,
    logout,
    getAnalytics,
    refreshAuth: checkAuthStatus
  };
};
