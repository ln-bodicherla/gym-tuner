
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  trial_end?: string;
  cancelled_but_active?: boolean;
  trial_used?: boolean;
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
        setSubscriptionInfo({ subscribed: false, trial_used: false });
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
        setSubscriptionInfo({ subscribed: false, trial_used: false });
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
          .select('subscribed, subscription_tier, subscription_end, trial_end, trial_used, cancelled_but_active')
          .eq('user_id', user.id)
          .single();
        
        if (localData) {
          setSubscriptionInfo(localData);
        } else {
          setSubscriptionInfo({ subscribed: false, trial_used: false });
        }
        return;
      }
      
      console.log('Subscription check response:', data);
      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionInfo({ subscribed: false, trial_used: false });
    } finally {
      setLoading(false);
      setInitialCheckComplete(true);
    }
  };

  const hasAccess = () => {
    return subscriptionInfo?.subscribed || false;
  };

  const isInTrial = () => {
    if (!subscriptionInfo?.trial_end) return false;
    return new Date(subscriptionInfo.trial_end) > new Date();
  };

  const isCancelledButActive = () => {
    return subscriptionInfo?.cancelled_but_active || false;
  };

  const hasUsedTrial = () => {
    return subscriptionInfo?.trial_used || false;
  };

  const getTrialDaysRemaining = () => {
    if (!subscriptionInfo?.trial_end) return 0;
    const trialEndDate = new Date(subscriptionInfo.trial_end);
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return {
    subscriptionInfo,
    loading,
    initialCheckComplete,
    checkSubscriptionStatus,
    hasAccess,
    isInTrial,
    isCancelledButActive,
    hasUsedTrial,
    getTrialDaysRemaining,
  };
};
