
-- Create admin_users table
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create admin_sessions table for session management
CREATE TABLE public.admin_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the default admin user with hashed password
INSERT INTO public.admin_users (email, password_hash, full_name, is_active)
VALUES (
  'admin@gymtuner.com',
  crypt('GymTuner2025!Admin', gen_salt('bf')),
  'System Administrator',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = crypt('GymTuner2025!Admin', gen_salt('bf')),
  updated_at = now();

-- Enable Row Level Security (optional - since this is admin-only)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to restrict access (admin functions will use service role key)
CREATE POLICY "Service role only" ON public.admin_users FOR ALL USING (false);
CREATE POLICY "Service role only" ON public.admin_sessions FOR ALL USING (false);
