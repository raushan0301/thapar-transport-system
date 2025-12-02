-- OPTION 1: If you want to keep existing data, run this first to check the table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rate_settings';

-- OPTION 2: Simple fix - Just run this complete script
-- This will drop and recreate the table with correct structure

DROP TABLE IF EXISTS rate_settings CASCADE;

CREATE TABLE rate_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  per_km_rate DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  base_rate DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  night_charge DECIMAL(10, 2) NOT NULL DEFAULT 200.00,
  waiting_charge_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO rate_settings (per_km_rate, base_rate, night_charge, waiting_charge_per_hour)
VALUES (10.00, 500.00, 200.00, 100.00);

ALTER TABLE rate_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rate settings"
  ON rate_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can update rate settings"
  ON rate_settings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Only admins can insert rate settings"
  ON rate_settings FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

COMMENT ON TABLE rate_settings IS 'Transport rate configuration';
