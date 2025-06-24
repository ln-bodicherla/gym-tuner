
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  trial_end?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionInfo({ subscribed: false });
    } finally {
      setLoading(false);
    }
  };

  const isTrialActive = () => {
    if (!subscriptionInfo?.trial_end) return false;
    return new Date(subscriptionInfo.trial_end) > new Date();
  };

  const hasAccess = () => {
    return subscriptionInfo?.subscribed || isTrialActive();
  };

  return {
    subscriptionInfo,
    loading,
    checkSubscriptionStatus,
    isTrialActive,
    hasAccess,
  };
};
