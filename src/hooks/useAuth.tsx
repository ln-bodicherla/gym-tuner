
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for password reset in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const isPasswordReset = urlParams.get('reset') === 'true';
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing all state');
          // Ensure state is completely cleared
          setSession(null);
          setUser(null);
          // Clear any remaining auth data from storage
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
          // Force redirect to landing page after sign out
          window.location.href = '/';
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is a password reset flow
          if (isPasswordReset) {
            // For password reset, stay on auth page to allow user to set new password
            console.log('Password reset flow detected');
          } else {
            // Only redirect if currently on auth page and not a password reset
            if (window.location.pathname === '/auth') {
              window.location.href = '/dashboard';
            }
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected');
          // User clicked the reset link, they can now set a new password
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    // Get the actual current URL instead of localhost
    const redirectUrl = window.location.origin.includes('localhost') 
      ? window.location.origin.replace('localhost:3000', window.location.hostname) 
      : `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    // Use the actual current URL, not localhost
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('Initiating complete sign out...');
      
      // Clear local state first
      setSession(null);
      setUser(null);
      
      // Sign out from Supabase with 'local' scope to clear browser storage
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Error signing out from Supabase:', error);
      }
      
      // Force clear all auth-related storage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-icicfihvflooltswigjb-auth-token');
      sessionStorage.clear();
      
      console.log('Successfully cleared all authentication data');
      
      // Force redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear everything and redirect
      setSession(null);
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signInWithGoogle, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
