-- Check if vehicles table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
ORDER BY ordinal_position;

-- If table doesn't exist or has wrong structure, run this:

-- Drop and recreate vehicles table with correct structure
DROP TABLE IF EXISTS vehicles CASCADE;

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  capacity INTEGER,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies: Anyone authenticated can read
CREATE POLICY "Anyone can read vehicles"
  ON vehicles
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert vehicles
CREATE POLICY "Only admins can insert vehicles"
  ON vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can update vehicles
CREATE POLICY "Only admins can update vehicles"
  ON vehicles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can delete vehicles
CREATE POLICY "Only admins can delete vehicles"
  ON vehicles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert some sample vehicles
INSERT INTO vehicles (vehicle_number, vehicle_type, model, capacity, is_available)
VALUES 
  ('PB-01-AB-1234', 'Car', 'Toyota Innova', 7, true),
  ('PB-02-CD-5678', 'Bus', 'Tata Starbus', 40, true),
  ('PB-03-EF-9012', 'Van', 'Mahindra Bolero', 10, true)
ON CONFLICT (vehicle_number) DO NOTHING;

-- Add comment
COMMENT ON TABLE vehicles IS 'Stores vehicle information for transport management';
