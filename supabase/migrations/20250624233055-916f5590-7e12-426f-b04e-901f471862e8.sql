
-- Enable RLS on existing tables that don't have it yet (skip if already enabled)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'goals' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'injuries' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'workout_plans' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'workouts' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for goals (only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can view their own goals') THEN
        CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can create their own goals') THEN
        CREATE POLICY "Users can create their own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can update their own goals') THEN
        CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can delete their own goals') THEN
        CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for injuries (only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'injuries' AND policyname = 'Users can view their own injuries') THEN
        CREATE POLICY "Users can view their own injuries" ON public.injuries FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'injuries' AND policyname = 'Users can create their own injuries') THEN
        CREATE POLICY "Users can create their own injuries" ON public.injuries FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'injuries' AND policyname = 'Users can update their own injuries') THEN
        CREATE POLICY "Users can update their own injuries" ON public.injuries FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'injuries' AND policyname = 'Users can delete their own injuries') THEN
        CREATE POLICY "Users can delete their own injuries" ON public.injuries FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for workout_plans (only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can view their own workout plans') THEN
        CREATE POLICY "Users can view their own workout plans" ON public.workout_plans FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can create their own workout plans') THEN
        CREATE POLICY "Users can create their own workout plans" ON public.workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can update their own workout plans') THEN
        CREATE POLICY "Users can update their own workout plans" ON public.workout_plans FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can delete their own workout plans') THEN
        CREATE POLICY "Users can delete their own workout plans" ON public.workout_plans FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create RLS policies for workouts (only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can view their own workouts') THEN
        CREATE POLICY "Users can view their own workouts" ON public.workouts FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can create their own workouts') THEN
        CREATE POLICY "Users can create their own workouts" ON public.workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can update their own workouts') THEN
        CREATE POLICY "Users can update their own workouts" ON public.workouts FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can delete their own workouts') THEN
        CREATE POLICY "Users can delete their own workouts" ON public.workouts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add missing columns to workouts table to match your current data structure
ALTER TABLE public.workouts 
ADD COLUMN IF NOT EXISTS equipment_image_url TEXT,
ADD COLUMN IF NOT EXISTS source_plan_name TEXT;

-- Update profiles table to have RLS if not already enabled
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'profiles' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies for profiles (only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

-- Create a table for user settings/preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  workout_images_cache JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings (only if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view their own settings') THEN
        CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can create their own settings') THEN
        CREATE POLICY "Users can create their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update their own settings') THEN
        CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create unique constraint to ensure one settings record per user (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_user_settings'
    ) THEN
        ALTER TABLE public.user_settings 
        ADD CONSTRAINT unique_user_settings UNIQUE (user_id);
    END IF;
END $$;
