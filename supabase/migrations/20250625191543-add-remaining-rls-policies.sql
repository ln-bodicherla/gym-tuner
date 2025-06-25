
-- Add missing RLS policies for all user data tables

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles
        FOR SELECT USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Enable RLS on goals table (if not already enabled)
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for goals
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can view their own goals') THEN
        CREATE POLICY "Users can view their own goals" ON public.goals
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can create their own goals') THEN
        CREATE POLICY "Users can create their own goals" ON public.goals
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can update their own goals') THEN
        CREATE POLICY "Users can update their own goals" ON public.goals
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can delete their own goals') THEN
        CREATE POLICY "Users can delete their own goals" ON public.goals
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on injuries table (if not already enabled)
ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for injuries
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'injuries' AND policyname = 'Users can view their own injuries') THEN
        CREATE POLICY "Users can view their own injuries" ON public.injuries
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'injuries' AND policyname = 'Users can create their own injuries') THEN
        CREATE POLICY "Users can create their own injuries" ON public.injuries
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'injuries' AND policyname = 'Users can update their own injuries') THEN
        CREATE POLICY "Users can update their own injuries" ON public.injuries
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'injuries' AND policyname = 'Users can delete their own injuries') THEN
        CREATE POLICY "Users can delete their own injuries" ON public.injuries
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on workout_plans table (if not already enabled)
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_plans
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can view their own workout plans') THEN
        CREATE POLICY "Users can view their own workout plans" ON public.workout_plans
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can create their own workout plans') THEN
        CREATE POLICY "Users can create their own workout plans" ON public.workout_plans
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can update their own workout plans') THEN
        CREATE POLICY "Users can update their own workout plans" ON public.workout_plans
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_plans' AND policyname = 'Users can delete their own workout plans') THEN
        CREATE POLICY "Users can delete their own workout plans" ON public.workout_plans
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on workouts table (if not already enabled)
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workouts
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can view their own workouts') THEN
        CREATE POLICY "Users can view their own workouts" ON public.workouts
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can create their own workouts') THEN
        CREATE POLICY "Users can create their own workouts" ON public.workouts
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can update their own workouts') THEN
        CREATE POLICY "Users can update their own workouts" ON public.workouts
        FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Users can delete their own workouts') THEN
        CREATE POLICY "Users can delete their own workouts" ON public.workouts
        FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Enable RLS on subscribers table (if not already enabled)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for subscribers (users can only see their own subscription)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscribers' AND policyname = 'Users can view their own subscription') THEN
        CREATE POLICY "Users can view their own subscription" ON public.subscribers
        FOR SELECT USING (auth.uid() = user_id OR auth.email() = email);
    END IF;
END $$;
