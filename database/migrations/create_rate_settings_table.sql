-- Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS rate_settings CASCADE;

-- Create rate_settings table for storing transport rate configuration
CREATE TABLE rate_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  per_km_rate DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  base_rate DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  night_charge DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
  waiting_charge_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default rate settings
INSERT INTO rate_settings (per_km_rate, base_rate, night_charge, waiting_charge_per_hour)
VALUES (10.00, 500.00, 200.00, 100.00);

-- Enable RLS
ALTER TABLE rate_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read rate settings
CREATE POLICY "Anyone can read rate settings"
  ON rate_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy: Only admins can update rate settings
CREATE POLICY "Only admins can update rate settings"
  ON rate_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy: Only admins can insert rate settings
CREATE POLICY "Only admins can insert rate settings"
  ON rate_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE rate_settings IS 'Stores transport rate configuration including per km rate, base rate, night charges, and waiting charges';
