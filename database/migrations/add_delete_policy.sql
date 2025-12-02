-- Add DELETE policy for users to delete their own pending requests

DROP POLICY IF EXISTS "Users can delete own pending requests" ON transport_requests;

CREATE POLICY "Users can delete own pending requests"
  ON transport_requests
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND current_status IN ('draft', 'pending_head')
  );

-- Verify policy created
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'transport_requests' AND cmd = 'DELETE';
