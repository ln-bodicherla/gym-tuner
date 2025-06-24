
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Target, Clock, AlertTriangle, Plus, TrendingUp, Menu } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import InjuryTracker from "@/components/InjuryTracker";
import GoalManager from "@/components/GoalManager";
import WorkoutPlan from "@/components/WorkoutPlan";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  // Mock data for demonstration
  const userStats = {
    weeklyGoal: 4,
    completedWorkouts: 2,
    activeInjuries: 1,
    currentStreak: 5
  };

  const handleGeneratePlan = () => {
    toast({
      title: "Workout Plan Generated!",
      description: "A personalized plan has been created based on your profile and current status.",
    });
  };

  const tabItems = [
    { value: "dashboard", label: "Dashboard", icon: TrendingUp },
    { value: "profile", label: "Profile", icon: Target },
    { value: "injuries", label: "Injuries", icon: AlertTriangle },
    { value: "goals", label: "Goals", icon: Target },
    { value: "workouts", label: "Workouts", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile-First Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-2 rounded-lg">
                <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Gym Tuner</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Smart Workout Planning</p>
              </div>
            </div>
            
            {/* Mobile Generate Plan Button */}
            <Button 
              onClick={handleGeneratePlan} 
              className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 px-3 py-2 sm:px-4 sm:py-2"
              size="sm"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Generate Plan</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-8 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {/* Mobile-Optimized Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm p-1 overflow-x-auto">
            <TabsList className="grid grid-cols-5 w-full bg-transparent gap-1">
              {tabItems.map((item) => {
                const Icon = item.icon;
                return (
                  <TabsTrigger 
                    key={item.value}
                    value={item.value} 
                    className="flex flex-col items-center space-y-1 px-2 py-3 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-md min-w-0"
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate w-full text-center">{item.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-4 sm:space-y-6">
            {/* Mobile-Optimized Quick Stats */}
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

            {/* Mobile-Optimized Recent Activity */}
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                <CardDescription>Your latest workouts and achievements</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="bg-green-500 p-2 rounded-full flex-shrink-0">
                        <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">Upper Body Strength</p>
                        <p className="text-xs sm:text-sm text-gray-600">Completed • 45 minutes</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">Yesterday</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="bg-blue-500 p-2 rounded-full flex-shrink-0">
                        <Target className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">Goal Updated</p>
                        <p className="text-xs sm:text-sm text-gray-600">Weight Loss: 10 lbs in 3 months</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0 ml-2">2 days ago</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
};

export default Index;
