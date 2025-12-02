-- FIX ALL RLS POLICIES FOR REQUEST VIEWING

-- 1. Fix transport_requests policies
DROP POLICY IF EXISTS "Users can read own requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can read their requests" ON transport_requests;
DROP POLICY IF EXISTS "Anyone can read requests" ON transport_requests;

-- Create comprehensive read policy for transport_requests
CREATE POLICY "Users can view relevant requests"
  ON transport_requests
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own requests
    user_id = auth.uid()
    OR
    -- Head can see requests assigned to them
    head_id = auth.uid()
    OR
    -- Admin can see all requests
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
    OR
    -- Authority can see requests that need their approval
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('director', 'deputy_director', 'dean')
    )
    OR
    -- Registrar can see all requests
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'registrar'
    )
  );

-- 2. Fix approvals table policies
DROP POLICY IF EXISTS "Anyone can read approvals" ON approvals;
DROP POLICY IF EXISTS "Users can read approvals" ON approvals;

CREATE POLICY "Users can view relevant approvals"
  ON approvals
  FOR SELECT
  TO authenticated
  USING (
    -- User can see approvals for their requests
    EXISTS (
      SELECT 1 FROM transport_requests
      WHERE transport_requests.id = approvals.request_id
      AND transport_requests.user_id = auth.uid()
    )
    OR
    -- Approver can see their own approvals
    approver_id = auth.uid()
    OR
    -- Admin can see all approvals
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- 3. Fix users table read policy
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Users can read other users" ON users;

CREATE POLICY "Users can read relevant user data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- User can read their own data
    id = auth.uid()
    OR
    -- Anyone can read basic user info (for displaying names, etc.)
    true
  );

-- 4. Fix vehicles table read policy (if not already done)
DROP POLICY IF EXISTS "Anyone can read vehicles" ON vehicles;

CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify policies are working
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('transport_requests', 'approvals', 'users', 'vehicles')
ORDER BY tablename, policyname;
