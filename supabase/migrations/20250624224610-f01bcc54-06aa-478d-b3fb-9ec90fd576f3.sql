
-- Add achieved_date column to goals table
ALTER TABLE public.goals ADD COLUMN achieved_date DATE;

-- Update the status check constraint to include 'achieved' status
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_status_check;
ALTER TABLE public.goals ADD CONSTRAINT goals_status_check CHECK (status IN ('active', 'completed', 'paused', 'achieved'));
