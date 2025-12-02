# Database Schema Analysis - Thapar Transport System

**Analysis Date:** November 27, 2025  
**Database:** PostgreSQL (Supabase)  
**Schema Version:** 1.0

---

## 📋 Executive Summary

The database schema is **well-designed** with proper normalization, relationships, and constraints. However, there are several **critical security issues**, **missing policies**, and **optimization opportunities** that need to be addressed before production deployment.

**Overall Assessment:** 7/10 - Good foundation but needs security hardening and policy improvements.

---

## ✅ Strengths

### 1. **Good Table Design**
- Proper normalization (3NF)
- Appropriate use of UUIDs
- Foreign key constraints properly defined
- Check constraints for enum-like values
- Timestamps for audit trails

### 2. **Generated Columns**
- Smart use of `GENERATED ALWAYS AS` for calculated fields
- `total_km` automatically calculated
- `total_amount` automatically calculated
- Prevents data inconsistency

### 3. **Triggers & Functions**
- Auto-update `updated_at` timestamps
- Auto-generate request numbers with sequence
- Good use of PostgreSQL features

### 4. **Indexes**
- Key indexes on frequently queried columns
- Good query optimization foundation

### 5. **Sample Data**
- Helpful for development and testing
- Default rate settings provided

---

## 🚨 Critical Issues

### 1. **MAJOR SECURITY FLAW: Row Level Security Incomplete**

**Issue:** Many tables have RLS enabled but **NO policies for critical operations**

#### Missing Policies:

**Predefined Heads Table:**
```sql
-- ❌ NO INSERT policy - Admins can't add heads
-- ❌ NO UPDATE policy - Can't modify heads
-- ❌ NO DELETE policy - Can't remove heads
```

**Vehicles Table:**
```sql
-- ❌ NO INSERT policy - Admins can't add vehicles
-- ❌ NO UPDATE policy - Can't modify vehicles
-- ❌ NO DELETE policy - Can't remove vehicles
```

**Rate Settings Table:**
```sql
-- ❌ NO INSERT policy - Admins can't add rates
-- ❌ NO UPDATE policy - Can't modify rates
```

**Approvals Table:**
```sql
-- ❌ NO policies at all - Completely locked down
-- ❌ Heads/Admins can't create approvals
-- ❌ Users can't view approval history
```

**Travel Details Table:**
```sql
-- ❌ NO policies at all - Completely locked down
-- ❌ Admins can't fill travel details
-- ❌ Users can't view travel details
```

**Attachments Table:**
```sql
-- ❌ NO policies at all - Completely locked down
-- ❌ Users can't upload files
-- ❌ Users can't view attachments
```

**Audit Logs Table:**
```sql
-- ❌ NO policies at all - Completely locked down
-- ❌ System can't create audit logs
-- ❌ Admins can't view logs
```

**Impact:** 🔴 **CRITICAL** - Most features will not work because database operations will be denied by RLS.

---

### 2. **Transport Requests Policy Issues**

**Current Policy:**
```sql
CREATE POLICY "Heads can view assigned requests"
ON public.transport_requests
FOR SELECT
TO authenticated
USING (
  auth.email() = custom_head_email 
  OR 
  auth.uid() = head_id
);
```

**Problems:**

1. **Uses `auth.email()` instead of joining with users table**
   - `auth.email()` may not match `custom_head_email` format
   - No validation that the email belongs to an actual head
   - Security risk: Anyone can set any email

2. **Missing policies for other roles:**
   - ❌ Admins can't view requests
   - ❌ Authorities can't view requests
   - ❌ Registrars can't view requests
   - ❌ Heads can't update request status

3. **No policy for viewing all requests (admin dashboard)**

---

### 3. **Users Table Security Issue**

**Current Policy:**
```sql
CREATE POLICY "Service can insert users" ON public.users
  FOR INSERT WITH CHECK (true);
```

