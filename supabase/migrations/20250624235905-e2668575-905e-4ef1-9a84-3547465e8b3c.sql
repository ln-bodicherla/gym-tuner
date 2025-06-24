
-- Clear all data from tables including subscriptions and cache
-- This will remove subscription data and any cached information
DELETE FROM public.activity_logs;
DELETE FROM public.workouts;
DELETE FROM public.workout_plans;
DELETE FROM public.goals;
DELETE FROM public.injuries;
DELETE FROM public.user_settings; -- This includes workout_images_cache
DELETE FROM public.profiles;
DELETE FROM public.subscribers; -- This will clear all subscription data

-- Reset any sequences if needed (though most tables use gen_random_uuid())
-- No sequences to reset as all tables use UUID primary keys with gen_random_uuid()
