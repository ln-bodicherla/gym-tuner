-- Drop the existing admin_users table that references auth.users
DROP TABLE IF EXISTS public.admin_users;

-- Create a completely separate admin accounts table
CREATE TABLE public.admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.admin_accounts(id)
);

-- Enable Row Level Security
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin accounts
CREATE POLICY "Admins can view all admin accounts" ON public.admin_accounts
FOR SELECT USING (true);

CREATE POLICY "Super admins can insert admin accounts" ON public.admin_accounts
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  ) OR NOT EXISTS (SELECT 1 FROM public.admin_accounts)
);

CREATE POLICY "Super admins can update admin accounts" ON public.admin_accounts
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  )
);

-- Create function to hash passwords (simple version - in production use proper bcrypt)
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- This is a simple hash - in production, use proper bcrypt or similar
  RETURN encode(digest(password || 'salt_string', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify admin credentials
CREATE OR REPLACE FUNCTION public.verify_admin_credentials(
  input_email TEXT,
  input_password TEXT
)
RETURNS TABLE(
  admin_id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT
) AS $$
DECLARE
  hashed_password TEXT;
BEGIN
  -- Hash the input password
  hashed_password := public.hash_password(input_password);
  
  -- Find matching admin and update last login
  UPDATE public.admin_accounts 
  SET last_login_at = now()
  WHERE admin_accounts.email = input_email 
    AND admin_accounts.password_hash = hashed_password
    AND admin_accounts.is_active = true;

  -- Return admin details if found
  RETURN QUERY
  SELECT a.id, a.email, a.full_name, a.role
  FROM public.admin_accounts a
  WHERE a.email = input_email 
    AND a.password_hash = hashed_password
    AND a.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create default super admin (password: admin123)
INSERT INTO public.admin_accounts (email, password_hash, full_name, role)
VALUES (
  'admin@gymtuner.com',
  public.hash_password('admin123'),
  'System Administrator',
  'super_admin'
)
ON CONFLICT (email) DO NOTHING;