**Problem:** 
- `WITH CHECK (true)` allows **ANY** authenticated user to insert users
- Should be restricted to service role only
- Potential for privilege escalation

**Fix:**
```sql
-- Should use service role key, not allow all inserts
CREATE POLICY "Service can insert users" ON public.users
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'service_role');
```

---

### 4. **Missing Role-Based Access Control**

The schema has roles defined but **no helper functions** to check roles:

**Missing:**
```sql
-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

### 5. **No Soft Delete Implementation**

**Issue:** Tables use `is_active` but no policies prevent hard deletes

**Recommendation:**
- Add `deleted_at` timestamp column
- Implement soft delete triggers
- Filter out soft-deleted records in policies

---

## ⚠️ Moderate Issues

### 6. **Missing Composite Indexes**

**Current indexes are single-column only. Need composite indexes for common queries:**

```sql
-- Missing composite indexes
CREATE INDEX idx_transport_requests_user_status 
  ON public.transport_requests(user_id, current_status);

CREATE INDEX idx_transport_requests_head_status 
  ON public.transport_requests(head_id, current_status);

CREATE INDEX idx_notifications_user_read 
  ON public.notifications(user_id, is_read);

CREATE INDEX idx_approvals_request_approver 
  ON public.approvals(request_id, approver_id);

CREATE INDEX idx_transport_requests_date 
  ON public.transport_requests(date_of_visit);
```

---

### 7. **No Full-Text Search Indexes**

**Issue:** Searching through requests will be slow

**Recommendation:**
```sql
-- Add GIN index for full-text search
CREATE INDEX idx_transport_requests_search 
  ON public.transport_requests 
  USING GIN (to_tsvector('english', purpose || ' ' || place_of_visit));
```

---

### 8. **Missing Constraints**

**Email Validation:**
```sql
-- Add email format validation
ALTER TABLE public.users 
  ADD CONSTRAINT email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

**Phone Validation:**
```sql
-- Add phone format validation
ALTER TABLE public.users 
  ADD CONSTRAINT phone_format 
  CHECK (phone IS NULL OR phone ~* '^[0-9]{10}$');
```

**Date Validation:**
```sql
-- Prevent past dates for new requests
ALTER TABLE public.transport_requests 
  ADD CONSTRAINT future_date 
  CHECK (date_of_visit >= CURRENT_DATE);
```

**Meter Reading Validation:**
```sql
-- Ensure closing > opening
ALTER TABLE public.travel_details 
  ADD CONSTRAINT valid_meter_reading 
  CHECK (closing_meter > opening_meter);
```

---

### 9. **No Unique Constraint on Request Number Sequence**

**Issue:** Race condition possible in request number generation

**Fix:**
```sql
-- Add unique constraint (already exists in table definition, but good to verify)
-- Ensure sequence is properly locked during generation
```

---

### 10. **Missing Cascade Behaviors**

**Issue:** Some foreign keys don't specify ON UPDATE behavior

**Recommendation:**
```sql
-- Add ON UPDATE CASCADE where appropriate
ALTER TABLE public.transport_requests
  DROP CONSTRAINT transport_requests_vehicle_id_fkey,
  ADD CONSTRAINT transport_requests_vehicle_id_fkey
    FOREIGN KEY (vehicle_id) 
    REFERENCES public.vehicles(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
```

---

### 11. **No Partitioning Strategy**

**Issue:** As data grows, queries will slow down

**Recommendation:**
- Partition `transport_requests` by year
- Partition `audit_logs` by month
- Partition `notifications` by month

```sql
-- Example partitioning
CREATE TABLE transport_requests_2025 
  PARTITION OF transport_requests
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

### 12. **No Database-Level Audit Trail**

**Issue:** Changes to critical tables not automatically logged

**Recommendation:**
```sql
-- Add trigger to log all changes
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id, metadata
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER audit_transport_requests
  AFTER INSERT OR UPDATE OR DELETE ON transport_requests
  FOR EACH ROW EXECUTE FUNCTION log_changes();
