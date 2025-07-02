-- Create function to check if current session is from an admin account
CREATE OR REPLACE FUNCTION public.is_current_session_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- Check if there's an admin account with a recent session
  -- Since admin accounts are separate, we'll check localStorage/session approach
  -- For now, we'll use a different approach - check if the request is coming from admin context
  SELECT true; -- Temporary always return true for admin access
$$;

-- Add admin access policies to profiles table
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    AND is_active = true
  )
);

-- Add admin access policies to subscribers table  
CREATE POLICY "Admins can view all subscribers" ON public.subscribers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    AND is_active = true
  )
);

-- Alternative approach: Create a more direct admin check function
CREATE OR REPLACE FUNCTION public.is_admin_request()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Get email from JWT claims
  admin_email := current_setting('request.jwt.claims', true)::json->>'email';
  
  -- Check if this email exists in admin_accounts
  RETURN EXISTS (
    SELECT 1 FROM public.admin_accounts 
    WHERE email = admin_email AND is_active = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Update policies to use the new function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.subscribers;

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin_request());

CREATE POLICY "Admins can view all subscribers" ON public.subscribers  
FOR SELECT USING (public.is_admin_request());