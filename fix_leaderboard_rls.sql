-- Fix RLS Policy for Leaderboard
-- The current policy only allows users to see their OWN role.
-- This prevents the leaderboard from knowing who is a student vs admin.

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- 2. Create a new policy allowing EVERYONE to view roles
-- This is necessary so the frontend can filter students for the leaderboard
CREATE POLICY "Anyone can view user roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

-- 3. Verify it's fixed
SELECT * FROM pg_policies WHERE tablename = 'user_roles';
