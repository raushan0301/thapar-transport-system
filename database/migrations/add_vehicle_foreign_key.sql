-- FIX: Add missing foreign key relationship between transport_requests and vehicles

-- 1. First, check if vehicle_id column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transport_requests' 
AND column_name = 'vehicle_id';

-- 2. If vehicle_id doesn't exist, add it
ALTER TABLE transport_requests 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);

-- 3. Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'transport_requests_vehicle_id_fkey'
  ) THEN
    ALTER TABLE transport_requests
    ADD CONSTRAINT transport_requests_vehicle_id_fkey
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);
  END IF;
END $$;

-- 4. Verify the relationship was created
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'transport_requests'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'vehicles';
