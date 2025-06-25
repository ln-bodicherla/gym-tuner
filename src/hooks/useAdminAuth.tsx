
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

      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'verify', sessionToken: token }
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
        adminInfo: data.user
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
      console.log('Attempting admin login for:', email);
      
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'login', email, password }
      });

      if (error) {
        console.error('Login request failed:', error);
        return { success: false, error: 'Network error occurred' };
      }

      if (!data?.success) {
        return { success: false, error: data?.error || 'Login failed' };
      }

      localStorage.setItem('admin_token', data.sessionToken);
      
      setAuthState({
        isAuthenticated: true,
        loading: false,
        adminInfo: data.user
      });

      return { success: true };
    } catch (error) {
      console.error('Login exception:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (token) {
        await supabase.functions.invoke('admin-auth', {
          body: { action: 'logout', sessionToken: token }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('admin_token');
      setAuthState({
        isAuthenticated: false,
        loading: false,
        adminInfo: null
      });
    }
  };

  return {
    ...authState,
    login,
    logout,
    refreshAuth: checkAuthStatus
  };
};
