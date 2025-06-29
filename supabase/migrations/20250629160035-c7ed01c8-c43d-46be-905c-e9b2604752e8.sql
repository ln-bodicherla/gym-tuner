
-- First, drop the existing problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can create admin users" ON public.admin_users;

-- Create a security definer function to check admin status safely
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
$$;

-- Create new policies using the security definer function to avoid recursion
CREATE POLICY "Admins can view admin users" ON public.admin_users
FOR SELECT USING (public.is_current_user_admin());

CREATE POLICY "Admins can create admin users" ON public.admin_users
FOR INSERT WITH CHECK (public.is_current_user_admin());

-- Add the current authenticated user as an admin
-- This will get the currently authenticated user's ID and make them an admin
INSERT INTO public.admin_users (user_id, created_by)
SELECT auth.uid(), auth.uid()
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;
