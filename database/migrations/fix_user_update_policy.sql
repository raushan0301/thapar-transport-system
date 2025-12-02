-- FIX: Add UPDATE policy for users to edit their own requests

-- Check existing UPDATE policies
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'transport_requests' AND cmd = 'UPDATE';

-- Drop existing user update policy if it exists
DROP POLICY IF EXISTS "Users can update own editable requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON transport_requests;

-- Create comprehensive UPDATE policy for users
CREATE POLICY "Users can update own pending requests"
  ON transport_requests
  FOR UPDATE
  TO authenticated
  USING (
    -- User owns the request
    user_id = auth.uid()
    AND
    -- Request is still editable (not approved yet)
    current_status IN ('draft', 'pending_head')
  )
  WITH CHECK (
    -- User owns the request
    user_id = auth.uid()
    AND
    -- Request is still editable
    current_status IN ('draft', 'pending_head')
  );

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'transport_requests' AND policyname = 'Users can update own pending requests';
