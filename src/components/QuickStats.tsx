
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Activity, AlertTriangle, Heart, Clock, User, Weight, Ruler } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";

interface QuickStatsProps {
  className?: string;
}

const QuickStats = ({ className }: QuickStatsProps) => {
  const { user } = useAuth();
  const { lastUpdate } = useRealtimeDashboard();
  const [stats, setStats] = useState({
    weeklyGoal: 4,
    completedWorkouts: 0,
    activeInjuries: 0,
    currentStreak: 0,
    achievedGoalsCount: 0
  });
  const [profile, setProfile] = useState({
    max_workout_time: null,
    min_workout_time: null,
    age: null,
    weight: null,
    height: null,
    fitness_level: null,
    weekly_goal: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
      loadProfile();
    }
  }, [user, lastUpdate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      console.log('Loading profile for user:', user.id);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('max_workout_time, min_workout_time, age, weight, height, fitness_level, weekly_goal')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profileData) {
        console.log('Profile loaded successfully:', profileData);
        setProfile(profileData);
      } else {
        console.log('No profile found for user');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const calculateConsecutiveWorkoutStreak = (workouts: any[]) => {
    if (!workouts || workouts.length === 0) return 0;

    // Sort workouts by date in descending order (most recent first)
    const sortedWorkouts = workouts.sort((a, b) => 
      new Date(b.workout_date).getTime() - new Date(a.workout_date).getTime()
    );

    // Get unique workout dates
    const uniqueDates = [...new Set(sortedWorkouts.map(w => w.workout_date))];
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's a workout today or yesterday to start counting
    const mostRecentDate = new Date(uniqueDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If the most recent workout is more than 1 day ago, streak is broken
    if (daysDifference > 1) {
      console.log('Streak broken - most recent workout was', daysDifference, 'days ago');
      return 0;
    }

    // Start from the most recent workout date and count backwards
    let currentDate = new Date(mostRecentDate);
    
    for (const dateStr of uniqueDates) {
      const workoutDate = new Date(dateStr);
      workoutDate.setHours(0, 0, 0, 0);
      
      if (workoutDate.getTime() === currentDate.getTime()) {
        streak++;
        // Move to the previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Gap found, streak ends
        break;
      }
    }

    console.log('Calculated consecutive workout streak:', streak, 'days');
    return streak;
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      console.log('Loading stats for user:', user.id);
      
      // Get workouts from this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: weeklyWorkouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('workout_date', startOfWeek.toISOString().split('T')[0]);

      if (workoutsError) {
        console.error('Error loading workouts:', workoutsError);
      } else {
        console.log('Weekly workouts loaded:', weeklyWorkouts?.length || 0);
      }

      // Get all workouts for streak calculation (last 60 days to be thorough)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { data: allWorkouts, error: allWorkoutsError } = await supabase
        .from('workouts')
        .select('workout_date')
        .eq('user_id', user.id)
        .gte('workout_date', sixtyDaysAgo.toISOString().split('T')[0])
        .order('workout_date', { ascending: false });

      if (allWorkoutsError) {
        console.error('Error loading all workouts for streak:', allWorkoutsError);
      } else {
        console.log('All workouts loaded for streak calculation:', allWorkouts?.length || 0);
      }

      // Get active injuries
      const { data: injuries, error: injuriesError } = await supabase
        .from('injuries')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'recovering']);

      if (injuriesError) {
        console.error('Error loading injuries:', injuriesError);
      } else {
        console.log('Active injuries loaded:', injuries?.length || 0);
      }

      // Get achieved goals count
      const { data: achievedGoals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'achieved');

      if (goalsError) {
        console.error('Error loading achieved goals:', goalsError);
      } else {
        console.log('Achieved goals loaded:', achievedGoals?.length || 0);
      }

      // Calculate streak from consecutive workout days
      const streak = calculateConsecutiveWorkoutStreak(allWorkouts || []);

      // Calculate dynamic weekly goal based on achieved goals
      const baseWeeklyGoal = profile?.weekly_goal || 4;
      const achievedGoalsCount = achievedGoals?.length || 0;
      const dynamicWeeklyGoal = Math.max(baseWeeklyGoal + Math.floor(achievedGoalsCount / 2), baseWeeklyGoal);

      console.log('Stats calculated:', {
        weeklyWorkouts: weeklyWorkouts?.length || 0,
        activeInjuries: injuries?.length || 0,
        streak,
        achievedGoalsCount,
        dynamicWeeklyGoal
      });

      setStats({
        weeklyGoal: dynamicWeeklyGoal,
        completedWorkouts: weeklyWorkouts?.length || 0,
        activeInjuries: injuries?.length || 0,
        currentStreak: streak,
        achievedGoalsCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debug: Log when component re-renders due to real-time updates
  useEffect(() => {
    console.log('QuickStats updated due to real-time changes:', new Date(lastUpdate));
  }, [lastUpdate]);

  if (loading) {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 ${className}`}>
        {[...Array(8)].map((_, i) => (
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
              {stats.achievedGoalsCount > 0 && (
                <p className="text-xs text-blue-500">+{Math.floor(stats.achievedGoalsCount / 2)} from goals</p>
              )}
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
              <p className="text-xs text-green-500">Consecutive workout days</p>
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

      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-indigo-600">Max Gym Time</p>
              <p className="text-lg sm:text-2xl font-bold text-indigo-900">
                {profile.max_workout_time ? `${profile.max_workout_time}m` : 'Not set'}
              </p>
            </div>
            <div className="bg-indigo-500 p-2 sm:p-3 rounded-full">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-teal-600">Min Gym Time</p>
              <p className="text-lg sm:text-2xl font-bold text-teal-900">
                {profile.min_workout_time ? `${profile.min_workout_time}m` : 'Not set'}
              </p>
            </div>
            <div className="bg-teal-500 p-2 sm:p-3 rounded-full">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-pink-600">Age & Level</p>
              <p className="text-lg sm:text-2xl font-bold text-pink-900">
                {profile.age ? `${profile.age}y` : 'N/A'} 
                <span className="text-sm block capitalize">
                  {profile.fitness_level || 'Not set'}
                </span>
              </p>
            </div>
            <div className="bg-pink-500 p-2 sm:p-3 rounded-full">
              <User className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-yellow-600">Weight & Height</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-900">
                {profile.weight ? `${profile.weight}kg` : 'N/A'}
                <span className="text-sm block">
                  {profile.height || 'Height not set'}
                </span>
              </p>
            </div>
            <div className="bg-yellow-500 p-2 sm:p-3 rounded-full">
              <Weight className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickStats;
