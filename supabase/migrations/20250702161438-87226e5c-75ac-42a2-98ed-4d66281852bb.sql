-- Clear all user and subscription data app-wide
-- WARNING: This will permanently delete ALL user data

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