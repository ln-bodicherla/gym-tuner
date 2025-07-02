-- Create admin function to get all users data
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ,
  subscribed BOOLEAN,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function bypasses RLS to return all user data for admin use
  -- It should only be called from admin contexts
  
  RETURN QUERY
  SELECT 
    COALESCE(s.user_id, p.id) as user_id,
    COALESCE(s.email, 'No email') as email,
    COALESCE(p.full_name, 'Unknown') as full_name,
    COALESCE(s.created_at, p.created_at) as created_at,
    COALESCE(s.subscribed, false) as subscribed,
    s.subscription_tier,
    s.subscription_end,
    s.trial_end
  FROM public.profiles p
  FULL OUTER JOIN public.subscribers s ON p.id = s.user_id
  WHERE p.id IS NOT NULL OR s.user_id IS NOT NULL;
END;
$$;

-- Grant execute permission to authenticated users (admin will call this)
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO anon;