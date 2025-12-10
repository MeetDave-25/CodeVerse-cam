-- FORCE DELETE USER SCRIPT
-- Run this in Supabase SQL Editor to remove a stuck user.

DO $$
DECLARE
  -- CHANGE THIS to the email you want to delete
  target_email TEXT := 'parth_ljcca@ljku.edu.in';
  
  target_id UUID;
BEGIN
  -- 1. Find the user ID
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;
  
  IF target_id IS NULL THEN
    RAISE NOTICE 'User % not found, nothing to delete.', target_email;
    RETURN;
  END IF;

  RAISE NOTICE 'Found user % with ID %', target_email, target_id;

  -- 2. Delete from dependent tables first (Foreign Keys)
  -- We delete in specific order to avoid constraint errors
  
  DELETE FROM public.user_roles WHERE user_id = target_id;
  RAISE NOTICE 'Deleted from user_roles';
  
  DELETE FROM public.user_badges WHERE user_id = target_id;
  RAISE NOTICE 'Deleted from user_badges';

  DELETE FROM public.submissions WHERE user_id = target_id;
  RAISE NOTICE 'Deleted from submissions';
  
  DELETE FROM public.profiles WHERE id = target_id;
  RAISE NOTICE 'Deleted from profiles';
  

  -- 3. Finally, delete from auth.users
  DELETE FROM auth.users WHERE id = target_id;
  RAISE NOTICE '✅ Successfully deleted user % from auth.users', target_email;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '❌ Failed to delete user: %', SQLERRM;
END $$;
