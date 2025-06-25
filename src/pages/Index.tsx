
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, LogOut, User, Heart, Target, AlertTriangle, Crown } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import InjuryTracker from "@/components/InjuryTracker";
import GoalManager from "@/components/GoalManager";
import WorkoutPlan from "@/components/WorkoutPlan";
import RecentActivity from "@/components/RecentActivity";
import Insights from "@/components/Insights";
import QuickStats from "@/components/QuickStats";
import SubscriptionManager from "@/components/SubscriptionManager";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const { signOut, user, loading: authLoading, session } = useAuth();
  const { subscriptionInfo, checkSubscriptionStatus, loading: subscriptionLoading, initialCheckComplete, hasAccess } = useSubscription();
  const { profile, loading: profileLoading } = useUserProfile();
  const { lastUpdate } = useRealtimeDashboard(); // Add real-time updates

  // Redirect if not authenticated - double protection
  if (!authLoading && (!user || !session)) {
    console.log('Dashboard access denied - redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  // Check for subscription success/cancellation in URL params
  useEffect(() => {
    if (!initialCheckComplete || !user || authLoading) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const subscription = urlParams.get('subscription');
    
    if (subscription === 'success') {
      toast({
        title: "Welcome to Gym Tuner Pro!",
        description: "Your subscription is now active. Checking status...",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh subscription status with a delay to allow Stripe to process
      setTimeout(() => {
        checkSubscriptionStatus();
      }, 3000);
      // Check again after 10 seconds if still not updated
      setTimeout(() => {
        checkSubscriptionStatus();
      }, 10000);
    } else if (subscription === 'cancelled') {
      toast({
        title: "Subscription Cancelled",
        description: "No worries! You can subscribe anytime.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, checkSubscriptionStatus, initialCheckComplete, user, authLoading]);

  // Listen for upgrade button clicks from child components
  useEffect(() => {
    const handleUpgradeClick = (event: CustomEvent) => {
      setActiveTab("subscription");
    };

    const handleSwitchToProfile = (event: CustomEvent) => {
      setActiveTab("profile");
    };

    window.addEventListener('upgrade-to-pro' as any, handleUpgradeClick);
    window.addEventListener('switch-to-profile' as any, handleSwitchToProfile);
    
    return () => {
      window.removeEventListener('upgrade-to-pro' as any, handleUpgradeClick);
      window.removeEventListener('switch-to-profile' as any, handleSwitchToProfile);
    };
  }, []);

  // Log real-time updates
  useEffect(() => {
    if (lastUpdate) {
      console.log('Dashboard detected real-time update:', new Date(lastUpdate));
    }
  }, [lastUpdate]);

  const handleUpgrade = async () => {
    setActiveTab("subscription");
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: 'price_1QVgTzJNcmPzuSeUcwkXJrVr',
          userId: user?.id 
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast({
          title: "Subscription Error",
          description: error.message || "Failed to create checkout session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('User clicked sign out');
      toast({
        title: "Signing out...",
        description: "Redirecting you to the landing page.",
      });
      await signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = () => {
    // Use database profile name first, then fallback to user metadata, then email
    if (profile?.full_name) {
      return profile.full_name;
    }
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  const tabItems = [
    { value: "dashboard", label: "Dashboard", icon: TrendingUp },
    { value: "profile", label: "Profile", icon: User },
    { value: "injuries", label: "Injuries", icon: AlertTriangle },
    { value: "goals", label: "Goals", icon: Target },
    { value: "workouts", label: "Workouts", icon: Heart },
    { value: "subscription", label: "Pro", icon: Crown },
  ];

  // Show loading state while checking authentication or loading profile
  if (authLoading || !user || !session || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile-First Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img 
                src="/lovable-uploads/5e825f2e-98c7-4e9c-87a9-1b104539f992.png" 
                alt="Gym Tuner Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Gym Tuner</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block truncate">
                  Welcome back, {getUserDisplayName()}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-8 max-w-7xl mx-auto pb-20 md:pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Desktop Tab Navigation - Hidden on mobile */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm p-1">
            <TabsList className="grid grid-cols-6 w-full bg-transparent gap-1">
              {tabItems.map((item) => {
                const Icon = item.icon;
                const isSubscriptionTab = item.value === "subscription";
                return (
                  <TabsTrigger 
                    key={item.value}
                    value={item.value} 
                    className="flex items-center justify-center space-x-2 px-3 py-3 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-md transition-all duration-200"
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4" />
                      {isSubscriptionTab && subscriptionInfo?.subscribed && (
                        <Crown className="h-3 w-3 text-yellow-400 absolute -top-1 -right-1" />
                      )}
                    </div>
                    <span className="hidden lg:inline">{item.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            <QuickStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <RecentActivity />
              <Insights />
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <UserProfile />
          </TabsContent>

          <TabsContent value="injuries">
            <InjuryTracker />
          </TabsContent>

          <TabsContent value="goals">
            <GoalManager />
          </TabsContent>

          <TabsContent value="workouts">
            <WorkoutPlan />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Bottom Navigation - Fixed single row layout */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around py-2">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            const isSubscriptionTab = item.value === "subscription";
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`flex flex-col items-center justify-center px-3 py-2 min-w-0 flex-1 transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <div className="relative mb-1">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : ''}`} />
                  {isSubscriptionTab && subscriptionInfo?.subscribed && (
                    <Crown className="h-2 w-2 text-yellow-500 absolute -top-0.5 -right-0.5" />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
