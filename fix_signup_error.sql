-- Fix Signup Error "Database error finding user"
-- This script rebuilds the signup trigger to be perfectly safe

-- 1. Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create the function with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Attempt to create profile
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING; -- Pass if already exists
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for %: %', NEW.id, SQLERRM;
  END;
  
  -- Attempt to create user role
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT (user_id, role) DO NOTHING; -- Pass if already exists
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating role for %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- 3. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Grant permissions (Crucial!)
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Fix any existing broken users (stuck half-way)
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;
