
-- Create password verification functions that are missing
CREATE OR REPLACE FUNCTION public.verify_password(password text, hash text)
RETURNS boolean AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin-specific password verification function
CREATE OR REPLACE FUNCTION public.verify_admin_password(input_email text, input_password text)
RETURNS boolean AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash 
  FROM public.admin_users 
  WHERE email = input_email AND is_active = true;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
