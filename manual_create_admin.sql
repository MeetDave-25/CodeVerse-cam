-- MANUAL ADMIN CREATION SCRIPT
-- Run this entire block in the Supabase SQL Editor.

-- 1. Enable required extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- ----------------------------------------------------------------
  -- CONFIGURATION: CHANGE THESE VALUES!
  -- ----------------------------------------------------------------
  new_email TEXT := 'admin@example.com'; 
  new_password TEXT := 'AdminSecret123!';
  new_name TEXT := 'Super Admin';
  -- ----------------------------------------------------------------
  
  new_id UUID := gen_random_uuid();
BEGIN
  -- 2. Create the user in Supabase Auth
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    is_super_admin
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_id,
    'authenticated',
    'authenticated',
    new_email,
    crypt(new_password, gen_salt('bf')), -- Secure password hashing
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', new_name),
    NOW(),
    NOW(),
    '',
    '',
    false
  );

  -- 3. Create the Profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new_id, new_email, new_name);

  -- 4. Assign the ADMIN Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_id, 'admin');

  RAISE NOTICE '✅ Successfully created admin user: %', new_email;
EXCEPTION 
  WHEN unique_violation THEN
    RAISE NOTICE '❌ User with email % already exists!', new_email;
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Failed to create user: %', SQLERRM;
END $$;
