
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
    
    // Also check if we have a session (user clicked reset link)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If we have reset=true in URL and a session, show password reset form
      if (isPasswordReset && session) {
        setShowPasswordReset(true);
      }
    };

    checkSession();
  }, []);

  if (showPasswordReset) {
    return <PasswordReset />;
  }

  return <AuthForm />;
};

export default Auth;
