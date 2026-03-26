-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    license_number TEXT NOT NULL,
    license_expiry DATE,
    assigned_vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    is_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Admins get full access
CREATE POLICY "Admins have full access to drivers" 
ON public.drivers
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Everyone can view drivers (for vehicle assignment dropdowns etc)
CREATE POLICY "Everyone can view drivers" 
ON public.drivers
FOR SELECT 
TO authenticated 
USING (true);

-- Also add a driver_id to transport_requests to link properly if desired,
-- though existing driver_name/contact might just be overwritten depending on how VehicleAssignment works.
ALTER TABLE public.transport_requests 
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL;
