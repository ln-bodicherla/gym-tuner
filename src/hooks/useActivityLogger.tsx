
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logActivityDirect, getActivitiesDirect } from '@/utils/activityHelpers';

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
      const data = await getActivitiesDirect(user.id);
      // Cast the data to our ActivityLog type since we're using direct queries
      setActivities(data as ActivityLog[]);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
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
      await logActivityDirect(user.id, type, description, metadata);
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
