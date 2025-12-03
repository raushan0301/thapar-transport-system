-- Add travel completion fields to transport_requests table

-- Add columns for travel completion
ALTER TABLE transport_requests 
ADD COLUMN IF NOT EXISTS opening_meter INTEGER,
ADD COLUMN IF NOT EXISTS closing_meter INTEGER,
ADD COLUMN IF NOT EXISTS total_distance INTEGER,
ADD COLUMN IF NOT EXISTS rate_per_km DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS trip_type VARCHAR(20) CHECK (trip_type IN ('official', 'private')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add comments
COMMENT ON COLUMN transport_requests.opening_meter IS 'Opening meter reading in kilometers';
COMMENT ON COLUMN transport_requests.closing_meter IS 'Closing meter reading in kilometers';
COMMENT ON COLUMN transport_requests.total_distance IS 'Total distance traveled (closing - opening)';
COMMENT ON COLUMN transport_requests.rate_per_km IS 'Rate per kilometer in rupees';
COMMENT ON COLUMN transport_requests.total_amount IS 'Total amount (distance * rate)';
COMMENT ON COLUMN transport_requests.trip_type IS 'Type of trip: official or private';
COMMENT ON COLUMN transport_requests.completed_at IS 'Timestamp when trip was completed';
