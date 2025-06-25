
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Trophy, User, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { getCurrentDatePST, getStartOfWeekPST } from "@/utils/timezoneHelpers";
import { calculateWorkoutStreak } from "@/utils/streakHelpers";

interface QuickStatsProps {
  className?: string;
}

const QuickStats = ({ className }: QuickStatsProps) => {
  const { user } = useAuth();
  const { lastUpdate } = useRealtimeDashboard();
  const [stats, setStats] = useState({
    activeInjuries: 0,
    goalsAchievedThisWeek: 0,
    workoutStreak: 0
  });
  const [profile, setProfile] = useState({
    age: null,
    weight: null,
    height: null,
    fitness_level: null,
    workout_schedule: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as string[]
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
        .select('age, weight, height, fitness_level, workout_schedule')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profileData) {
        console.log('Profile loaded successfully:', profileData);
        
        // Parse workout_schedule from Json to string[]
        let workoutSchedule: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        if (profileData.workout_schedule) {
          try {
            if (Array.isArray(profileData.workout_schedule)) {
              workoutSchedule = profileData.workout_schedule as string[];
            } else if (typeof profileData.workout_schedule === 'string') {
              workoutSchedule = JSON.parse(profileData.workout_schedule);
            }
          } catch (error) {
            console.error('Error parsing workout_schedule:', error);
          }
        }

        setProfile({
          ...profileData,
          workout_schedule: workoutSchedule
        });
      } else {
        console.log('No profile found for user');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      console.log('Loading stats for user:', user.id);
      
      // Get start of week and current date in PST using centralized helpers
      const startOfWeekPST = getStartOfWeekPST();
      const currentDatePST = getCurrentDatePST();
      console.log('Start of week PST:', startOfWeekPST);
      console.log('Current date PST:', currentDatePST);

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

      // Get goals achieved this week (using PST dates for comparison)
      const { data: goalsAchievedThisWeek, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'achieved')
        .gte('achieved_date', startOfWeekPST)
        .lte('achieved_date', currentDatePST);

      if (goalsError) {
        console.error('Error loading goals achieved this week:', goalsError);
      } else {
        console.log('Goals achieved this week loaded:', goalsAchievedThisWeek?.length || 0);
      }

      // Get workouts for streak calculation (last 30 days should be enough)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoPST = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('workout_date')
        .eq('user_id', user.id)
        .gte('workout_date', thirtyDaysAgoPST)
        .order('workout_date', { ascending: false });

      let workoutStreak = 0;
      if (workoutsError) {
        console.error('Error loading workouts for streak:', workoutsError);
      } else {
        console.log('Workouts for streak loaded:', workouts?.length || 0);
        // Wait for profile to be loaded before calculating streak
        const profileData = await supabase
          .from('profiles')
          .select('workout_schedule')
          .eq('id', user.id)
          .maybeSingle();
        
        // Parse workout_schedule properly
        let workoutSchedule: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (profileData.data?.workout_schedule) {
          try {
            if (Array.isArray(profileData.data.workout_schedule)) {
              workoutSchedule = profileData.data.workout_schedule as string[];
            } else if (typeof profileData.data.workout_schedule === 'string') {
              workoutSchedule = JSON.parse(profileData.data.workout_schedule);
            }
          } catch (error) {
            console.error('Error parsing workout_schedule for streak:', error);
          }
        }
        
        workoutStreak = calculateWorkoutStreak(workouts || [], workoutSchedule);
        console.log('Calculated workout streak:', workoutStreak);
      }

      console.log('Stats calculated:', {
        activeInjuries: injuries?.length || 0,
        goalsAchievedCount: goalsAchievedThisWeek?.length || 0,
        workoutStreak
      });

      setStats({
        activeInjuries: injuries?.length || 0,
        goalsAchievedThisWeek: goalsAchievedThisWeek?.length || 0,
        workoutStreak
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
              <p className="text-xs sm:text-sm font-medium text-purple-600">Goals This Week</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-900">{stats.goalsAchievedThisWeek}</p>
              <p className="text-xs text-purple-500">Achieved</p>
            </div>
            <div className="bg-purple-500 p-2 sm:p-3 rounded-full">
              <Trophy className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-red-600">Workout Streak</p>
              <p className="text-lg sm:text-2xl font-bold text-red-900">{stats.workoutStreak}</p>
              <p className="text-xs text-red-500">Days</p>
            </div>
            <div className="bg-red-500 p-2 sm:p-3 rounded-full">
              <Flame className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
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
    </div>
  );
};

export default QuickStats;
