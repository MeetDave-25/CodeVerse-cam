-- ROLLBACK ADMIN PERMISSIONS
-- Run this to undo the policy changes from 'fix_admin_permissions.sql', 'fix_admin_cleanup.sql', etc.

-- 1. Drop Profiles Policies
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;

-- 2. Drop User Roles Policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- 3. Drop "Users can read own role" (NOTE: This may break login role checking if used!)
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;

-- 4. Drop User Badges Policies
DROP POLICY IF EXISTS "Admins can delete user badges" ON public.user_badges;

SELECT 'Rollback Complete: Admin policies dropped.' as result;
