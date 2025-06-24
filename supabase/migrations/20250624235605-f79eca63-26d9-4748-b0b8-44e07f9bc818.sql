
-- Clear all data from tables (in order to avoid foreign key constraint issues)
-- Keep subscribers table data intact for subscription functionality
DELETE FROM public.activity_logs;
DELETE FROM public.workouts;
DELETE FROM public.workout_plans;
DELETE FROM public.goals;
DELETE FROM public.injuries;
DELETE FROM public.user_settings;
DELETE FROM public.profiles;

-- Reset any sequences if needed (though most tables use gen_random_uuid())
-- No sequences to reset as all tables use UUID primary keys with gen_random_uuid()
