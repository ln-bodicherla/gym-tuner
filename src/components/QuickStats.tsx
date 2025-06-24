
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Activity, AlertTriangle, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface QuickStatsProps {
  className?: string;
}

const QuickStats = ({ className }: QuickStatsProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    weeklyGoal: 4,
    completedWorkouts: 0,
    activeInjuries: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      // Get workouts from this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weeklyWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user?.id)
        .gte('workout_date', startOfWeek.toISOString().split('T')[0]);

      // Get active injuries
      const { data: injuries } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['active', 'recovering']);

      // Get recent workouts for streak calculation
      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select('workout_date')
        .eq('user_id', user?.id)
        .order('workout_date', { ascending: false })
        .limit(30);

      // Calculate streak
      let streak = 0;
      if (recentWorkouts && recentWorkouts.length > 0) {
        const today = new Date();
        let currentDate = new Date(today);
        
        for (let i = 0; i < 30; i++) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const hasWorkout = recentWorkouts.some(w => w.workout_date === dateStr);
          
          if (hasWorkout) {
            streak++;
          } else if (streak > 0) {
            break;
          }
          
          currentDate.setDate(currentDate.getDate() - 1);
        }
      }

      setStats({
        weeklyGoal: 4, // This could be fetched from user profile
        completedWorkouts: weeklyWorkouts?.length || 0,
        activeInjuries: injuries?.length || 0,
        currentStreak: streak
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-16 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 ${className}`}>
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-600">Weekly Goal</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-900">{stats.completedWorkouts}/{stats.weeklyGoal}</p>
            </div>
            <div className="bg-blue-500 p-2 sm:p-3 rounded-full">
              <Target className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
          <Progress value={(stats.completedWorkouts / stats.weeklyGoal) * 100} className="mt-2 sm:mt-3" />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-600">Current Streak</p>
              <p className="text-lg sm:text-2xl font-bold text-green-900">{stats.currentStreak} days</p>
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
              <p className="text-lg sm:text-2xl font-bold text-orange-900">{stats.activeInjuries}</p>
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
              <p className="text-lg sm:text-2xl font-bold text-purple-900">{stats.completedWorkouts}</p>
            </div>
            <div className="bg-purple-500 p-2 sm:p-3 rounded-full">
              <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;
