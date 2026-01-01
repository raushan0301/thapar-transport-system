-- Fix User Management - Allow Admins to Delete Users
-- This migration adds RLS policy to allow admins to delete user accounts

-- Add DELETE policy for admins on users table
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify the policy
SELECT 
  policyname, 
  cmd as operation,
  qual as using_clause
FROM pg_policies 
WHERE tablename = 'users' AND cmd = 'DELETE'
ORDER BY policyname;
