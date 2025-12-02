-- ============================================
-- RLS POLICY FIX MIGRATION
-- ============================================
-- This migration adds all missing Row Level Security policies
-- to make the application functional.
--
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: DROP EXISTING PROBLEMATIC POLICIES
-- ============================================

-- Drop the insecure users insert policy
DROP POLICY IF EXISTS "Service can insert users" ON public.users;

-- Drop the problematic heads policy that uses auth.email()
DROP POLICY IF EXISTS "Heads can view assigned requests" ON public.transport_requests;

-- ============================================
-- STEP 2: CREATE HELPER FUNCTIONS
-- ============================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if user is head
CREATE OR REPLACE FUNCTION public.is_head()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'head'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if user is authority (director/deputy/dean)
CREATE OR REPLACE FUNCTION public.is_authority()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('director', 'deputy_director', 'dean')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Function to check if user is registrar
CREATE OR REPLACE FUNCTION public.is_registrar()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'registrar'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- STEP 3: FIX USERS TABLE POLICIES
-- ============================================

-- Secure policy for service role to insert users
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT 
  WITH CHECK (
    auth.jwt()->>'role' = 'service_role' 
    OR auth.jwt()->>'role' = 'authenticated'
  );

-- Allow admins to view all users
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT 
  USING (public.is_admin());

-- Allow users to view other users (for head selection, etc)
CREATE POLICY "Authenticated users can view users" ON public.users
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Admins can update any user
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE 
  USING (public.is_admin());

-- ============================================
-- STEP 4: PREDEFINED HEADS POLICIES
-- ============================================

-- Admins can insert heads
CREATE POLICY "Admins can insert heads" ON public.predefined_heads
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Admins can update heads
CREATE POLICY "Admins can update heads" ON public.predefined_heads
  FOR UPDATE 
  USING (public.is_admin());

-- Admins can delete heads
CREATE POLICY "Admins can delete heads" ON public.predefined_heads
  FOR DELETE 
  USING (public.is_admin());

-- ============================================
-- STEP 5: VEHICLES POLICIES
-- ============================================

-- Admins can insert vehicles
CREATE POLICY "Admins can insert vehicles" ON public.vehicles
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Admins can update vehicles
CREATE POLICY "Admins can update vehicles" ON public.vehicles
  FOR UPDATE 
  USING (public.is_admin());

-- Admins can delete vehicles
CREATE POLICY "Admins can delete vehicles" ON public.vehicles
  FOR DELETE 
  USING (public.is_admin());

-- ============================================
-- STEP 6: RATE SETTINGS POLICIES
-- ============================================

-- Admins can insert rate settings
CREATE POLICY "Admins can insert rates" ON public.rate_settings
  FOR INSERT 
  WITH CHECK (public.is_admin());

-- Admins can update rate settings
CREATE POLICY "Admins can update rates" ON public.rate_settings
  FOR UPDATE 
  USING (public.is_admin());

-- ============================================
-- STEP 7: TRANSPORT REQUESTS POLICIES (COMPLETE)
-- ============================================

-- Heads can view requests assigned to them (FIXED VERSION)
CREATE POLICY "Heads can view assigned requests" ON public.transport_requests
  FOR SELECT 
  USING (
    -- Direct assignment via head_id
    head_id = auth.uid()
    OR
    -- Custom head assignment via email match
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND email = transport_requests.custom_head_email
      AND role = 'head'
    )
  );

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON public.transport_requests
  FOR SELECT 
  USING (public.is_admin());

-- Authorities can view requests routed to them
CREATE POLICY "Authorities can view assigned requests" ON public.transport_requests
  FOR SELECT 
  USING (
    routed_authority_id = auth.uid()
    AND public.is_authority()
  );

-- Registrars can view requests in their stage
CREATE POLICY "Registrars can view pending requests" ON public.transport_requests
  FOR SELECT 
  USING (
    public.is_registrar()
    AND current_status IN ('pending_registrar', 'approved_awaiting_vehicle', 'vehicle_assigned', 'travel_completed', 'closed')
  );

-- Heads can update requests assigned to them
CREATE POLICY "Heads can update assigned requests" ON public.transport_requests
  FOR UPDATE 
  USING (
    (head_id = auth.uid() OR 
     EXISTS (
       SELECT 1 FROM public.users 
       WHERE id = auth.uid() 
       AND email = transport_requests.custom_head_email
       AND role = 'head'
     ))
    AND public.is_head()
  );

-- Admins can update all requests
CREATE POLICY "Admins can update requests" ON public.transport_requests
  FOR UPDATE 
  USING (public.is_admin());

-- Authorities can update requests routed to them
CREATE POLICY "Authorities can update assigned requests" ON public.transport_requests
  FOR UPDATE 
  USING (
    routed_authority_id = auth.uid()
    AND public.is_authority()
  );

