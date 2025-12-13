-- FIX ADMIN PERMISSIONS
-- This script grants Admins the ability to Update/Delete any profile and manage roles.
-- Run this in the Supabase SQL Editor.

-- 1. Policies for PROFILES
-- Allow admins to UPDATE any profile
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow admins to DELETE any profile
CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 2. Policies for USER_ROLES
-- Allow admins to SELECT all roles (needed to see who is what)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow admins to INSERT roles (promote/demote)
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow admins to UPDATE roles
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow admins to DELETE roles
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 3. Policies for USER_BADGES (Optional but good for cleanup)
CREATE POLICY "Admins can delete user badges" 
ON public.user_badges 
FOR DELETE 
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
