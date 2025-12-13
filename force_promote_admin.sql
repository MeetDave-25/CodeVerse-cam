-- FORCE PROMOTE ADMIN (FIXED VERSION)
-- Run this script to turn an existing user into an Admin.
-- This version fixes the "no unique constraint" error.

DO $$
DECLARE
  target_email TEXT := 'parth_ljcca@ljku.edu.in'; -- <<< I put your email here for you
  target_user_id UUID;
BEGIN
  -- 1. Find the user ID
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION '❌ User with email % not found! Please Sign Up first.', target_email;
  END IF;

  -- 2. Try to UPDATE existing role(s) to admin
  -- This handles cases where the user already has a role row.
  UPDATE public.user_roles 
  SET role = 'admin' 
  WHERE user_id = target_user_id;

  -- 3. If no rows were updated (user had 0 roles), INSERT a new row
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin');
  END IF;

  RAISE NOTICE '✅ Successfully promoted % to ADMIN.', target_email;
END $$;
