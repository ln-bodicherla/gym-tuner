
-- Add missing fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN min_workout_time INTEGER,
ADD COLUMN weekly_goal INTEGER,
ADD COLUMN experience_years INTEGER,
ADD COLUMN preferred_workout_types TEXT,
ADD COLUMN availability TEXT;
