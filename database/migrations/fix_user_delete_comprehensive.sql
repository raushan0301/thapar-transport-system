-- Comprehensive User Delete Fix
-- This ensures admins can delete users with proper RLS policies

-- Step 1: Drop existing delete policies
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can delete own account" ON public.users;
DROP POLICY IF EXISTS "Service role can delete users" ON public.users;

-- Step 2: Create new delete policy for admins
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE
  USING (
    -- Allow if current user is an admin
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Step 3: Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- Step 5: Test query (should return true if you're an admin)
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM users WHERE id = auth.uid()) as current_user_role,
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin' as is_admin;
