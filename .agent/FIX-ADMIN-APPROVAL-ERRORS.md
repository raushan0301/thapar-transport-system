# 🔧 FIX ADMIN APPROVAL ERRORS

**Errors:**
1. ❌ "approvals violates check constraint 'approvals_action_check'"
2. ❌ "transport_requests violates check constraint 'transport_requests_current_status_check'"

---

## 🎯 **QUICK FIX - RUN THESE SQL COMMANDS**

### **Step 1: Fix Approvals Action Constraint**

```sql
-- Allow 'routed_to_authority' action
ALTER TABLE approvals DROP CONSTRAINT IF EXISTS approvals_action_check;

ALTER TABLE approvals ADD CONSTRAINT approvals_action_check 
CHECK (action IN ('approved', 'rejected', 'routed_to_authority', 'pending', 'forwarded'));
```

---

### **Step 2: Fix Transport Requests Status Constraint**

```sql
-- Allow 'pending_vehicle' and 'pending_authority' statuses
ALTER TABLE transport_requests DROP CONSTRAINT IF EXISTS transport_requests_current_status_check;

ALTER TABLE transport_requests ADD CONSTRAINT transport_requests_current_status_check 
CHECK (current_status IN (
  'draft',
  'pending_head',
  'pending_admin',
  'pending_authority',
  'pending_vehicle',
  'vehicle_assigned',
  'in_progress',
  'completed',
  'rejected',
  'cancelled'
));
```

---

### **Step 3: Fix RLS Policy for Approvals**

```sql
-- Allow admins to insert approvals
DROP POLICY IF EXISTS "Admins can create approvals" ON approvals;

CREATE POLICY "Admins can create approvals"
  ON approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    approver_id = auth.uid()
  );
```

---

### **Step 4: Fix RLS Policy for Transport Requests**

```sql
-- Allow admins to update requests
DROP POLICY IF EXISTS "Admins can update requests" ON transport_requests;

CREATE POLICY "Admins can update requests"
  ON transport_requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## ✅ **AFTER RUNNING SQL**

1. **Refresh your browser**
2. **Try "Route to Authority" again**
3. **Try "Approve & Assign Vehicle" again**
4. **Should work!** ✅

---

## 🔍 **WHAT WAS WRONG**

### **Problem 1: Missing Action**
The `approvals` table had a check constraint that only allowed:
- `approved`
- `rejected`

But we're trying to insert:
- `routed_to_authority` ❌ (not allowed)

### **Problem 2: Missing Status**
The `transport_requests` table had a check constraint that didn't include:
- `pending_vehicle` ❌
- `pending_authority` ❌

---

## 📊 **ALLOWED VALUES AFTER FIX**

### **Approvals Actions:**
- ✅ `approved`
- ✅ `rejected`
- ✅ `routed_to_authority` (NEW)
- ✅ `pending`
- ✅ `forwarded`

### **Request Statuses:**
- ✅ `draft`
- ✅ `pending_head`
- ✅ `pending_admin`
- ✅ `pending_authority` (NEW)
- ✅ `pending_vehicle` (NEW)
- ✅ `vehicle_assigned`
- ✅ `in_progress`
- ✅ `completed`
- ✅ `rejected`
- ✅ `cancelled`

---

**Run the SQL above in Supabase SQL Editor, then try again!** 🚀
