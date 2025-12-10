-- Verify Auth Setup in Supabase
-- Run this in Supabase SQL Editor

-- 1. Check if any users exist
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check if profiles were created for users
SELECT p.id, p.email, p.full_name, u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- 3. Check if user_roles exist
SELECT ur.user_id, ur.role, u.email
FROM public.user_roles ur
LEFT JOIN auth.users u ON ur.user_id = u.id;

-- 4. Check if the trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
AND event_object_table = 'users';
