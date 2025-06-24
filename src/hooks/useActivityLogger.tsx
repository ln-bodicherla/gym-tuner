
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: 'profile_update' | 'goal_created' | 'goal_updated' | 'goal_deleted' | 'injury_added' | 'injury_updated' | 'injury_deleted' | 'workout_created' | 'workout_completed' | 'plan_generated';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export const useActivityLogger = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Load recent activities
  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading activities:', error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (
    type: ActivityLog['activity_type'],
    description: string,
    metadata?: Record<string, any>
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          activity_type: type,
          description,
          metadata,
        });

      if (error) {
        console.error('Error logging activity:', error);
        return;
      }

      // Refresh activities after logging
      await loadActivities();
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return {
    activities,
    loading,
    logActivity,
    refreshActivities: loadActivities,
  };
};
