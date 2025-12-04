-- Add pending_registrar status to transport_requests check constraint

-- Drop and recreate transport_requests_current_status_check to include pending_registrar
ALTER TABLE transport_requests DROP CONSTRAINT IF EXISTS transport_requests_current_status_check;

ALTER TABLE transport_requests ADD CONSTRAINT transport_requests_current_status_check 
CHECK (current_status IN (
  'draft',
  'pending_head',
  'pending_admin',
  'pending_authority',
  'pending_registrar',
  'approved_awaiting_vehicle',
  'pending_vehicle',
  'vehicle_assigned',
  'in_progress',
  'completed',
  'rejected',
  'cancelled'
));

-- Verify the constraint
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
WHERE con.conrelid = 'transport_requests'::regclass
  AND con.contype = 'c'
  AND con.conname LIKE '%status%';
