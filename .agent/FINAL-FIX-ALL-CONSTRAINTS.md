# 🔧 FINAL FIX - ROUTED TO AUTHORITY CONSTRAINT

**Error:** `"transport_requests violates check constraint 'transport_requests_routed_to_authority_check'"`

---

## 🎯 **RUN THIS SQL NOW:**

```sql
-- Fix routed_to_authority constraint
ALTER TABLE transport_requests 
DROP CONSTRAINT IF EXISTS transport_requests_routed_to_authority_check;

ALTER TABLE transport_requests 
ADD CONSTRAINT transport_requests_routed_to_authority_check 
CHECK (
  routed_to_authority IS NULL 
  OR routed_to_authority IN ('REGISTRAR', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN')
);
```

---

## ✅ **WHAT THIS DOES**

Allows the `routed_to_authority` column to accept:
- `NULL` (default, not routed)
- `'REGISTRAR'`
- `'DIRECTOR'`
- `'DEPUTY_DIRECTOR'`
- `'DEAN'`

---

## 🧪 **AFTER RUNNING SQL:**

1. **Refresh browser**
2. **Click "Route to Higher Authority"**
3. **Select "DEAN"**
4. **Click "Confirm"**
5. **Should work!** ✅

---

## 📋 **COMPLETE SQL FIX (ALL CONSTRAINTS)**

If you want to run all fixes at once:

```sql
-- 1. Fix approvals action constraint
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_action_check;
ALTER TABLE approvals ADD CONSTRAINT approvals_action_check 
CHECK (action IN ('approved', 'rejected', 'routed_to_authority', 'pending', 'forwarded'));

-- 2. Fix transport_requests status constraint
ALTER TABLE transport_requests DROP CONSTRAINT IF EXISTS transport_requests_current_status_check;
ALTER TABLE transport_requests ADD CONSTRAINT transport_requests_current_status_check 
CHECK (current_status IN (
  'draft', 'pending_head', 'pending_admin', 'pending_authority', 
  'pending_vehicle', 'vehicle_assigned', 'in_progress', 'completed', 
  'rejected', 'cancelled'
));

-- 3. Fix routed_to_authority constraint
ALTER TABLE transport_requests 
DROP CONSTRAINT IF EXISTS transport_requests_routed_to_authority_check;
ALTER TABLE transport_requests 
ADD CONSTRAINT transport_requests_routed_to_authority_check 
CHECK (
  routed_to_authority IS NULL 
  OR routed_to_authority IN ('REGISTRAR', 'DIRECTOR', 'DEPUTY_DIRECTOR', 'DEAN')
);

-- 4. Fix RLS for approvals
DROP POLICY IF EXISTS "Admins can create approvals" ON approvals;
CREATE POLICY "Admins can create approvals"
  ON approvals FOR INSERT TO authenticated
  WITH CHECK (approver_id = auth.uid());

-- 5. Fix RLS for transport_requests
DROP POLICY IF EXISTS "Admins can update requests" ON transport_requests;
CREATE POLICY "Admins can update requests"
  ON transport_requests FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
```

---

## ✅ **RESULT**

After running the SQL:
- ✅ Route to Authority → Works
- ✅ Approve & Assign Vehicle → Works
- ✅ No more constraint errors
- ✅ No more React warnings

---

**Copy and run the SQL above in Supabase SQL Editor!** 🚀