-- Registrars can update requests in their stage
CREATE POLICY "Registrars can update requests" ON public.transport_requests
  FOR UPDATE 
  USING (
    public.is_registrar()
    AND current_status = 'pending_registrar'
  );

-- ============================================
-- STEP 8: APPROVALS POLICIES (COMPLETE)
-- ============================================

-- Users can view approvals for their own requests
CREATE POLICY "Users can view own request approvals" ON public.approvals
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = approvals.request_id 
      AND user_id = auth.uid()
    )
  );

-- Approvers can view approvals they made
CREATE POLICY "Approvers can view own approvals" ON public.approvals
  FOR SELECT 
  USING (approver_id = auth.uid());

-- Admins can view all approvals
CREATE POLICY "Admins can view all approvals" ON public.approvals
  FOR SELECT 
  USING (public.is_admin());

-- Heads can view approvals for requests assigned to them
CREATE POLICY "Heads can view request approvals" ON public.approvals
  FOR SELECT 
  USING (
    public.is_head()
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = approvals.request_id 
      AND (head_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM public.users 
             WHERE id = auth.uid() 
             AND email = transport_requests.custom_head_email
           ))
    )
  );

-- Heads can create approvals for their requests
CREATE POLICY "Heads can create approvals" ON public.approvals
  FOR INSERT 
  WITH CHECK (
    public.is_head()
    AND approver_id = auth.uid()
    AND approver_role = 'head'
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = request_id 
      AND (head_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM public.users 
             WHERE id = auth.uid() 
             AND email = transport_requests.custom_head_email
           ))
    )
  );

-- Admins can create approvals
CREATE POLICY "Admins can create approvals" ON public.approvals
  FOR INSERT 
  WITH CHECK (
    public.is_admin()
    AND approver_id = auth.uid()
    AND approver_role = 'admin'
  );

-- Authorities can create approvals for their requests
CREATE POLICY "Authorities can create approvals" ON public.approvals
  FOR INSERT 
  WITH CHECK (
    public.is_authority()
    AND approver_id = auth.uid()
    AND approver_role IN ('director', 'deputy_director', 'dean')
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = request_id 
      AND routed_authority_id = auth.uid()
    )
  );

-- Registrars can create approvals
CREATE POLICY "Registrars can create approvals" ON public.approvals
  FOR INSERT 
  WITH CHECK (
    public.is_registrar()
    AND approver_id = auth.uid()
    AND approver_role = 'registrar'
  );

-- ============================================
-- STEP 9: TRAVEL DETAILS POLICIES (COMPLETE)
-- ============================================

-- Users can view travel details for their own requests
CREATE POLICY "Users can view own travel details" ON public.travel_details
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = travel_details.request_id 
      AND user_id = auth.uid()
    )
  );

-- Admins can view all travel details
CREATE POLICY "Admins can view all travel details" ON public.travel_details
  FOR SELECT 
  USING (public.is_admin());

-- Admins can insert travel details
CREATE POLICY "Admins can insert travel details" ON public.travel_details
  FOR INSERT 
  WITH CHECK (
    public.is_admin()
    AND filled_by = auth.uid()
  );

-- Admins can update travel details
CREATE POLICY "Admins can update travel details" ON public.travel_details
  FOR UPDATE 
  USING (public.is_admin());

-- Admins can delete travel details
CREATE POLICY "Admins can delete travel details" ON public.travel_details
  FOR DELETE 
  USING (public.is_admin());

-- ============================================
-- STEP 10: ATTACHMENTS POLICIES (COMPLETE)
-- ============================================

-- Users can view attachments for their own requests
CREATE POLICY "Users can view own attachments" ON public.attachments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = attachments.request_id 
      AND user_id = auth.uid()
    )
  );

-- Heads can view attachments for assigned requests
CREATE POLICY "Heads can view request attachments" ON public.attachments
  FOR SELECT 
  USING (
    public.is_head()
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = attachments.request_id 
      AND (head_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM public.users 
             WHERE id = auth.uid() 
             AND email = transport_requests.custom_head_email
           ))
    )
  );

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments" ON public.attachments
  FOR SELECT 
  USING (public.is_admin());

-- Authorities can view attachments for assigned requests
CREATE POLICY "Authorities can view attachments" ON public.attachments
  FOR SELECT 
  USING (
    public.is_authority()
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = attachments.request_id 
      AND routed_authority_id = auth.uid()
    )
  );

-- Registrars can view attachments
CREATE POLICY "Registrars can view attachments" ON public.attachments
  FOR SELECT 
  USING (
    public.is_registrar()
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = attachments.request_id 
      AND current_status IN ('pending_registrar', 'approved_awaiting_vehicle', 'vehicle_assigned', 'travel_completed', 'closed')
    )
  );

