-- STEP 1: Fix UPDATE policy
DROP POLICY IF EXISTS "Users can update own editable requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON transport_requests;

CREATE POLICY "Users can update own pending requests"
  ON transport_requests
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND current_status IN ('draft', 'pending_head')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND current_status IN ('draft', 'pending_head')
  );

-- STEP 2: Check if head_id is NULL
SELECT id, request_number, head_id, current_status 
FROM transport_requests 
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- STEP 3: Find a head user (copy the ID from results)
SELECT id, full_name, email, department 
FROM users 
WHERE role = 'head' 
LIMIT 5;

-- STEP 4: Assign head to requests (replace YOUR_HEAD_ID with actual ID from step 3)
-- Example: UPDATE transport_requests SET head_id = 'abc123...' WHERE user_id = auth.uid() AND head_id IS NULL;
-- DO NOT RUN THIS LINE - it's just an example
-- Replace YOUR_HEAD_ID below with actual head ID:

UPDATE transport_requests 
SET head_id = 'YOUR_HEAD_ID'
WHERE user_id = auth.uid() 
AND head_id IS NULL
AND current_status = 'pending_head';
