-- FIX ADMIN PERMISSIONS (CLEANUP & RESET)
-- Run this in Supabase SQL Editor to fix the "policy already exists" error.

-- 1. DROP EXISTING POLICIES (To avoid conflicts)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete user badges" ON public.user_badges;

-- ALSO DROP any "Users can read own role" policies if they exist to prevent recursion/conflict
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;

-- 2. RE-CREATE POLICIES CORRECTLY

-- CRITICAL: Allow users to read their OWN role (Fixed login redirection issue)
CREATE POLICY "Users can read own role" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() = user_id
);

-- Allow Admins to View/Manage ALL roles
-- (Note: We use a separate policy for admins to avoid circular dependency recursion)
-- Ideally, bootstrapped admin needs to be checked carefully. 
-- Simple check: If you are an admin, you can do anything.

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 3. PROFILES POLICIES
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 4. VERIFY ADMIN STATUS
-- Run this to check if YOU are actually an admin
SELECT * FROM public.user_roles WHERE user_id = auth.uid();
