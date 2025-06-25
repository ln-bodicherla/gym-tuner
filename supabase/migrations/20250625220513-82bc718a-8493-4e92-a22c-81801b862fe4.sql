
-- Drop the security audit log table
DROP TABLE IF EXISTS public.security_audit_log CASCADE;

-- Drop the user roles system
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Drop the admin system tables
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Drop security-related functions
DROP FUNCTION IF EXISTS public.verify_password(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.verify_admin_password(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- Remove the complex RLS policies and restore simple ones
-- First disable RLS on all tables to clean slate
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.injuries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can view their own injuries" ON public.injuries;
DROP POLICY IF EXISTS "Users can create their own injuries" ON public.injuries;
DROP POLICY IF EXISTS "Users can update their own injuries" ON public.injuries;
DROP POLICY IF EXISTS "Users can delete their own injuries" ON public.injuries;
DROP POLICY IF EXISTS "Users can view their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can create their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can update their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can delete their own workout plans" ON public.workout_plans;
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can create their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can update their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can delete their own activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can create their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;

-- Re-enable RLS and create simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.goals FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.injuries FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.workout_plans FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.workouts FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for own subscription" ON public.subscribers FOR SELECT USING (auth.uid() = user_id OR auth.email() = email);
CREATE POLICY "Enable insert for service role" ON public.subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for service role" ON public.subscribers FOR UPDATE USING (true);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.activity_logs FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for authenticated users" ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- Remove input validation constraints that were added during security fixes
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS phone_format,
DROP CONSTRAINT IF EXISTS age_range,
DROP CONSTRAINT IF EXISTS weight_range,
DROP CONSTRAINT IF EXISTS experience_range,
DROP CONSTRAINT IF EXISTS full_name_length,
DROP CONSTRAINT IF EXISTS location_length,
DROP CONSTRAINT IF EXISTS preferences_length,
DROP CONSTRAINT IF EXISTS limitations_length;

ALTER TABLE public.goals
DROP CONSTRAINT IF EXISTS title_length,
DROP CONSTRAINT IF EXISTS description_length;

ALTER TABLE public.injuries
DROP CONSTRAINT IF EXISTS injury_name_length,
DROP CONSTRAINT IF EXISTS injury_notes_length;

ALTER TABLE public.workouts
DROP CONSTRAINT IF EXISTS workout_name_length,
DROP CONSTRAINT IF EXISTS workout_notes_length;
