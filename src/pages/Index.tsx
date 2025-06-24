import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Target, Clock, AlertTriangle, Plus, TrendingUp, LogOut, User, Heart } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import InjuryTracker from "@/components/InjuryTracker";
import GoalManager from "@/components/GoalManager";
import WorkoutPlan from "@/components/WorkoutPlan";
import RecentActivity from "@/components/RecentActivity";
import Insights from "@/components/Insights";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useActivity } from "@/contexts/ActivityContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { toast } = useToast();
  const { signOut, user } = useAuth();
  const { logActivity } = useActivity();

  // Mock data for demonstration
  const userStats = {
    weeklyGoal: 4,
    completedWorkouts: 2,
    activeInjuries: 1,
    currentStreak: 5
  };

  const handleGeneratePlan = async () => {
    await logActivity(
      'plan_generated',
      'New workout plan generated',
      { generated_from: 'dashboard' }
    );
    
    toast({
      title: "Workout Plan Generated!",
      description: "A personalized plan has been created based on your profile and current status.",
    });
  };

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
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile-First Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-2 rounded-lg">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Gym Tuner</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Welcome back, {getUserDisplayName()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Mobile Generate Plan Button */}
              <Button 
                onClick={handleGeneratePlan} 
                className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 px-3 py-2 sm:px-4 sm:py-2"
                size="sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Generate Plan</span>
              </Button>
              
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
            <TabsList className="grid grid-cols-5 w-full bg-transparent gap-1">
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
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium">Weekly Progress</CardTitle>
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-lg sm:text-2xl font-bold">{userStats.completedWorkouts}/{userStats.weeklyGoal}</div>
                  <Progress value={(userStats.completedWorkouts / userStats.weeklyGoal) * 100} className="mt-2 h-1 sm:h-2" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium">Current Streak</CardTitle>
                  <Target className="h-3 w-3 sm:h-4 sm:w-4" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-lg sm:text-2xl font-bold">{userStats.currentStreak} days</div>
                  <p className="text-xs opacity-90">Keep it up!</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium">Active Status</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-lg sm:text-2xl font-bold">Ready</div>
                  <p className="text-xs opacity-90">No restrictions</p>
                </CardContent>
              </Card>

              <Card className={`${userStats.activeInjuries > 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium">Injuries</CardTitle>
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-lg sm:text-2xl font-bold">{userStats.activeInjuries}</div>
                  <p className="text-xs opacity-90">{userStats.activeInjuries > 0 ? 'Plan adjusted' : 'All clear'}</p>
                </CardContent>
              </Card>
            </div>

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
                <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : ''}`} />
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
