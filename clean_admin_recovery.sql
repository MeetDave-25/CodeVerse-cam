-- CLEAN ADMIN RECOVERY SCRIPT
-- Run this in Supabase SQL Editor.
-- This script will DELETE existing admin data and RECREATE it properly.

DO $$
DECLARE
  -- CONFIGURATION - CHANGE THESE VALUES!
  target_email TEXT := 'admin@example.com';
  target_password TEXT := 'AdminSecret123!';
  target_name TEXT := 'Super Admin';
  
  new_id UUID := gen_random_uuid();
BEGIN
  -- 1. DISABLE TRIGGER (prevents automatic profile creation)
  RAISE NOTICE '⏸️ Disabling auto-trigger...';
  ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
  
  -- 2. CLEANUP: Delete everything related to this email
  RAISE NOTICE '🧹 Cleaning up existing data...';
  
  DELETE FROM public.user_roles 
  WHERE user_id IN (SELECT id FROM auth.users WHERE email = target_email);
  
  DELETE FROM public.profiles 
  WHERE id IN (SELECT id FROM auth.users WHERE email = target_email);
  
  DELETE FROM auth.users 
  WHERE email = target_email;
  
  RAISE NOTICE '✨ Cleanup complete.';

  -- 3. CREATE NEW USER (trigger is disabled, so no auto-profile)
  RAISE NOTICE '👤 Creating new admin user...';
  
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data, 
    created_at, updated_at, confirmation_token, recovery_token, is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated', 
    target_email, crypt(target_password, gen_salt('bf')), NOW(), 
    '{"provider":"email","providers":["email"]}', 
    jsonb_build_object('full_name', target_name), 
    NOW(), NOW(), '', '', false
  );

  -- 4. CREATE PROFILE MANUALLY
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new_id, target_email, target_name);

  -- 5. ASSIGN ADMIN ROLE
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_id, 'admin');

  -- 6. RE-ENABLE TRIGGER (for future signups)
  RAISE NOTICE '▶️ Re-enabling auto-trigger...';
  ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

  RAISE NOTICE '✅ Successfully created FRESH admin user: %', target_email;
  RAISE NOTICE '🔑 Email: % | Password: %', target_email, target_password;
  
EXCEPTION WHEN OTHERS THEN
  -- Make sure to re-enable trigger even if there's an error
  ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
  RAISE EXCEPTION '❌ Failed to recover admin: %', SQLERRM;
END $$;
