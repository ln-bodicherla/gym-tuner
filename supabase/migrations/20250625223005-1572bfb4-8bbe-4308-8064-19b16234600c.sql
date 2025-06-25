
-- Remove admin-related tables and functions
DROP TABLE IF EXISTS public.admin_sessions CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP FUNCTION IF EXISTS public.verify_admin_password(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.verify_password(text, text) CASCADE;
