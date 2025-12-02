-- ============================================
-- TRAVEL DETAILS RLS POLICY FIX
-- ============================================
-- This adds missing policies for heads, authorities, and registrar
-- to view travel details for requests they can access
-- ============================================

-- Allow heads to view travel details for requests they approved
CREATE POLICY "Heads can view travel details for their requests" ON public.travel_details
  FOR SELECT 
  USING (
    public.is_head()
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = travel_details.request_id 
      AND (
        custom_head_email = (SELECT email FROM public.users WHERE id = auth.uid())
        OR user_id IN (
          SELECT id FROM public.users 
          WHERE department = (SELECT department FROM public.users WHERE id = auth.uid())
        )
      )
    )
  );

-- Allow authorities to view travel details for requests routed to them
CREATE POLICY "Authorities can view travel details for routed requests" ON public.travel_details
  FOR SELECT 
  USING (
    public.is_authority()
    AND EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = travel_details.request_id 
      AND (
        routed_to_authority = (SELECT role FROM public.users WHERE id = auth.uid())
        OR current_status IN ('pending_authority', 'approved_awaiting_vehicle', 'vehicle_assigned', 'travel_completed', 'closed')
      )
    )
  );

-- Allow registrar to view all travel details
CREATE POLICY "Registrar can view all travel details" ON public.travel_details
  FOR SELECT 
  USING (public.is_registrar());

-- ============================================
-- VERIFICATION
-- ============================================
-- After running this, verify with:
-- SELECT * FROM pg_policies WHERE tablename = 'travel_details';
