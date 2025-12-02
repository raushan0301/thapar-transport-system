-- Fix routed_to_authority check constraint

-- 1. Check current constraint
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
WHERE con.conrelid = 'transport_requests'::regclass
  AND con.conname LIKE '%routed_to_authority%';

-- 2. Drop the constraint
ALTER TABLE transport_requests 
DROP CONSTRAINT IF EXISTS transport_requests_routed_to_authority_check;

-- 3. Recreate with all valid authorities
ALTER TABLE transport_requests 
ADD CONSTRAINT transport_requests_routed_to_authority_check 
CHECK (
  routed_to_authority IS NULL 
  OR routed_to_authority IN ('REGISTRAR', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN')
);

-- 4. Also fix the <style jsx> warning by checking the AdminReviewRequest component
-- The warning is about jsx={true} which should be removed from the style tag
