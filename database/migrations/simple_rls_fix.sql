-- SIMPLE FIX: Drop and recreate all policies

-- 1. Drop ALL existing policies on transport_requests
DROP POLICY IF EXISTS "Users can view relevant requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can read their requests" ON transport_requests;
DROP POLICY IF EXISTS "Anyone can read requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can view requests" ON transport_requests;

-- 2. Create ONE comprehensive read policy
CREATE POLICY "Users can view relevant requests"
  ON transport_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    head_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'director', 'deputy_director', 'dean', 'registrar'))
  );

-- 3. Fix approvals table
DROP POLICY IF EXISTS "Users can view relevant approvals" ON approvals;
DROP POLICY IF EXISTS "Anyone can read approvals" ON approvals;
DROP POLICY IF EXISTS "Users can read approvals" ON approvals;

CREATE POLICY "Users can view relevant approvals"
  ON approvals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM transport_requests WHERE transport_requests.id = approvals.request_id AND transport_requests.user_id = auth.uid())
    OR approver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- 4. Fix users table
DROP POLICY IF EXISTS "Users can read relevant user data" ON users;
DROP POLICY IF EXISTS "Anyone can read users" ON users;
DROP POLICY IF EXISTS "Users can read other users" ON users;

CREATE POLICY "Users can read relevant user data"
  ON users FOR SELECT TO authenticated USING (true);

-- 5. Fix vehicles table
DROP POLICY IF EXISTS "Authenticated users can read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Anyone can read vehicles" ON vehicles;

CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);

-- Verify the policies were created
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('transport_requests', 'approvals', 'users', 'vehicles')
ORDER BY tablename;
