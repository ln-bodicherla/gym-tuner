
-- First, let's see what values are allowed for the status field and fix the constraint
-- Drop the existing check constraint that's causing issues
ALTER TABLE workout_plans DROP CONSTRAINT IF EXISTS workout_plans_status_check;

-- Add a new check constraint with the correct values
ALTER TABLE workout_plans ADD CONSTRAINT workout_plans_status_check 
  CHECK (status IN ('scheduled', 'in-progress', 'completed'));

-- Also ensure the difficulty_level has proper constraints
ALTER TABLE workout_plans DROP CONSTRAINT IF EXISTS workout_plans_difficulty_level_check;
ALTER TABLE workout_plans ADD CONSTRAINT workout_plans_difficulty_level_check 
  CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
