
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
        try {
          // Try to query without the new columns first
          const { data: basicData, error: basicError } = await supabase
            .from('subscribers')
            .select('subscribed, subscription_tier, subscription_end, trial_end')
            .eq('user_id', user.id)
            .single();
          
          if (basicError) {
            console.error('Local database query error:', basicError);
            setSubscriptionInfo({ subscribed: false, trial_used: false });
          } else if (basicData) {
            // Try to get the new columns separately - handle potential errors gracefully
            const { data: extendedData, error: extendedError } = await supabase
              .from('subscribers')
              .select('trial_used, cancelled_but_active')
              .eq('user_id', user.id)
              .single();
            
            // Create a safe default object for extended data
            const safeExtendedData = {
              trial_used: false,
              cancelled_but_active: false
            };
            
            // Check if extendedData exists, is not null, doesn't have an error, and has the expected properties
            let finalExtendedData = safeExtendedData;
            if (!extendedError && extendedData && extendedData !== null && typeof extendedData === 'object' && 'trial_used' in extendedData) {
              finalExtendedData = {
                trial_used: extendedData.trial_used || false,
                cancelled_but_active: extendedData.cancelled_but_active || false
              };
            }
            
            setSubscriptionInfo({
              subscribed: basicData.subscribed || false,
              subscription_tier: basicData.subscription_tier || undefined,
              subscription_end: basicData.subscription_end || undefined,
              trial_end: basicData.trial_end || undefined,
              trial_used: finalExtendedData.trial_used,
              cancelled_but_active: finalExtendedData.cancelled_but_active,
            });
          } else {
            setSubscriptionInfo({ subscribed: false, trial_used: false });
          }
        } catch (dbError) {
          console.error('Database fallback error:', dbError);
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
