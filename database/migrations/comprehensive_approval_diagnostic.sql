-- ============================================
-- COMPREHENSIVE APPROVAL INSERT DIAGNOSTIC
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- Copy and paste ALL the output and send it back
-- ============================================

-- ============================================
-- PART 1: Current User Information
-- ============================================
SELECT '=== PART 1: CURRENT USER INFO ===' as section;

SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email,
  (SELECT role FROM users WHERE id = auth.uid()) as current_user_role,
  (SELECT full_name FROM users WHERE id = auth.uid()) as current_user_name;

-- ============================================
-- PART 2: Pending Requests for This Head
-- ============================================
SELECT '=== PART 2: PENDING REQUESTS ===' as section;

SELECT 
  tr.id as request_id,
  tr.request_number,
  tr.current_status,
  tr.head_id,
  tr.custom_head_email,
  tr.user_id,
  u.email as requester_email,
  u.full_name as requester_name,
  -- Check if this head is assigned
  CASE 
    WHEN tr.head_id = auth.uid() THEN 'YES - via head_id'
    WHEN tr.custom_head_email = (SELECT email FROM users WHERE id = auth.uid()) THEN 'YES - via custom_head_email'
    ELSE 'NO'
  END as is_assigned_to_me
FROM transport_requests tr
LEFT JOIN users u ON tr.user_id = u.id
WHERE tr.current_status = 'pending_head'
ORDER BY tr.submitted_at DESC
LIMIT 5;

-- ============================================
-- PART 3: Test Each Condition of the RLS Policy
-- ============================================
SELECT '=== PART 3: RLS POLICY CONDITIONS ===' as section;

-- Get the first pending request for testing
WITH test_request AS (
  SELECT id as request_id
  FROM transport_requests
  WHERE current_status = 'pending_head'
  AND (
    head_id = auth.uid()
    OR custom_head_email = (SELECT email FROM users WHERE id = auth.uid())
  )
  LIMIT 1
)
SELECT 
  -- Condition 1: User is a head
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'head'
  ) as condition_1_is_head,
  
  -- Condition 2: Would approver_id match (we'll use auth.uid())
  (auth.uid() = auth.uid()) as condition_2_approver_id_matches,
  
  -- Condition 3: Would approver_role be 'head' (we'll use 'head')
  ('head' = 'head') as condition_3_approver_role_is_head,
  
  -- Condition 4: Request exists and is assigned to this head
  EXISTS (
    SELECT 1 FROM transport_requests tr
    WHERE tr.id = (SELECT request_id FROM test_request)
    AND (
      tr.head_id = auth.uid()
      OR tr.custom_head_email = (SELECT email FROM users WHERE id = auth.uid())
    )
    AND tr.current_status = 'pending_head'
  ) as condition_4_request_assigned_and_pending,
  
  -- Show the test request ID
  (SELECT request_id FROM test_request) as test_request_id;

-- ============================================
-- PART 4: Detailed Request Check
-- ============================================
SELECT '=== PART 4: DETAILED REQUEST CHECK ===' as section;

WITH test_request AS (
  SELECT id as request_id
  FROM transport_requests
  WHERE current_status = 'pending_head'
  AND (
    head_id = auth.uid()
    OR custom_head_email = (SELECT email FROM users WHERE id = auth.uid())
  )
  LIMIT 1
)
SELECT 
  tr.id,
  tr.request_number,
  tr.current_status,
  tr.head_id,
  tr.custom_head_email,
  auth.uid() as my_user_id,
  (SELECT email FROM users WHERE id = auth.uid()) as my_email,
  -- Check each assignment method
  (tr.head_id = auth.uid()) as assigned_via_head_id,
  (tr.custom_head_email = (SELECT email FROM users WHERE id = auth.uid())) as assigned_via_email,
  -- Check status
  (tr.current_status = 'pending_head') as status_is_pending_head
FROM transport_requests tr
WHERE tr.id = (SELECT request_id FROM test_request);

-- ============================================
-- PART 5: Check for Existing Approvals
-- ============================================
SELECT '=== PART 5: EXISTING APPROVALS ===' as section;

WITH test_request AS (
  SELECT id as request_id
  FROM transport_requests
  WHERE current_status = 'pending_head'
  AND (
    head_id = auth.uid()
    OR custom_head_email = (SELECT email FROM users WHERE id = auth.uid())
  )
  LIMIT 1
)
SELECT 
  a.id,
  a.request_id,
  a.approver_id,
  a.approver_role,
  a.action,
  a.approved_at,
  u.email as approver_email
FROM approvals a
LEFT JOIN users u ON a.approver_id = u.id
WHERE a.request_id = (SELECT request_id FROM test_request);

-- ============================================
-- PART 6: Check Table Constraints
-- ============================================
SELECT '=== PART 6: TABLE CONSTRAINTS ===' as section;

SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    ELSE con.contype::text
  END AS constraint_type_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
WHERE con.conrelid = 'approvals'::regclass
ORDER BY con.contype, con.conname;

-- ============================================
-- PART 7: Attempt Test Insert (This will likely fail)
-- ============================================
SELECT '=== PART 7: ATTEMPTING TEST INSERT ===' as section;

-- Get a test request ID
DO $$
DECLARE
  test_req_id uuid;
  insert_result text;
BEGIN
  -- Get first pending request
  SELECT id INTO test_req_id
  FROM transport_requests
  WHERE current_status = 'pending_head'
  AND (
    head_id = auth.uid()
    OR custom_head_email = (SELECT email FROM users WHERE id = auth.uid())
  )
  LIMIT 1;
  
  IF test_req_id IS NULL THEN
    RAISE NOTICE 'ERROR: No pending requests found for this head';
  ELSE
    RAISE NOTICE 'Test Request ID: %', test_req_id;
    
    -- Try to insert
    BEGIN
      INSERT INTO approvals (
        request_id,
        approver_id,
        approver_role,
        action,
        comment,
        approved_at
      ) VALUES (
        test_req_id,
        auth.uid(),
        'head',
        'approved',
        'DIAGNOSTIC TEST - DELETE THIS',
        now()
      );
      
      RAISE NOTICE 'SUCCESS: Test approval inserted!';
      
      -- Clean up
      DELETE FROM approvals 
      WHERE request_id = test_req_id 
      AND comment = 'DIAGNOSTIC TEST - DELETE THIS';
      
      RAISE NOTICE 'Test approval deleted';
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'ERROR: %', SQLERRM;
      RAISE NOTICE 'DETAIL: %', SQLSTATE;
    END;
  END IF;
END $$;

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- Copy ALL the output from this script and send it back
-- Look especially for:
-- 1. The "PART 3" results - which conditions are true/false
-- 2. The "PART 7" error message if the insert fails
-- ============================================
