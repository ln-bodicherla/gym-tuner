
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Target, Clock, AlertTriangle, TrendingUp, LogOut, User, Heart } from "lucide-react";
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
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt="Gym Tuner Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Gym Tuner</h1>
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
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-600">Weekly Goal</p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-900">{userStats.completedWorkouts}/{userStats.weeklyGoal}</p>
                    </div>
                    <div className="bg-blue-500 p-2 sm:p-3 rounded-full">
                      <Target className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <Progress value={(userStats.completedWorkouts / userStats.weeklyGoal) * 100} className="mt-2 sm:mt-3" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-600">Current Streak</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-900">{userStats.currentStreak} days</p>
                    </div>
                    <div className="bg-green-500 p-2 sm:p-3 rounded-full">
                      <Activity className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-orange-600">Active Injuries</p>
                      <p className="text-lg sm:text-2xl font-bold text-orange-900">{userStats.activeInjuries}</p>
                    </div>
                    <div className="bg-orange-500 p-2 sm:p-3 rounded-full">
                      <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600">This Week</p>
                      <p className="text-lg sm:text-2xl font-bold text-purple-900">{userStats.completedWorkouts}</p>
                    </div>
                    <div className="bg-purple-500 p-2 sm:p-3 rounded-full">
                      <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
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
