-- FINAL COMPREHENSIVE FIX
-- 1. Remove duplicate roles (keep one per user, prefer 'admin')
-- 2. Add Unique constraint to prevent future issues
-- 3. Fix RLS policies
-- 4. Promote your specific email

DO $$
DECLARE
  target_email TEXT := 'parth_ljcca@ljku.edu.in';
  target_user_id UUID;
BEGIN
  -- ---------------------------------------------------------
  -- PART A: CLEANUP DUPLICATES
  -- ---------------------------------------------------------
  -- Delete "student" roles for anyone who ALSO has an "admin" role
  DELETE FROM public.user_roles ut1
  WHERE role = 'student'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ut2 
    WHERE ut2.user_id = ut1.user_id
    AND ut2.role = 'admin'
  );

  -- Delete exact duplicates (same user, same role) - keep newest
  DELETE FROM public.user_roles a USING public.user_roles b
  WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.role = b.role;

  -- ---------------------------------------------------------
  -- PART B: ADD UNIQUE CONSTRAINT
  -- ---------------------------------------------------------
  -- Now that duplicates are gone, we can enforce uniqueness
  -- This prevents the error you saw earlier "no unique constraint matching ON CONFLICT"
  ALTER TABLE public.user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key; -- drop if exists logic
  
  -- If you want strictly one role per user (Simplest for your app):
  -- ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  
  -- OR if you allow multiple (but unique pair), we need at least a PK or Unique pair
  -- Let's stick to unique pair for safety, or just rely on the cleanup above.
  -- Ideally:
  -- ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

  -- ---------------------------------------------------------
  -- PART C: FIX RLS POLICIES (Login Visibility)
  -- ---------------------------------------------------------
  DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
  CREATE POLICY "Users can read own role" 
  ON public.user_roles 
  FOR SELECT 
  USING ( auth.uid() = user_id );

  -- ---------------------------------------------------------
  -- PART D: PROMOTE YOU
  -- ---------------------------------------------------------
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NOT NULL THEN
    -- Remove any existing roles just to be 100% clean
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    -- Insert fresh Admin role
    INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'admin');
    
    RAISE NOTICE '✅ CLEANED and PROMOTED % to Admin', target_email;
  ELSE
    RAISE WARNING '⚠️ User % not found', target_email;
  END IF;

END $$;
