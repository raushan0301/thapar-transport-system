# Head Approval Issue - Debugging Guide

## Problem
When a head user clicks the "Approve" button on a transport request, the approval is not being created successfully.

## Tools Created to Help Debug

### 1. SQL Diagnostic Script
**Location:** `/database/migrations/debug_and_fix_head_approval.sql`

This script helps you:
- Check if the head user exists and has the correct role
- View pending requests assigned to heads
- Examine RLS policies on the approvals table
- Test the `is_head()` function
- Check constraints on the approvals table
- Includes an improved RLS policy fix

**How to use:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of this file
4. Run the queries one by one to diagnose the issue
5. If needed, run the FIX section to update the RLS policy

### 2. Debug Page in Application
**Location:** `/client/src/pages/debug/DebugHeadApproval.jsx`
**URL:** `http://localhost:3000/debug/head-approval`

This page provides:
- Automated diagnostic tests
- Real-time error messages
- Test approval insertion functionality
- Detailed error information

**How to use:**
1. Log in as a head user
2. Navigate to `http://localhost:3000/debug/head-approval`
3. Click "Run Diagnostics" to check your setup
4. Review the test results
5. Click "Test Approval Insert" to try creating an approval
6. Check the error message to see exactly what's failing

## Common Issues and Solutions

### Issue 1: User Role Not Set Correctly
**Symptoms:** `is_head()` function returns false
**Solution:** 
```sql
-- Check user role
SELECT id, email, role FROM users WHERE email = 'your-head-email@example.com';

-- Fix if needed
UPDATE users SET role = 'head' WHERE email = 'your-head-email@example.com';
```

### Issue 2: Request Not Assigned to Head
**Symptoms:** Request doesn't appear in pending approvals
**Solution:**
```sql
-- Check request assignment
SELECT id, request_number, head_id, custom_head_email, current_status 
FROM transport_requests 
WHERE current_status = 'pending_head';

-- Fix if needed (replace with actual values)
UPDATE transport_requests 
SET custom_head_email = 'head@example.com'
WHERE id = 'request-id';
```

### Issue 3: RLS Policy Blocking Insert
**Symptoms:** Error message like "new row violates row-level security policy"
**Solution:** Run the improved RLS policy from the SQL script:
```sql
DROP POLICY IF EXISTS "Heads can create approvals" ON approvals;

CREATE POLICY "Heads can create approvals" ON approvals
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'head'
    )
    AND approver_id = auth.uid()
    AND approver_role = 'head'
    AND EXISTS (
      SELECT 1 FROM transport_requests 
      WHERE id = request_id 
      AND (
        head_id = auth.uid()
        OR
        custom_head_email IN (
          SELECT email FROM users WHERE id = auth.uid()
        )
      )
      AND current_status = 'pending_head'
    )
  );
```

### Issue 4: Missing or Incorrect approver_id
**Symptoms:** Error about approver_id constraint
**Solution:** Ensure the code is passing `user.id` correctly:
```javascript
const { error } = await supabase
  .from('approvals')
  .insert([{
    request_id: id,
    approver_id: user.id,  // Make sure user.id is correct
    approver_role: 'head',
    action: 'approved',
    comment: null,
    approved_at: new Date().toISOString(),
  }]);
```

## Step-by-Step Debugging Process

1. **Check Browser Console**
   - Open DevTools (F12)
   - Go to Console tab
   - Click the approve button
   - Look for error messages

2. **Use the Debug Page**
   - Navigate to `/debug/head-approval`
   - Run diagnostics
   - Review each test result
   - Note which tests fail

3. **Run SQL Diagnostics**
   - Open Supabase SQL Editor
   - Run the diagnostic queries
   - Check user role, request assignment, and policies

4. **Apply Fixes**
   - Based on the errors found, apply the appropriate fix
   - Test again using the debug page

5. **Verify the Fix**
   - Try approving a real request
   - Check that the approval is created
   - Verify the request status updates to 'pending_admin'

## Files Modified

1. `/client/src/pages/debug/DebugHeadApproval.jsx` - Debug component (NEW)
2. `/client/src/routes/AppRoutes.jsx` - Added debug route
3. `/database/migrations/debug_and_fix_head_approval.sql` - SQL diagnostic script (NEW)

## Next Steps

1. Access the debug page at `http://localhost:3000/debug/head-approval`
2. Run the diagnostics to identify the exact issue
3. Apply the appropriate fix based on the error message
4. Test the approval functionality again

## Need More Help?

If the issue persists after trying these steps:
1. Share the exact error message from the debug page
2. Share the results of the SQL diagnostic queries
3. Check the Supabase logs for more detailed error information
