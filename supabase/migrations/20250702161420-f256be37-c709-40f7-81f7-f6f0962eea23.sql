-- Clear all user and subscription data app-wide
-- WARNING: This will permanently delete ALL user data

-- First, disable RLS temporarily to ensure we can delete everything
SET session_replication_role = replica;

-- Clear all user-related tables in the correct order to avoid foreign key violations

-- Clear activity logs
DELETE FROM public.activity_logs;

-- Clear user settings
DELETE FROM public.user_settings;

-- Clear analytics events and sessions
DELETE FROM public.analytics_events;
DELETE FROM public.analytics_sessions;

-- Clear workout-related data
DELETE FROM public.workouts;
DELETE FROM public.workout_plans;

-- Clear goals and injuries
DELETE FROM public.goals;
DELETE FROM public.injuries;

-- Clear subscription data
DELETE FROM public.subscribers;

-- Clear user profiles
DELETE FROM public.profiles;

-- Re-enable RLS
SET session_replication_role = DEFAULT;

-- Log the operation with proper JSON casting
INSERT INTO public.activity_logs (id, user_id, activity_type, description, metadata, created_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'system_operation',
  'All user and subscription data cleared',
  ('{"operation": "data_clear", "timestamp": "' || now()::text || '"}')::jsonb,
  now()
);