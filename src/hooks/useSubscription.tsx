
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export const useSubscription = () => {
  const { user, loading: authLoading } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      // Wait for auth to complete
      if (authLoading) return;
      
      if (user) {
        await checkSubscriptionStatus();
      } else {
        setLoading(false);
        setInitialCheckComplete(true);
        setSubscriptionInfo({ subscribed: false });
      }
    };

    checkSubscription();
  }, [user, authLoading]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Checking subscription status for user:', user.email);
      
      // Get fresh session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('No active session found');
        setSubscriptionInfo({ subscribed: false });
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        // Fallback to checking local database
        const { data: localData } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_tier, subscription_end')
          .eq('user_id', user.id)
          .single();
        
        if (localData) {
          setSubscriptionInfo(localData);
        } else {
          setSubscriptionInfo({ subscribed: false });
        }
        return;
      }
      
      console.log('Subscription check response:', data);
      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionInfo({ subscribed: false });
    } finally {
      setLoading(false);
      setInitialCheckComplete(true);
    }
  };

  const hasAccess = () => {
    return subscriptionInfo?.subscribed || false;
  };

  return {
    subscriptionInfo,
    loading,
    initialCheckComplete,
    checkSubscriptionStatus,
    hasAccess,
  };
};
