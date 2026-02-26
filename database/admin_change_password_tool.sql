-- Run this in your Supabase SQL Editor to allow changing passwords from the profiles table
-- It will automatically hash the password and update the secure auth.users table

-- 1. Ensure the encryption extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add the column to the profiles table that you can type into
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_set_password TEXT;

-- 3. Create the secure function that updates the real authentication table
CREATE OR REPLACE FUNCTION public.update_password_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to access the hidden auth.users table
AS $$
BEGIN
  -- Only proceed if you actually typed a new password into the cell
  IF NEW.admin_set_password IS NOT NULL AND NEW.admin_set_password <> '' THEN
    
    -- Hash the password using bcrypt (Supabase standard) and update their actual login
    UPDATE auth.users
    SET encrypted_password = crypt(NEW.admin_set_password, gen_salt('bf'))
    WHERE id = NEW.id;
    
    -- CRITICAL: Clear the cell before saving, so the plaintext password is NEVER stored in the database
    NEW.admin_set_password = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Attach the trigger to the profiles table so it fires automatically on update
DROP TRIGGER IF EXISTS trigger_update_password_from_profile ON public.profiles;
CREATE TRIGGER trigger_update_password_from_profile
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_password_from_profile();