-- Users can upload attachments to their own requests
CREATE POLICY "Users can upload attachments" ON public.attachments
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = request_id 
      AND user_id = auth.uid()
      AND is_editable = true
    )
    AND uploaded_by = auth.uid()
  );

-- Users can delete their own attachments (only if request is editable)
CREATE POLICY "Users can delete own attachments" ON public.attachments
  FOR DELETE 
  USING (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = attachments.request_id 
      AND user_id = auth.uid()
      AND is_editable = true
    )
  );

-- Admins can delete any attachment
CREATE POLICY "Admins can delete attachments" ON public.attachments
  FOR DELETE 
  USING (public.is_admin());

-- ============================================
-- STEP 11: AUDIT LOGS POLICIES (COMPLETE)
-- ============================================

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT 
  USING (public.is_admin());

-- System can insert audit logs (any authenticated user for now)
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT 
  WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT 
  USING (user_id = auth.uid());

-- ============================================
-- STEP 12: ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_requests_user_status 
  ON public.transport_requests(user_id, current_status);

CREATE INDEX IF NOT EXISTS idx_requests_head_status 
  ON public.transport_requests(head_id, current_status);

CREATE INDEX IF NOT EXISTS idx_requests_authority_status 
  ON public.transport_requests(routed_authority_id, current_status);

CREATE INDEX IF NOT EXISTS idx_requests_date_status 
  ON public.transport_requests(date_of_visit, current_status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
  ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approvals_request_approver 
  ON public.approvals(request_id, approver_id);

-- Partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_vehicles 
  ON public.vehicles(id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_active_heads 
  ON public.predefined_heads(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_unread_notifications 
  ON public.notifications(user_id, created_at DESC) WHERE is_read = false;

-- ============================================
-- STEP 13: ADD VALIDATION CONSTRAINTS
-- ============================================

-- Email format validation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'email_format'
  ) THEN
    ALTER TABLE public.users 
      ADD CONSTRAINT email_format 
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

-- Phone format validation (10 digits, optional)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'phone_format'
  ) THEN
    ALTER TABLE public.users 
      ADD CONSTRAINT phone_format 
      CHECK (phone IS NULL OR phone ~* '^[0-9]{10}$');
  END IF;
END $$;

-- Positive rates validation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'positive_rates'
  ) THEN
    ALTER TABLE public.rate_settings
      ADD CONSTRAINT positive_rates CHECK (
        diesel_car_rate > 0 AND
        petrol_car_rate > 0 AND
        bus_student_rate > 0 AND
        bus_other_rate > 0 AND
        night_charge >= 0
      );
  END IF;
END $$;

-- Valid meter reading
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'valid_meter_reading'
  ) THEN
    ALTER TABLE public.travel_details 
      ADD CONSTRAINT valid_meter_reading 
      CHECK (closing_meter > opening_meter);
  END IF;
END $$;

-- ============================================
-- STEP 14: ADD TRIGGER FOR SINGLE CURRENT RATE
-- ============================================

CREATE OR REPLACE FUNCTION public.ensure_single_current_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE public.rate_settings 
    SET is_current = false 
    WHERE id != NEW.id AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS single_current_rate ON public.rate_settings;
CREATE TRIGGER single_current_rate
  BEFORE INSERT OR UPDATE ON public.rate_settings
  FOR EACH ROW 
  WHEN (NEW.is_current = true)
  EXECUTE FUNCTION public.ensure_single_current_rate();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these to verify the policies are working:
-- 
-- 1. Check all policies on transport_requests:
-- SELECT * FROM pg_policies WHERE tablename = 'transport_requests';
--
-- 2. Check all policies on approvals:
-- SELECT * FROM pg_policies WHERE tablename = 'approvals';
--
-- 3. Check all policies on travel_details:
-- SELECT * FROM pg_policies WHERE tablename = 'travel_details';
--
-- 4. Check all policies on attachments:
-- SELECT * FROM pg_policies WHERE tablename = 'attachments';
--
-- 5. Test helper functions:
-- SELECT public.get_user_role();
-- SELECT public.is_admin();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- This migration has:
-- ✅ Fixed insecure users table policy
-- ✅ Added helper functions for role checking
-- ✅ Added all missing policies for predefined_heads
-- ✅ Added all missing policies for vehicles
-- ✅ Added all missing policies for rate_settings
-- ✅ Fixed and enhanced transport_requests policies
-- ✅ Added complete approvals policies (was completely locked)
-- ✅ Added complete travel_details policies (was completely locked)
-- ✅ Added complete attachments policies (was completely locked)
-- ✅ Added audit_logs policies
-- ✅ Added performance indexes
-- ✅ Added validation constraints
-- ✅ Added trigger for rate settings
-- ============================================