```

---

## 🔍 Schema-Specific Issues

### Transport Requests Table

**Issues:**

1. **`routed_to_authority` allows 'none'**
   - Should be NULL instead of 'none' for better querying
   
2. **`is_editable` flag**
   - No trigger to automatically set to false after approval
   - Should be managed by business logic

3. **Missing `rejected_by` and `rejected_at` columns**
   - Can't easily track who rejected and when

4. **No `cancellation` support**
   - Users should be able to cancel pending requests

**Recommendations:**
```sql
ALTER TABLE public.transport_requests
  ADD COLUMN rejected_by UUID REFERENCES public.users(id),
  ADD COLUMN rejected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN cancelled_by UUID REFERENCES public.users(id),
  ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN cancellation_reason TEXT;

-- Add 'cancelled' to status check
ALTER TABLE public.transport_requests
  DROP CONSTRAINT transport_requests_current_status_check,
  ADD CONSTRAINT transport_requests_current_status_check
    CHECK (current_status IN (
      'pending_head', 'pending_admin', 'pending_authority', 
      'pending_registrar', 'approved_awaiting_vehicle', 
      'vehicle_assigned', 'travel_completed', 'closed', 
      'rejected', 'cancelled'
    ));
```

---

### Approvals Table

**Issues:**

1. **No `forwarded_to` column**
   - When action is 'forwarded', should track who it was forwarded to

2. **No approval order tracking**
   - Can't determine sequence of approvals

3. **IP address stored as TEXT**
   - Should use INET type for better validation

**Recommendations:**
```sql
ALTER TABLE public.approvals
  ADD COLUMN forwarded_to UUID REFERENCES public.users(id),
  ADD COLUMN approval_order INTEGER,
  ALTER COLUMN ip_address TYPE INET USING ip_address::INET;
```

---

### Notifications Table

**Issues:**

1. **No expiry mechanism**
   - Old notifications will accumulate

2. **No priority field**
   - All notifications treated equally

3. **No action URL**
   - Can't link to specific pages

**Recommendations:**
```sql
ALTER TABLE public.notifications
  ADD COLUMN priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  ADD COLUMN action_url TEXT,
  ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for cleanup
CREATE INDEX idx_notifications_expires 
  ON public.notifications(expires_at) 
  WHERE expires_at IS NOT NULL;
```

---

### Rate Settings Table

**Issues:**

1. **No validation for rate changes**
   - Rates could be set to negative or zero

2. **No audit trail for rate changes**
   - Can't see history of rate modifications

3. **`is_current` flag**
   - Should have trigger to ensure only one current rate

**Recommendations:**
```sql
-- Add rate validation
ALTER TABLE public.rate_settings
  ADD CONSTRAINT positive_rates CHECK (
    diesel_car_rate > 0 AND
    petrol_car_rate > 0 AND
    bus_student_rate > 0 AND
    bus_other_rate > 0 AND
    night_charge >= 0
  );

-- Trigger to ensure only one current rate
CREATE OR REPLACE FUNCTION ensure_single_current_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE rate_settings 
    SET is_current = false 
    WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER single_current_rate
  BEFORE INSERT OR UPDATE ON rate_settings
  FOR EACH ROW EXECUTE FUNCTION ensure_single_current_rate();
```

---

## 🎯 Complete RLS Policy Set (REQUIRED)

Here's the complete set of policies needed for the application to work:

```sql
-- ============================================
-- PREDEFINED HEADS POLICIES
-- ============================================
CREATE POLICY "Admins can manage heads" ON public.predefined_heads
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- VEHICLES POLICIES
-- ============================================
CREATE POLICY "Admins can manage vehicles" ON public.vehicles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- RATE SETTINGS POLICIES
-- ============================================
CREATE POLICY "Admins can manage rates" ON public.rate_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update rates" ON public.rate_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- TRANSPORT REQUESTS POLICIES (COMPLETE)
-- ============================================

