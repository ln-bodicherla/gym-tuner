
-- Fix existing invalid data before applying constraints

-- Clean up invalid phone numbers (set them to NULL if they don't match the format)
UPDATE public.profiles 
SET phone = NULL 
WHERE phone IS NOT NULL 
AND phone !~ '^\+?[1-9]\d{1,14}$';

-- Clean up invalid age values
UPDATE public.profiles 
SET age = NULL 
WHERE age IS NOT NULL 
AND (age < 13 OR age > 120);

-- Clean up invalid weight values
UPDATE public.profiles 
SET weight = NULL 
WHERE weight IS NOT NULL 
AND (weight <= 0 OR weight >= 1000);

-- Clean up invalid experience years
UPDATE public.profiles 
SET experience_years = NULL 
WHERE experience_years IS NOT NULL 
AND (experience_years < 0 OR experience_years > 50);

-- Truncate overly long text fields
UPDATE public.profiles 
SET full_name = LEFT(full_name, 100) 
WHERE full_name IS NOT NULL AND length(full_name) > 100;

UPDATE public.profiles 
SET location = LEFT(location, 200) 
WHERE location IS NOT NULL AND length(location) > 200;

UPDATE public.profiles 
SET preferences = LEFT(preferences, 1000) 
WHERE preferences IS NOT NULL AND length(preferences) > 1000;

UPDATE public.profiles 
SET limitations = LEFT(limitations, 1000) 
WHERE limitations IS NOT NULL AND length(limitations) > 1000;

-- Clean up goals table
UPDATE public.goals 
SET title = LEFT(title, 200) 
WHERE length(title) > 200;

UPDATE public.goals 
SET description = LEFT(description, 1000) 
WHERE description IS NOT NULL AND length(description) > 1000;

-- Clean up injuries table
UPDATE public.injuries 
SET name = LEFT(name, 200) 
WHERE length(name) > 200;

UPDATE public.injuries 
SET notes = LEFT(notes, 1000) 
WHERE notes IS NOT NULL AND length(notes) > 1000;

-- Clean up workouts table
UPDATE public.workouts 
SET name = LEFT(name, 200) 
WHERE length(name) > 200;

UPDATE public.workouts 
SET notes = LEFT(notes, 1000) 
WHERE notes IS NOT NULL AND length(notes) > 1000;

-- Now apply the security fixes and constraints
-- Enable RLS on all user data tables that don't have it yet
DO $$ BEGIN
    -- Check and enable RLS on activity_logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'activity_logs' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for activity_logs
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Users can view their own activity logs') THEN
        CREATE POLICY "Users can view their own activity logs" ON public.activity_logs
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Users can insert their own activity logs') THEN
        CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Users can update their own activity logs') THEN
        CREATE POLICY "Users can update their own activity logs" ON public.activity_logs
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Users can delete their own activity logs') THEN
        CREATE POLICY "Users can delete their own activity logs" ON public.activity_logs
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for user_settings
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view their own settings') THEN
        CREATE POLICY "Users can view their own settings" ON public.user_settings
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can create their own settings') THEN
        CREATE POLICY "Users can create their own settings" ON public.user_settings
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update their own settings') THEN
        CREATE POLICY "Users can update their own settings" ON public.user_settings
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can delete their own settings') THEN
        CREATE POLICY "Users can delete their own settings" ON public.user_settings
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Fix subscribers table policies - restrict updates to authorized operations only
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;
CREATE POLICY "Service role can update subscriptions" ON public.subscribers
FOR UPDATE USING (true);

DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
CREATE POLICY "Service role can insert subscriptions" ON public.subscribers
FOR INSERT WITH CHECK (true);

-- Create user roles system for proper admin management
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles safely
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT role 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    ORDER BY 
        CASE 
            WHEN role = 'admin' THEN 1
            WHEN role = 'moderator' THEN 2
            ELSE 3
        END
    LIMIT 1
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Now add input validation constraints (after cleaning data)
ALTER TABLE public.profiles 
ADD CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^\+?[1-9]\d{1,14}$'),
ADD CONSTRAINT age_range CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
ADD CONSTRAINT weight_range CHECK (weight IS NULL OR (weight > 0 AND weight < 1000)),
ADD CONSTRAINT experience_range CHECK (experience_years IS NULL OR (experience_years >= 0 AND experience_years <= 50));

-- Add length constraints for text fields
ALTER TABLE public.profiles 
ADD CONSTRAINT full_name_length CHECK (full_name IS NULL OR length(full_name) <= 100),
ADD CONSTRAINT location_length CHECK (location IS NULL OR length(location) <= 200),
ADD CONSTRAINT preferences_length CHECK (preferences IS NULL OR length(preferences) <= 1000),
ADD CONSTRAINT limitations_length CHECK (limitations IS NULL OR length(limitations) <= 1000);

-- Add constraints to other tables
ALTER TABLE public.goals
ADD CONSTRAINT title_length CHECK (length(title) <= 200),
ADD CONSTRAINT description_length CHECK (description IS NULL OR length(description) <= 1000);

ALTER TABLE public.injuries
ADD CONSTRAINT injury_name_length CHECK (length(name) <= 200),
ADD CONSTRAINT injury_notes_length CHECK (notes IS NULL OR length(notes) <= 1000);

ALTER TABLE public.workouts
ADD CONSTRAINT workout_name_length CHECK (length(name) <= 200),
ADD CONSTRAINT workout_notes_length CHECK (notes IS NULL OR length(notes) <= 1000);

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON public.security_audit_log
FOR INSERT WITH CHECK (true);
