
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Crown, Check, Zap, Star, TrendingUp, Calendar, Mail, AlertTriangle, Target, Activity, BarChart3, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { PRO_FEATURES } from "@/config/subscriptionFeatures";

const SubscriptionManager = () => {
  const [loading, setLoading] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const { toast } = useToast();
  const { subscriptionInfo, checkSubscriptionStatus, isInTrial, isCancelledButActive, getTrialDaysRemaining } = useSubscription();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to subscribe to Gym Tuner Pro.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: 'price_1QVgTzJNcmPzuSeUcwkXJrVr',
          userId: user.id 
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast({
          title: "Subscription Error",
          description: error.message || "Failed to create checkout session. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Subscription Error",
          description: "Failed to create checkout session. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to manage your subscription.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Portal error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to open customer portal. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to open customer portal. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to cancel your subscription.",
          variant: "destructive",
        });
        setCancellingSubscription(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { userId: user.id }
      });

      if (error) {
        console.error('Cancel error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
        setCancellingSubscription(false);
        return;
      }

      if (data?.success) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled. You'll continue to have access until the end of your current billing period.",
        });
        setShowCancelDialog(false);
        // Refresh subscription status
        setTimeout(() => {
          checkSubscriptionStatus();
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancellingSubscription(false);
    }
  };

  const proFeatures = PRO_FEATURES.map((feature, index) => {
    const icons = [Activity, TrendingUp, Target, Crown, BarChart3, Star, Zap];
    return {
      icon: icons[index] || Activity,
      text: feature
    };
  });

  const trialDaysRemaining = getTrialDaysRemaining();
  const inTrial = isInTrial();
  const cancelledButActive = isCancelledButActive();

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card className={subscriptionInfo?.subscribed ? 
        cancelledButActive ? "border-orange-200 bg-gradient-to-r from-orange-50 to-red-50" : 
        "border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${subscriptionInfo?.subscribed ? 
                cancelledButActive ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-100'}`}>
                <Crown className={`h-5 w-5 ${subscriptionInfo?.subscribed ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {subscriptionInfo?.subscribed ? 'Gym Tuner Pro' : 'Gym Tuner Free'}
                </CardTitle>
                <CardDescription>
                  {subscriptionInfo?.subscribed 
                    ? cancelledButActive
                      ? 'Your subscription is cancelled but remains active until the end of your billing period'
                      : inTrial 
                        ? `${trialDaysRemaining} days left in your free trial`
                        : 'You have full access to all premium features'
                    : 'Start your 30-day free trial to unlock all features'
                  }
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {inTrial && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Trial
                </Badge>
              )}
              {cancelledButActive && (
                <Badge variant="destructive" className="bg-red-100 text-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Cancelled
                </Badge>
              )}
              <Badge variant={subscriptionInfo?.subscribed ? "default" : "secondary"} className={subscriptionInfo?.subscribed && !inTrial && !cancelledButActive ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white" : ""}>
                {subscriptionInfo?.subscribed ? 
                  (cancelledButActive ? 'Cancelled' : inTrial ? 'Trial' : 'Pro') : 'Free'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptionInfo?.subscribed ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className={`font-medium ${cancelledButActive ? 'text-red-600' : 'text-green-600'}`}>
                    {cancelledButActive ? 'Cancelled (Active until period end)' :
                     inTrial ? `Trial (${trialDaysRemaining} days left)` : 'Active'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Plan</p>
                  <p className="font-medium">
                    {inTrial ? '30-Day Free Trial' : 'Monthly Pro ($9.99/month)'}
                  </p>
                </div>
                {subscriptionInfo.subscription_end && (
                  <div className="sm:col-span-2">
                    <p className="text-gray-600">
                      {cancelledButActive ? 'Access ends on' :
                       inTrial ? 'Trial ends / First billing date' : 'Next billing date'}
                    </p>
                    <p className="font-medium">{new Date(subscriptionInfo.subscription_end).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleManageSubscription}
                  disabled={loading}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  {loading ? "Loading..." : "Manage Subscription"}
                </Button>
                {!cancelledButActive && (
                  <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Cancel Subscription
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <span>Cancel Subscription</span>
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel your Gym Tuner Pro subscription? 
                          You'll continue to have access to all features until the end of your current {inTrial ? 'trial' : 'billing'} period.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCancelDialog(false)}
                          disabled={cancellingSubscription}
                        >
                          Keep Subscription
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleCancelSubscription}
                          disabled={cancellingSubscription}
                        >
                          {cancellingSubscription ? "Cancelling..." : "Cancel Subscription"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Start your 30-day free trial today. No payment required upfront - we'll only charge after your trial ends.
              </p>
              <Button 
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
              >
                <Crown className="h-4 w-4 mr-2" />
                {loading ? "Processing..." : "Start Free Trial"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pro Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span>Pro Features</span>
          </CardTitle>
          <CardDescription>
            Everything you need to achieve your fitness goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                  <Check className="h-4 w-4 text-green-500 ml-auto" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      {!subscriptionInfo?.subscribed && (
        <Card className="border-2 border-gradient-to-r from-yellow-400 to-orange-500">
          <CardHeader className="text-center">
            <div className="mx-auto bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full w-fit">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Gym Tuner Pro</CardTitle>
            <CardDescription>
              Start with a 30-day free trial
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div>
              <div className="text-lg font-semibold text-green-600 mb-2">30 Days Free</div>
              <div className="text-sm text-gray-600 mb-4">Then $9.99/month</div>
            </div>
            <Button 
              onClick={handleSubscribe}
              disabled={loading}
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
            >
              <Crown className="h-5 w-5 mr-2" />
              {loading ? "Processing..." : "Start Free Trial"}
            </Button>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                No payment required today. Cancel anytime during trial.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>
            Get in touch with our support team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Contact Support</p>
              <p className="text-sm text-gray-600">contact@gymtuner.app</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
