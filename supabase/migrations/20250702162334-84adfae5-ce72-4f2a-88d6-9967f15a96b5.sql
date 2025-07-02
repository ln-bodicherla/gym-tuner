-- Add missing trial tracking columns to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_but_active BOOLEAN DEFAULT false;