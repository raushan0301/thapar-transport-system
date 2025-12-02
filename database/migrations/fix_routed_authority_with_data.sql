-- Fix routed_to_authority constraint with existing data

-- Step 1: Check what values currently exist
SELECT DISTINCT routed_to_authority 
FROM transport_requests 
WHERE routed_to_authority IS NOT NULL;

-- Step 2: Update any invalid values to NULL or valid values
-- (Run this if you see any invalid values from Step 1)
UPDATE transport_requests 
SET routed_to_authority = NULL 
WHERE routed_to_authority IS NOT NULL 
  AND routed_to_authority NOT IN ('REGISTRAR', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN');

-- Step 3: Drop the old constraint
ALTER TABLE transport_requests 
DROP CONSTRAINT IF EXISTS transport_requests_routed_to_authority_check;

-- Step 4: Add the new constraint
ALTER TABLE transport_requests 
ADD CONSTRAINT transport_requests_routed_to_authority_check 
CHECK (
  routed_to_authority IS NULL 
  OR routed_to_authority IN ('REGISTRAR', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN')
);

-- Step 5: Verify it worked
SELECT 
  constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'transport_requests'::regclass
  AND conname = 'transport_requests_routed_to_authority_check';
