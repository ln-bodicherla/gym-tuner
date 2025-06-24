
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

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { subscriptionInfo, checkSubscriptionStatus } = useSubscription();

  // Check for subscription success/cancellation in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const subscription = urlParams.get('subscription');
    
    if (subscription === 'success') {
      toast({
        title: "Welcome to Gym Tuner Pro!",
        description: "Your subscription is now active. Enjoy unlimited AI workouts!",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh subscription status
      setTimeout(() => {
        checkSubscriptionStatus();
      }, 2000);
    } else if (subscription === 'cancelled') {
      toast({
        title: "Subscription Cancelled",
        description: "No worries! You can subscribe anytime.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, checkSubscriptionStatus]);

  // Listen for upgrade button clicks from child components
  useEffect(() => {
    const handleUpgradeClick = (event: CustomEvent) => {
      setActiveTab("subscription");
    };

    window.addEventListener('upgrade-to-pro' as any, handleUpgradeClick);
    return () => {
      window.removeEventListener('upgrade-to-pro' as any, handleUpgradeClick);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out successfully",
      description: "See you next time!",
    });
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.email || 'User';
  };

  const tabItems = [
    { value: "dashboard", label: "Dashboard", icon: TrendingUp },
    { value: "profile", label: "Profile", icon: User },
    { value: "injuries", label: "Injuries", icon: AlertTriangle },
    { value: "goals", label: "Goals", icon: Target },
    { value: "workouts", label: "Workouts", icon: Heart },
    { value: "subscription", label: "Subscription", icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile-First Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/5e825f2e-98c7-4e9c-87a9-1b104539f992.png" 
                alt="Gym Tuner Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Gym Tuner</h1>
                  {subscriptionInfo?.subscribed && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Welcome back, {getUserDisplayName()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Sign Out Button */}
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="px-3 py-2"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
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
                return (
                  <TabsTrigger 
                    key={item.value}
                    value={item.value} 
                    className="flex items-center space-x-2 px-4 py-3 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-md"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {/* Quick Stats - Now using the dedicated component */}
            <QuickStats />

            {/* Recent Activity and Insights */}
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

      {/* Mobile Bottom Navigation - Only visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around py-2">
          {tabItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`flex flex-col items-center justify-center py-2 px-3 transition-colors duration-200 ${
                  isActive 
                    ? 'text-blue-600' 
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : ''}`} />
                  {item.value === 'subscription' && subscriptionInfo?.subscribed && (
                    <Crown className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;
