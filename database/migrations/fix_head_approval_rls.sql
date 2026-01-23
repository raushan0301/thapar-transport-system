-- ============================================
-- FIX HEAD APPROVAL RLS POLICY
-- ============================================
-- This script fixes the RLS policy that's blocking heads from creating approvals
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check current policies on approvals table
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
WHERE tablename = 'approvals'
ORDER BY policyname;

-- Step 2: Drop the existing restrictive policy
DROP POLICY IF EXISTS "Heads can create approvals" ON approvals;

-- Step 3: Create a new, more permissive policy for heads
CREATE POLICY "Heads can create approvals" ON approvals
  FOR INSERT 
  WITH CHECK (
    -- User must be a head
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'head'
    )
    -- Approver ID must match current user
    AND approver_id = auth.uid()
    -- Approver role must be 'head'
    AND approver_role = 'head'
    -- Request must exist and be assigned to this head
    AND EXISTS (
      SELECT 1 FROM transport_requests 
      WHERE id = request_id 
      AND (
        -- Direct assignment via head_id
        head_id = auth.uid()
        OR
        -- Custom head assignment via email
        custom_head_email = (
          SELECT email FROM users WHERE id = auth.uid()
        )
      )
      -- Request must be in pending_head status
      AND current_status = 'pending_head'
    )
  );

-- Step 4: Verify the new policy was created
SELECT 
  policyname, 
  permissive, 
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'approvals' 
AND policyname = 'Heads can create approvals';

-- ============================================
-- ALTERNATIVE: If the above still doesn't work, try this temporary permissive policy
-- ============================================
-- Uncomment the lines below to use a very permissive policy for debugging
-- WARNING: This allows ANY head to create approvals for ANY request
-- Use this ONLY for testing, then replace with the proper policy above

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
-- VERIFICATION
-- ============================================
-- After running this script, go back to the debug page and click "Test Approval Insert" again
-- If it still fails, uncomment and run the ALTERNATIVE policy above
-- ============================================