-- Admins can view all requests
CREATE POLICY "Admins can view all requests" ON public.transport_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Authorities can view requests routed to them
CREATE POLICY "Authorities can view assigned requests" ON public.transport_requests
  FOR SELECT USING (
    routed_authority_id = auth.uid()
  );

-- Registrars can view requests in their stage
CREATE POLICY "Registrars can view pending requests" ON public.transport_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'registrar'
    )
    AND current_status = 'pending_registrar'
  );

-- Heads can update requests assigned to them
CREATE POLICY "Heads can update assigned requests" ON public.transport_requests
  FOR UPDATE USING (
    head_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND email = transport_requests.custom_head_email
    )
  );

-- Admins can update all requests
CREATE POLICY "Admins can update requests" ON public.transport_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- APPROVALS POLICIES
-- ============================================

-- Users can view approvals for their requests
CREATE POLICY "Users can view own request approvals" ON public.approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = approvals.request_id 
      AND user_id = auth.uid()
    )
  );

-- Approvers can view approvals they made
CREATE POLICY "Approvers can view own approvals" ON public.approvals
  FOR SELECT USING (approver_id = auth.uid());

-- Admins can view all approvals
CREATE POLICY "Admins can view all approvals" ON public.approvals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Heads can create approvals
CREATE POLICY "Heads can create approvals" ON public.approvals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'head')
    AND approver_id = auth.uid()
  );

-- Admins can create approvals
CREATE POLICY "Admins can create approvals" ON public.approvals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    AND approver_id = auth.uid()
  );

-- Authorities can create approvals
CREATE POLICY "Authorities can create approvals" ON public.approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('director', 'deputy_director', 'dean')
    )
    AND approver_id = auth.uid()
  );

-- Registrars can create approvals
CREATE POLICY "Registrars can create approvals" ON public.approvals
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'registrar')
    AND approver_id = auth.uid()
  );

-- ============================================
-- TRAVEL DETAILS POLICIES
-- ============================================

-- Users can view travel details for their requests
CREATE POLICY "Users can view own travel details" ON public.travel_details
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = travel_details.request_id 
      AND user_id = auth.uid()
    )
  );

-- Admins can manage all travel details
CREATE POLICY "Admins can manage travel details" ON public.travel_details
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- ATTACHMENTS POLICIES
-- ============================================

-- Users can view attachments for their requests
CREATE POLICY "Users can view own attachments" ON public.attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = attachments.request_id 
      AND user_id = auth.uid()
    )
  );

-- Users can upload attachments to their requests
CREATE POLICY "Users can upload attachments" ON public.attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transport_requests 
      WHERE id = request_id 
      AND user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments" ON public.attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments" ON public.attachments
  FOR DELETE USING (uploaded_by = auth.uid());

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
```

---

## 📊 Performance Optimization Recommendations

### 1. **Add Missing Indexes**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_requests_user_status ON transport_requests(user_id, current_status);
CREATE INDEX idx_requests_head_status ON transport_requests(head_id, current_status);
CREATE INDEX idx_requests_date_status ON transport_requests(date_of_visit, current_status);
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);

-- Partial indexes for active records
CREATE INDEX idx_active_vehicles ON vehicles(id) WHERE is_active = true;
CREATE INDEX idx_active_heads ON predefined_heads(user_id) WHERE is_active = true;
CREATE INDEX idx_unread_notifications ON notifications(user_id, created_at DESC) WHERE is_read = false;
```

### 2. **Add Materialized Views for Dashboards**
```sql
-- Dashboard statistics view
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT 
  user_id,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE current_status LIKE 'pending%') as pending_count,
  COUNT(*) FILTER (WHERE current_status = 'closed') as completed_count,
  COUNT(*) FILTER (WHERE current_status = 'rejected') as rejected_count
FROM transport_requests
GROUP BY user_id;

CREATE UNIQUE INDEX idx_dashboard_stats_user ON dashboard_stats(user_id);

-- Refresh strategy
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_stats_on_request_change
  AFTER INSERT OR UPDATE OR DELETE ON transport_requests
  FOR EACH STATEMENT EXECUTE FUNCTION refresh_dashboard_stats();
```

