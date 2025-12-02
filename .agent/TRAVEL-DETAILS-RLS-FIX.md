# 🔒 Travel Details RLS Error Fix

**Error:** `GET .../travel_details 406 (Not Acceptable)`  
**Date:** November 28, 2025, 2:48 PM IST  
**Status:** ⚠️ **REQUIRES DATABASE UPDATE**

---

## ❌ **Problem**

**Error Message:**
```
GET https://rplftoqbuzjjuyadxxbo.supabase.co/rest/v1/travel_details?select=*&request_id=eq.123df9dd-6668-4384-a1b1-59c1fed50c80 406 (Not Acceptable)
```

**Cause:**
- The `travel_details` table has RLS (Row Level Security) enabled
- Current policies only allow:
  - ✅ Users to view their own travel details
  - ✅ Admins to view all travel details
- Missing policies for:
  - ❌ Heads to view travel details
  - ❌ Authorities to view travel details  
  - ❌ Registrar to view travel details

---

## 🔧 **Solution**

### **Step 1: Run SQL in Supabase**

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the SQL from: `database/migrations/002_travel_details_rls_fix.sql`

**Quick Copy:**
```sql
-- Allow heads to view travel details for their requests
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

-- Allow authorities to view travel details
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
```

### **Step 2: Verify**

After running the SQL, verify the policies:

```sql
SELECT * FROM pg_policies WHERE tablename = 'travel_details';
```

You should see 8 policies total:
1. ✅ Users can view own travel details
2. ✅ Admins can view all travel details
3. ✅ Admins can insert travel details
4. ✅ Admins can update travel details
5. ✅ Admins can delete travel details
6. ✅ Heads can view travel details for their requests (NEW)
7. ✅ Authorities can view travel details for routed requests (NEW)
8. ✅ Registrar can view all travel details (NEW)

---

## 📊 **What This Fixes**

### **Before:**
- ❌ Heads can't see travel details
- ❌ Authorities can't see travel details
- ❌ Registrar can't see travel details
- ❌ 406 errors when viewing request details

### **After:**
- ✅ Heads can see travel details for their department's requests
- ✅ Authorities can see travel details for requests routed to them
- ✅ Registrar can see all travel details
- ✅ No more 406 errors

---

## 🎯 **Who Can Access Travel Details**

| Role | Access Level |
|------|--------------|
| User | Own requests only |
| Head | Department requests |
| Admin | All travel details |
| Authority | Routed requests |
| Registrar | All travel details |

---

## 🔍 **Why This Happened**

The original RLS migration (`001_fix_rls_policies.sql`) included basic policies for `travel_details`, but didn't account for all user roles that need to view this data.

**Original policies:**
- Users → own requests ✅
- Admins → all requests ✅

**Missing policies:**
- Heads → department requests ❌
- Authorities → routed requests ❌
- Registrar → all requests ❌

---

## ✅ **Testing**

After applying the fix:

1. **As Head:**
   - View a request from your department
   - Travel details should load ✅

2. **As Authority:**
   - View a request routed to you
   - Travel details should load ✅

3. **As Registrar:**
   - View any request
   - Travel details should load ✅

---

## 📝 **Files Created**

- ✅ `database/migrations/002_travel_details_rls_fix.sql`
- ✅ `.agent/TRAVEL-DETAILS-RLS-FIX.md` (this file)

---

## 🚨 **Important**

**This fix requires running SQL in Supabase!**

The frontend code is correct - this is a **database permission issue** that can only be fixed by updating the RLS policies in Supabase.

---

## 🎯 **Status**

```
✅ SQL script created
✅ Documentation complete
⏳ Waiting for database update
```

**Next Step:** Run the SQL in Supabase SQL Editor

---

**Created:** November 28, 2025, 2:48 PM IST  
**Priority:** High  
**Impact:** Affects all non-admin users viewing travel details
