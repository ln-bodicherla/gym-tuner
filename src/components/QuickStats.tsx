import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Trophy, User, Weight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { getCurrentDatePST, getStartOfWeekPST } from "@/utils/timezoneHelpers";

interface QuickStatsProps {
  className?: string;
}

const QuickStats = ({ className }: QuickStatsProps) => {
  const { user } = useAuth();
  const { lastUpdate } = useRealtimeDashboard();
  const [stats, setStats] = useState({
    activeInjuries: 0,
    goalsAchievedThisWeek: 0
  });
  const [profile, setProfile] = useState({
    age: null,
    weight: null,
    height: null,
    fitness_level: null,
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
        .select('age, weight, height, fitness_level')
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

      console.log('Stats calculated:', {
        activeInjuries: injuries?.length || 0,
        goalsAchievedCount: goalsAchievedThisWeek?.length || 0,
      });

      setStats({
        activeInjuries: injuries?.length || 0,
        goalsAchievedThisWeek: goalsAchievedThisWeek?.length || 0,
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