### 3. **Add Query Optimization Functions**
```sql
-- Function to get user's pending requests count
CREATE OR REPLACE FUNCTION get_pending_requests_count(user_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER 
  FROM transport_requests 
  WHERE user_id = user_uuid 
  AND current_status LIKE 'pending%';
$$ LANGUAGE SQL STABLE;
```

---

## 🔐 Security Hardening Checklist

- [ ] Add all missing RLS policies (see complete set above)
- [ ] Fix users table INSERT policy to use service role
- [ ] Add email format validation constraint
- [ ] Add phone format validation constraint
- [ ] Add date validation constraints
- [ ] Implement soft delete instead of hard delete
- [ ] Add audit triggers for critical tables
- [ ] Implement rate limiting at database level
- [ ] Add encryption for sensitive fields
- [ ] Review and test all policies with different roles
- [ ] Add database-level role checks
- [ ] Implement IP address logging for all changes
- [ ] Add session management

---

## 📈 Scalability Recommendations

1. **Implement Table Partitioning**
   - Partition by year for transport_requests
   - Partition by month for audit_logs and notifications

2. **Add Connection Pooling**
   - Configure PgBouncer
   - Set appropriate pool sizes

3. **Implement Caching Layer**
   - Cache rate settings
   - Cache active vehicles list
   - Cache user profiles

4. **Add Read Replicas**
   - For reporting and analytics
   - For dashboard queries

---

## 🎯 Priority Action Items

### Immediate (Critical)
1. ✅ Add all missing RLS policies
2. ✅ Fix users table INSERT policy
3. ✅ Add approvals policies
4. ✅ Add travel_details policies
5. ✅ Add attachments policies

### High Priority
6. Add missing indexes
7. Add validation constraints
8. Implement audit triggers
9. Add soft delete support
10. Test all policies with different roles

### Medium Priority
11. Add materialized views for dashboards
12. Implement partitioning strategy
13. Add full-text search indexes
14. Create helper functions for role checks

### Low Priority
15. Add database-level rate limiting
16. Implement encryption for sensitive fields
17. Add advanced analytics views

---

## 📝 Schema Quality Score

| Category | Score | Notes |
|----------|-------|-------|
| Table Design | 9/10 | Excellent normalization and structure |
| Constraints | 7/10 | Good but missing validation constraints |
| Indexes | 6/10 | Basic indexes present, missing composites |
| RLS Policies | 3/10 | **CRITICAL: Most policies missing** |
| Triggers | 8/10 | Good use of triggers |
| Performance | 6/10 | Needs optimization for scale |
| Security | 4/10 | **CRITICAL: Major security gaps** |
| Scalability | 5/10 | Needs partitioning and caching |

**Overall Score: 6/10** - Good foundation but critical security issues must be fixed immediately.

---

## 🚀 Conclusion

The database schema has a **solid foundation** with good table design, relationships, and use of PostgreSQL features. However, it has **critical security vulnerabilities** due to incomplete RLS policies that will prevent the application from functioning properly.

### Must Fix Before Production:
1. ✅ Add all missing RLS policies (approvals, travel_details, attachments, audit_logs)
2. ✅ Fix users table INSERT policy security issue
3. ✅ Add validation constraints for emails, phones, dates
4. ✅ Implement proper role-based access control
5. ✅ Add audit triggers for compliance

### Recommended Improvements:
- Add composite indexes for performance
- Implement materialized views for dashboards
- Add soft delete support
- Implement table partitioning for scalability

**Estimated Time to Fix Critical Issues:** 2-3 days  
**Estimated Time for All Improvements:** 1-2 weeks

---

**End of Database Schema Analysis**
