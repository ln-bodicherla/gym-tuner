
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Check, Loader2, CreditCard } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionCard from "./SubscriptionCard";

const SubscriptionManager = () => {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscriptionInfo, loading, hasAccess, checkSubscriptionStatus, isTrialActive } = useSubscription();

  const handleSubscribe = async () => {
    if (!user) return;

    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const getTrialDaysLeft = () => {
    if (!subscriptionInfo?.trial_end) return 0;
    const trialEnd = new Date(subscriptionInfo.trial_end);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600">Manage your Gym Tuner Pro subscription</p>
      </div>

      {/* Current Subscription Status */}
      {subscriptionInfo?.subscribed ? (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-green-600" />
              <h3 className="text-xl font-bold text-green-800">Premium Active</h3>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              {subscriptionInfo.subscription_tier || "Premium"}
            </Badge>
          </div>
          <p className="text-green-700 mb-4">
            You have access to all premium features including unlimited AI-generated workouts and insights!
          </p>
          {subscriptionInfo.subscription_end && (
            <p className="text-sm text-green-600 mb-4">
              Subscription renews on: {new Date(subscriptionInfo.subscription_end).toLocaleDateString()}
            </p>
          )}
          <Button 
            onClick={handleManageSubscription}
            disabled={portalLoading}
            variant="outline"
            className="w-full"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4 mr-2" />
            )}
            Manage Subscription
          </Button>
        </div>
      ) : isTrialActive() ? (
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-orange-600" />
              <h3 className="text-xl font-bold text-orange-800">Free Trial Active</h3>
            </div>
            <Badge className="bg-orange-100 text-orange-800 border-orange-200">
              Trial
            </Badge>
          </div>
          <p className="text-orange-700 mb-2">
            You're on a free trial! {getTrialDaysLeft()} days remaining.
          </p>
          <p className="text-sm text-orange-600 mb-4">
            Upgrade now to continue enjoying premium features after your trial ends.
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <h3 className="text-xl font-bold text-gray-800">Free Plan</h3>
          </div>
          <p className="text-gray-700">
            Upgrade to Premium to unlock unlimited AI-generated workouts and advanced features.
          </p>
        </div>
      )}

      {/* Subscription Card */}
      {!subscriptionInfo?.subscribed && (
        <SubscriptionCard 
          hasAccess={hasAccess()} 
          onUpgrade={handleSubscribe}
        />
      )}

      <div className="text-center">
        <Button 
          onClick={checkSubscriptionStatus}
          variant="outline"
          size="sm"
        >
          Refresh Status
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionManager;
