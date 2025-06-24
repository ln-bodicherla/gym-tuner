
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Check, Loader2, CreditCard } from "lucide-react";

interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  trial_end?: string;
}

const SubscriptionManager = () => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
      // Auto-refresh every 10 seconds
      const interval = setInterval(checkSubscriptionStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      setSubscriptionInfo(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const isTrialActive = () => {
    if (!subscriptionInfo?.trial_end) return false;
    return new Date(subscriptionInfo.trial_end) > new Date();
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
      <Card className={subscriptionInfo?.subscribed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className={`h-5 w-5 ${subscriptionInfo?.subscribed ? "text-green-600" : "text-orange-600"}`} />
              <CardTitle className={subscriptionInfo?.subscribed ? "text-green-800" : "text-orange-800"}>
                {subscriptionInfo?.subscribed ? "Premium Active" : "Free Plan"}
              </CardTitle>
            </div>
            <Badge variant={subscriptionInfo?.subscribed ? "default" : "secondary"}>
              {subscriptionInfo?.subscribed ? subscriptionInfo.subscription_tier || "Premium" : "Free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriptionInfo?.subscribed ? (
              <>
                <p className="text-green-700">
                  You have access to all premium features including unlimited AI-generated workouts!
                </p>
                {subscriptionInfo.subscription_end && (
                  <p className="text-sm text-green-600">
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
              </>
            ) : isTrialActive() ? (
              <>
                <p className="text-orange-700">
                  You're on a free trial! {getTrialDaysLeft()} days remaining.
                </p>
                <p className="text-sm text-orange-600">
                  Upgrade now to continue enjoying premium features after your trial ends.
                </p>
              </>
            ) : (
              <p className="text-orange-700">
                Upgrade to Premium to unlock unlimited AI-generated workouts and advanced features.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Plan */}
      {!subscriptionInfo?.subscribed && (
        <Card className="border-blue-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Gym Tuner Pro</CardTitle>
            <CardDescription>
              Unlimited AI-powered workouts and premium features
            </CardDescription>
            <div className="text-center space-y-1">
              <div className="text-4xl font-bold text-gray-900">$9.99</div>
              <div className="text-gray-600">/month</div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                7-day free trial
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span>Unlimited AI-generated workout plans</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span>Advanced workout tracking and analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span>Personalized injury management</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span>Priority customer support</span>
              </div>
              <div className="flex items-center space-x-3">
                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span>Export your fitness data</span>
              </div>
            </div>
            
            <Button 
              onClick={handleSubscribe}
              disabled={checkoutLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {checkoutLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              Start Free Trial
            </Button>
            
            <p className="text-xs text-gray-500 text-center">
              Cancel anytime. No commitment required.
            </p>
          </CardContent>
        </Card>
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
