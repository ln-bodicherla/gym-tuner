
// Temporary helper functions for activity logging until types are updated
import { supabase } from '@/integrations/supabase/client';

export const logActivityDirect = async (
  userId: string,
  activityType: string,
  description: string,
  metadata?: Record<string, any>
) => {
  try {
    const { error } = await supabase
      .from('activity_logs' as any)
      .insert({
        user_id: userId,
        activity_type: activityType,
        description,
        metadata,
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getActivitiesDirect = async (userId: string, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('activity_logs' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading activities:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error loading activities:', error);
    return [];
  }
};
