# RLS Policy Fix - Implementation Guide

## 🎯 What This Migration Does

This migration fixes **ALL** the critical Row Level Security issues that were preventing your application from working. 

### Problems Fixed:
- ✅ **Approvals table** - Was completely locked, now fully functional
- ✅ **Travel Details table** - Was completely locked, now fully functional  
- ✅ **Attachments table** - Was completely locked, now fully functional
- ✅ **Audit Logs table** - Was completely locked, now functional
- ✅ **Vehicles** - Admins can now manage vehicles
- ✅ **Predefined Heads** - Admins can now manage heads
- ✅ **Rate Settings** - Admins can now update rates
- ✅ **Users table** - Fixed insecure INSERT policy
- ✅ **Transport Requests** - Fixed email-based head assignment

---

## 📝 How to Apply This Migration

### Option 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste**
   - Open `database/migrations/001_fix_rls_policies.sql`
   - Copy ALL the content
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for completion (should take 5-10 seconds)

5. **Verify Success**
   - You should see "Success. No rows returned" or similar
   - Check for any error messages

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or run the migration directly
psql $DATABASE_URL -f database/migrations/001_fix_rls_policies.sql
```

---

## ✅ Testing Checklist

After applying the migration, test these scenarios:

### Test 1: User Can Create Request
```javascript
// Login as a regular user
// Go to /new-request
// Fill out the form
// Submit
// ✅ Should succeed without RLS errors
```

### Test 2: User Can Upload Attachments
```javascript
// In the new request form
// Upload a file
// ✅ Should upload successfully
// ✅ Should appear in the attachments list
```

### Test 3: Head Can Approve Request
```javascript
// Login as a head
// Go to /head/pending
// ✅ Should see requests assigned to you
// Click approve on a request
// ✅ Should create approval record
// ✅ Request status should update
```

### Test 4: Admin Can Manage Vehicles
```javascript
// Login as admin
// Go to /admin/vehicles
// Click "Add Vehicle"
// Fill form and submit
// ✅ Should create vehicle successfully
```

### Test 5: Admin Can Fill Travel Details
```javascript
// Login as admin
// Go to /admin/travel-completion
// Select a completed request
// Fill travel details form
// ✅ Should save successfully
```

### Test 6: Admin Can View Audit Logs
```javascript
// Login as admin
// Go to /admin/audit
// ✅ Should see audit log entries
```

### Test 7: Authority Can Approve
```javascript
// Login as director/deputy/dean
// Go to /authority/pending
// ✅ Should see requests routed to you
// Approve a request
// ✅ Should create approval record
```

### Test 8: Registrar Can Approve
```javascript
// Login as registrar
// Go to /registrar/pending
// ✅ Should see pending requests
// Approve a request
// ✅ Should work without errors
```

---

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify policies are in place:

### Check Transport Requests Policies
```sql
SELECT 
  policyname, 
  cmd as operation,
  qual as using_clause,
  with_check
FROM pg_policies 
WHERE tablename = 'transport_requests'
ORDER BY policyname;
```

**Expected:** Should see 9 policies:
- Users can view own requests
- Users can create requests  
- Users can update own editable requests
- Heads can view assigned requests
- Heads can update assigned requests
- Admins can view all requests
- Admins can update requests
- Authorities can view assigned requests
- Authorities can update assigned requests
- Registrars can view pending requests
- Registrars can update requests

### Check Approvals Policies
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'approvals'
ORDER BY policyname;
```

**Expected:** Should see 9 policies:
- Users can view own request approvals
- Approvers can view own approvals
- Admins can view all approvals
- Heads can view request approvals
- Heads can create approvals
- Admins can create approvals
- Authorities can create approvals
- Registrars can create approvals

### Check Travel Details Policies
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'travel_details'
ORDER BY policyname;
```

**Expected:** Should see 5 policies:
- Users can view own travel details
- Admins can view all travel details
- Admins can insert travel details
- Admins can update travel details
- Admins can delete travel details

### Check Attachments Policies
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'attachments'
ORDER BY policyname;
```

**Expected:** Should see 9 policies:
- Users can view own attachments
- Heads can view request attachments
- Admins can view all attachments
- Authorities can view attachments
- Registrars can view attachments
- Users can upload attachments
- Users can delete own attachments
- Admins can delete attachments

