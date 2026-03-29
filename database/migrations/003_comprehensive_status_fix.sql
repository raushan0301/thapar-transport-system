-- COMPREHENSIVE FIX: Update database constraints for both status and action columns
-- This migration ensures that both transport_requests and approvals tables accept the new workflow statuses.

-- 1. Update transport_requests status check constraint
ALTER TABLE transport_requests DROP CONSTRAINT IF EXISTS transport_requests_current_status_check;

ALTER TABLE transport_requests ADD CONSTRAINT transport_requests_current_status_check 
CHECK (current_status IN (
  'draft',
  'pending_head',
  'pending_admin',
  'pending_authority',
  'pending_registrar',
  'pending_vehicle',
  'approved_awaiting_vehicle',
  'vehicle_assigned',
  'in_progress',
  'travel_completed',
  'completed',
  'rejected',
  'cancelled'
));

-- 2. Update approvals action check constraint
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_action_check;

ALTER TABLE approvals ADD CONSTRAINT approvals_action_check 
CHECK (action IN (
  'approved', 
  'rejected', 
  'routed_to_authority', 
  'pending', 
  'forwarded',
  'vehicle_assigned',
  'travel_completed'
));

-- 3. Verify comments
COMMENT ON COLUMN transport_requests.current_status IS 'Added travel_completed for driver journey end.';
COMMENT ON COLUMN approvals.action IS 'Added vehicle_assigned and travel_completed for tracking assignment and driver finish.';
