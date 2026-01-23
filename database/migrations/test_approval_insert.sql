-- ============================================
-- SIMPLE TEST: Try to insert a test approval manually
-- ============================================
-- Replace the values below with actual data from your system
-- Then run this in Supabase SQL Editor while logged in as the head user
-- ============================================

-- First, let's see what user you're logged in as
SELECT 
  auth.uid() as my_user_id,
  auth.email() as my_email,
  (SELECT role FROM users WHERE id = auth.uid()) as my_role;

-- Check if there are any pending requests for this head
SELECT 
  id,
  request_number,
  current_status,
  head_id,
  custom_head_email,
  user_id
FROM transport_requests
WHERE current_status = 'pending_head'
AND (
  head_id = auth.uid()
  OR
  custom_head_email = (SELECT email FROM users WHERE id = auth.uid())
);

-- Now try to insert a test approval
-- IMPORTANT: Replace 'YOUR_REQUEST_ID_HERE' with an actual request ID from the query above
INSERT INTO approvals (
  request_id,
  approver_id,
  approver_role,
  action,
  comment,
  approved_at
) VALUES (
  'YOUR_REQUEST_ID_HERE',  -- Replace this with actual request ID
  auth.uid(),
  'head',
  'approved',
  'TEST APPROVAL - DELETE THIS',
  now()
);

-- If the insert succeeds, delete the test approval
DELETE FROM approvals 
WHERE comment = 'TEST APPROVAL - DELETE THIS'
AND approver_id = auth.uid();

-- ============================================
-- If you get an error, copy the EXACT error message
-- Common errors and what they mean:
-- ============================================
-- 1. "new row violates row-level security policy"
--    → The RLS policy is blocking the insert
--    → Solution: Run fix_head_approval_rls.sql
--
-- 2. "violates foreign key constraint"
--    → The request_id doesn't exist
--    → Solution: Use a valid request ID from the SELECT query above
--
-- 3. "violates check constraint"
--    → The action or approver_role value is invalid
--    → Solution: Check the constraints on the approvals table
--
-- 4. "null value in column"
--    → A required field is missing
--    → Solution: Check which field is null
-- ============================================
