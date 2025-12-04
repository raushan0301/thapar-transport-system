# 🔧 FIX REGISTRAR STATUS - DATABASE UPDATE REQUIRED

## ❌ Current Error:
```
new row for relation "transport_requests" violates check constraint "transport_requests_current_status_check"
```

**Cause:** The database doesn't allow `'pending_registrar'` status.

---

## ✅ Solution:

### **Step 1: Run SQL Migration**

**Go to Supabase Dashboard:**
1. Open your Supabase project
2. Go to **SQL Editor**
3. Copy and paste the SQL from: `database/migrations/add_pending_registrar_status.sql`
4. Click **Run**

**Or copy this SQL directly:**

```sql
-- Add pending_registrar status to transport_requests check constraint

ALTER TABLE transport_requests DROP CONSTRAINT IF EXISTS transport_requests_current_status_check;

ALTER TABLE transport_requests ADD CONSTRAINT transport_requests_current_status_check 
CHECK (current_status IN (
  'draft',
  'pending_head',
  'pending_admin',
  'pending_authority',
  'pending_registrar',
  'approved_awaiting_vehicle',
  'pending_vehicle',
  'vehicle_assigned',
  'in_progress',
  'completed',
  'rejected',
  'cancelled'
));
```

---

### **Step 2: Test**

After running the SQL:
1. Go back to admin review page
2. Click "Route to Higher Authority"
3. Select "REGISTRAR"
4. ✅ **Should work now!**

---

## 📋 What This Does:

**Adds `'pending_registrar'` to allowed statuses:**
- ✅ `'pending_head'` - Waiting for head
- ✅ `'pending_admin'` - Waiting for admin
- ✅ `'pending_authority'` - Waiting for authority
- ✅ `'pending_registrar'` - Waiting for registrar ⭐ **NEW**
- ✅ `'approved_awaiting_vehicle'` - Approved, needs vehicle
- ✅ Other statuses...

---

## 🎯 Complete Workflow After Fix:

**Admin → Registrar → Vehicle Assignment:**
1. Admin routes to REGISTRAR
2. Status = `'pending_registrar'` ✅
3. Registrar sees request ✅
4. Registrar approves
5. Status = `'approved_awaiting_vehicle'` ✅
6. Admin assigns vehicle ✅

---

**Run the SQL migration in Supabase now!** 🚀
