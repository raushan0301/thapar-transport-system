-- ============================================
-- DEBUG AND FIX HEAD APPROVAL ISSUE
-- ============================================
-- Run this in Supabase SQL Editor to diagnose and fix the approval issue
-- ============================================

-- STEP 1: Check if the head user exists and has correct role
-- Replace 'head@example.com' with the actual head's email
SELECT id, email, role, full_name 
FROM users 
WHERE role = 'head';

-- STEP 2: Check pending requests assigned to heads
SELECT 
  tr.id,
  tr.request_number,
  tr.current_status,
  tr.head_id,
  tr.custom_head_email,
  u.email as head_email,
  u.role as head_role
FROM transport_requests tr
LEFT JOIN users u ON tr.head_id = u.id
WHERE tr.current_status = 'pending_head';

-- STEP 3: Check existing RLS policies on approvals table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'approvals'
ORDER BY policyname;

-- STEP 4: Test the is_head() function
-- This should return true when logged in as a head
SELECT public.is_head();

-- STEP 5: Check if there are any constraints on the approvals table
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
WHERE con.conrelid = 'approvals'::regclass;

-- ============================================
-- FIX: Drop and recreate the head approval policy with better logic
-- ============================================

-- Drop existing policy
DROP POLICY IF EXISTS "Heads can create approvals" ON approvals;

-- Create improved policy that's more permissive for debugging
CREATE POLICY "Heads can create approvals" ON approvals
  FOR INSERT 
  WITH CHECK (
    -- Must be a head user
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'head'
    )
    -- Approver ID must match current user
    AND approver_id = auth.uid()
    -- Approver role must be 'head'
    AND approver_role = 'head'
    -- Request must be assigned to this head
    AND EXISTS (
      SELECT 1 FROM transport_requests 
      WHERE id = request_id 
      AND (
        -- Direct assignment via head_id
        head_id = auth.uid()
        OR
        -- Custom head assignment via email
        custom_head_email IN (
          SELECT email FROM users WHERE id = auth.uid()
        )
      )
      -- Request must be in pending_head status
      AND current_status = 'pending_head'
    )
  );

-- ============================================
-- ALTERNATIVE: Temporary permissive policy for testing
-- ============================================
-- If the above doesn't work, uncomment this to allow all heads to create approvals
-- This is for debugging only - remove after finding the issue

/*
DROP POLICY IF EXISTS "Heads can create approvals" ON approvals;

CREATE POLICY "Heads can create approvals" ON approvals
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'head'
    )
    AND approver_id = auth.uid()
    AND approver_role = 'head'
  );
*/

-- ============================================
-- STEP 6: Verify the fix
-- ============================================
-- After running the fix, check if the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, with_check
FROM pg_policies
WHERE tablename = 'approvals' AND policyname = 'Heads can create approvals';

-- ============================================
-- DEBUGGING TIPS
-- ============================================
-- 1. Check browser console for exact error message
-- 2. Look for "permission denied" or "policy violation" errors
-- 3. Verify the user's role in the users table
-- 4. Ensure the request is actually assigned to the logged-in head
-- 5. Check that current_status is 'pending_head'
-- ============================================
