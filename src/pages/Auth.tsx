
import { useEffect, useState } from 'react';
import AuthForm from '@/components/AuthForm';
import PasswordReset from '@/components/PasswordReset';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    // Check URL parameters for password reset
    const urlParams = new URLSearchParams(window.location.search);
    const isPasswordReset = urlParams.get('reset') === 'true';
    
    if (isPasswordReset) {
      // Check if we have a valid session for password reset
      const checkResetSession = async () => {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Password reset check:', { session: !!session, error });
        
        // If we have a session and the reset parameter, show password reset form
        if (session && !error) {
          setShowPasswordReset(true);
        }
      };

      checkResetSession();
    }

    // Listen for auth state changes to handle password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event in Auth page:', event, !!session);
      
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && isPasswordReset)) {
        setShowPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (showPasswordReset) {
    return <PasswordReset />;
  }

  return <AuthForm />;
};

export default Auth;
