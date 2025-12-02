-- Fix RLS policies and check constraints for admin approval workflow

-- 1. Check what actions are allowed in approvals table
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'approvals'::regclass
  AND con.contype = 'c';

-- 2. Check what statuses are allowed in transport_requests table
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'transport_requests'::regclass
  AND con.contype = 'c'
  AND con.conname LIKE '%status%';

-- 3. Drop and recreate approvals_action_check to include new actions
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_action_check;

ALTER TABLE approvals ADD CONSTRAINT approvals_action_check 
CHECK (action IN ('approved', 'rejected', 'routed_to_authority', 'pending', 'forwarded'));

-- 4. Drop and recreate transport_requests_current_status_check to include all statuses
ALTER TABLE transport_requests DROP CONSTRAINT IF EXISTS transport_requests_current_status_check;

ALTER TABLE transport_requests ADD CONSTRAINT transport_requests_current_status_check 
CHECK (current_status IN (
  'draft',
  'pending_head',
  'pending_admin',
  'pending_authority',
  'pending_vehicle',
  'vehicle_assigned',
  'in_progress',
  'completed',
  'rejected',
  'cancelled'
));

-- 5. Ensure RLS policy allows admin to insert approvals
DROP POLICY IF EXISTS "Admins can create approvals" ON approvals;

CREATE POLICY "Admins can create approvals"
  ON approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    approver_id = auth.uid()
    AND approver_role IN ('admin', 'head', 'director', 'deputy_director', 'dean', 'registrar')
  );

-- 6. Ensure RLS policy allows admin to update transport_requests
DROP POLICY IF EXISTS "Admins can update requests" ON transport_requests;

CREATE POLICY "Admins can update requests"
  ON transport_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Verify the constraints
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
WHERE con.conrelid IN ('approvals'::regclass, 'transport_requests'::regclass)
  AND con.contype = 'c'
ORDER BY con.conrelid::regclass::text, con.conname;
