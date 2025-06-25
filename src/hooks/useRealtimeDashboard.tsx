
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useRealtimeDashboard = () => {
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    if (!user) return;

    // Create channels for real-time updates
    const goalsChannel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Goals data updated, refreshing dashboard');
          setLastUpdate(Date.now());
        }
      )
      .subscribe();

    const workoutsChannel = supabase
      .channel('workouts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workouts',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Workouts data updated, refreshing dashboard');
          setLastUpdate(Date.now());
        }
      )
      .subscribe();

    const injuriesChannel = supabase
      .channel('injuries-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'injuries',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Injuries data updated, refreshing dashboard');
          setLastUpdate(Date.now());
        }
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        () => {
          console.log('Profile data updated, refreshing dashboard');
          setLastUpdate(Date.now());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(workoutsChannel);
      supabase.removeChannel(injuriesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [user]);

  return { lastUpdate };
};