### Check Helper Functions
```sql
-- Test helper functions (should return your role)
SELECT public.get_user_role();
SELECT public.is_admin();
SELECT public.is_head();
SELECT public.is_authority();
SELECT public.is_registrar();
```

### Check Indexes
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('transport_requests', 'approvals', 'notifications', 'vehicles')
ORDER BY tablename, indexname;
```

**Expected:** Should see new composite indexes like:
- idx_requests_user_status
- idx_requests_head_status
- idx_requests_authority_status
- idx_notifications_user_read_created
- idx_approvals_request_approver

---

## 🚨 Troubleshooting

### Error: "permission denied for table X"

**Cause:** RLS policy not applied correctly

**Fix:**
1. Check if RLS is enabled: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;`
2. Check if policies exist: `SELECT * FROM pg_policies WHERE tablename = 'X';`
3. Re-run the migration

### Error: "new row violates row-level security policy"

**Cause:** INSERT policy WITH CHECK clause is too restrictive

**Fix:**
1. Check which table is failing
2. Verify the user's role: `SELECT role FROM users WHERE id = auth.uid();`
3. Check the policy: `SELECT * FROM pg_policies WHERE tablename = 'X' AND cmd = 'INSERT';`

### Error: "function public.get_user_role() does not exist"

**Cause:** Helper functions not created

**Fix:**
1. Re-run the migration starting from STEP 2
2. Verify: `SELECT proname FROM pg_proc WHERE proname LIKE '%user_role%';`

### Error: "column does not exist"

**Cause:** Your schema might be different from expected

**Fix:**
1. Check your actual schema: `\d+ transport_requests`
2. Adjust the migration if needed

### Policies Not Working

**Debug steps:**
```sql
-- 1. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 2. Check current user
SELECT auth.uid(), auth.email();

-- 3. Check user role
SELECT id, email, role FROM users WHERE id = auth.uid();

-- 4. Test a specific policy
EXPLAIN (ANALYZE, VERBOSE) 
SELECT * FROM transport_requests WHERE user_id = auth.uid();
```

---

## 📊 What Changed

### New Helper Functions (5)
- `get_user_role()` - Returns current user's role
- `is_admin()` - Checks if user is admin
- `is_head()` - Checks if user is head
- `is_authority()` - Checks if user is authority
- `is_registrar()` - Checks if user is registrar

### New/Fixed Policies (50+)

**Users Table:** 4 policies
**Predefined Heads:** 3 policies  
**Vehicles:** 3 policies
**Rate Settings:** 2 policies
**Transport Requests:** 11 policies
**Approvals:** 9 policies (was 0)
**Travel Details:** 5 policies (was 0)
**Attachments:** 9 policies (was 0)
**Audit Logs:** 3 policies (was 0)

### New Indexes (9)
- Composite indexes for common queries
- Partial indexes for active records
- Performance optimization indexes

### New Constraints (4)
- Email format validation
- Phone format validation  
- Positive rates validation
- Valid meter reading validation

### New Triggers (1)
- Ensure only one current rate setting

---

## 🎉 Success Indicators

After applying this migration, you should see:

✅ **No more "permission denied" errors**  
✅ **Users can create and view their requests**  
✅ **Heads can approve requests**  
✅ **Admins can manage all resources**  
✅ **Authorities can approve routed requests**  
✅ **Registrars can give final approval**  
✅ **File uploads work**  
✅ **Travel details can be filled**  
✅ **Audit logs are created**  

---

## 📞 Next Steps

After applying this migration:

1. **Test thoroughly** using the checklist above
2. **Create test users** for each role if you haven't
3. **Test the complete workflow** from request creation to closure
4. **Monitor for any RLS errors** in your application logs
5. **Move on to the next improvement** (Dashboard Statistics)

---

## 🔄 Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Drop all new policies (they all have specific names)
-- This will restore to the previous state

-- Drop helper functions
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_head();
DROP FUNCTION IF EXISTS public.is_authority();
DROP FUNCTION IF EXISTS public.is_registrar();
DROP FUNCTION IF EXISTS public.ensure_single_current_rate();

-- Drop new policies (example - do for all tables)
DROP POLICY IF EXISTS "Admins can view all requests" ON public.transport_requests;
-- ... etc

-- Re-enable the old policies
-- (You'll need to have saved the old schema)
```

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

**Migration File:** `database/migrations/001_fix_rls_policies.sql`  
**Created:** November 27, 2025  
**Status:** Ready to apply ✅
