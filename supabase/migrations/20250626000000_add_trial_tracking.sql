
-- Add trial tracking to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_but_active BOOLEAN DEFAULT false;

-- Update existing records to mark trial as used if they have a trial_end date
UPDATE public.subscribers 
SET trial_used = true 
WHERE trial_end IS NOT NULL;
