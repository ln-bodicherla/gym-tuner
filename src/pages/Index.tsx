
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Target, Clock, AlertTriangle, Plus, TrendingUp } from "lucide-react";
import UserProfile from "@/components/UserProfile";
import InjuryTracker from "@/components/InjuryTracker";
import GoalManager from "@/components/GoalManager";
import WorkoutPlan from "@/components/WorkoutPlan";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 p-2 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gym Tuner</h1>
                <p className="text-sm text-gray-600">Smart Workout Planning</p>
              </div>
            </div>
            <Button onClick={handleGeneratePlan} className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Generate Plan
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="injuries" className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Injuries</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Goals</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Workouts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
                  <Activity className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.completedWorkouts}/{userStats.weeklyGoal}</div>
                  <Progress value={(userStats.completedWorkouts / userStats.weeklyGoal) * 100} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <Target className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.currentStreak} days</div>
                  <p className="text-xs opacity-90">Keep it up!</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Status</CardTitle>
                  <Clock className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Ready</div>
                  <p className="text-xs opacity-90">No restrictions</p>
                </CardContent>
              </Card>

              <Card className={`${userStats.activeInjuries > 0 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Injuries</CardTitle>
                  <AlertTriangle className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.activeInjuries}</div>
                  <p className="text-xs opacity-90">{userStats.activeInjuries > 0 ? 'Plan adjusted' : 'All clear'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest workouts and achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-500 p-2 rounded-full">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Upper Body Strength</p>
                        <p className="text-sm text-gray-600">Completed • 45 minutes</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Yesterday</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 p-2 rounded-full">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Goal Updated</p>
                        <p className="text-sm text-gray-600">Weight Loss: 10 lbs in 3 months</p>
                      </div>
                    </div>
                    <Badge variant="secondary">2 days ago</Badge>
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
