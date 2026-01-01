-- FINAL FIX: User Delete with Proper RLS Policy
-- This uses auth metadata to check admin role

-- Step 1: Drop all existing delete policies
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can delete own account" ON public.users;
DROP POLICY IF EXISTS "Service role can delete users" ON public.users;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.users;

-- Step 2: Create a simple, working delete policy for admins
-- This checks if the authenticated user has admin role in the users table
CREATE POLICY "Enable delete for admins" ON public.users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin'
  );

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify the policy was created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'DELETE';
