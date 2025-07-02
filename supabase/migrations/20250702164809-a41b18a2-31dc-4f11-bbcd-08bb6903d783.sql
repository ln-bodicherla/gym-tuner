-- Drop and recreate admin_get_all_users function to include cancelled_but_active field
DROP FUNCTION IF EXISTS public.admin_get_all_users();

CREATE OR REPLACE FUNCTION public.admin_get_all_users()
 RETURNS TABLE(
   user_id uuid, 
   email text, 
   full_name text, 
   created_at timestamp with time zone, 
   subscribed boolean, 
   subscription_tier text, 
   subscription_end timestamp with time zone, 
   trial_end timestamp with time zone,
   cancelled_but_active boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
    s.trial_end,
    COALESCE(s.cancelled_but_active, false) as cancelled_but_active
  FROM public.profiles p
  FULL OUTER JOIN public.subscribers s ON p.id = s.user_id
  WHERE p.id IS NOT NULL OR s.user_id IS NOT NULL;
END;
$function$;