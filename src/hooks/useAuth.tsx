
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing all state');
          setSession(null);
          setUser(null);
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
          window.location.href = '/auth';
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Check if this is NOT a password reset flow
          const urlParams = new URLSearchParams(window.location.search);
          const isPasswordReset = urlParams.get('reset') === 'true';
          
          if (!isPasswordReset && window.location.pathname === '/auth') {
            window.location.href = '/dashboard';
          }
        } else if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery event detected');
          // Don't redirect, let the Auth component handle showing the password reset form
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
    const redirectUrl = `${window.location.origin}/dashboard`;
    
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
      
      setSession(null);
      setUser(null);
      
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.error('Error signing out from Supabase:', error);
      }
      
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-icicfihvflooltswigjb-auth-token');
      sessionStorage.clear();
      
      console.log('Successfully cleared all authentication data');
      
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      setSession(null);
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/auth';
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
