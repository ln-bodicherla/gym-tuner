
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  full_name: string | null;
  phone: string | null;
  location: string | null;
  age: number | null;
  weight: number | null;
  height: string | null;
  fitness_level: string | null;
  max_workout_time: number | null;
  min_workout_time: number | null;
  weekly_goal: number | null;
  experience_years: number | null;
  preferred_workout_types: string | null;
  availability: string | null;
  preferences: string | null;
  limitations: string | null;
  preferred_time: number | null;
  workout_schedule: string[] | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfile();
    };

    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [user?.id]);

  const refreshProfile = () => {
    loadProfile();
  };

  return {
    profile,
    loading,
    refreshProfile
  };
};
