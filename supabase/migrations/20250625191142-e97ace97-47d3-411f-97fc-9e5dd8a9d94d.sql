
-- Add workout_schedule column to profiles table to store user's selected workout days
ALTER TABLE public.profiles 
ADD COLUMN workout_schedule jsonb DEFAULT '["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]'::jsonb;

-- Add comment to explain the column
COMMENT ON COLUMN public.profiles.workout_schedule IS 'Array of weekdays when user plans to workout (e.g., ["monday", "tuesday", "wednesday", "thursday", "friday"])';
