# How to Debug the Approve Button Issue

## What I Just Did

I added detailed console logging to the `handleApprove` function in `/client/src/pages/head/ReviewRequest.jsx`.

Now when you click the approve button, you'll see detailed logs in the browser console showing exactly where it fails.

## Steps to Debug

### 1. Open Browser Console
- Press `F12` or `Right-click` → `Inspect` → `Console` tab
- Keep the console open

### 2. Navigate to a Pending Request
- Go to `http://localhost:3000/head/pending`
- Click on a request to review it
- You should be on `/head/review/{request-id}`

### 3. Click the Approve Button
- Click the green "Approve" button
- Confirm the approval in the popup

### 4. Check the Console Output

You should see logs like this:

```
🔵 Approve button clicked
User ID: d803c755-3574-4839-9579-77d04270925d
Request ID: 68f146b1-c1b6-4953-ac0f-bc76d36a56a1
✅ User confirmed approval
📝 Attempting to insert approval record...
```

Then EITHER:

**SUCCESS:**
```
✅ Approval record created: [...]
Request approved successfully!
```

**OR FAILURE:**
```
❌ Approval insert error: {...}
Error details: {...}
❌ APPROVAL FAILED: {...}
```

### 5. Copy the Error Details

If you see an error, copy the ENTIRE error message from the console, especially:
- The "Error details" JSON object
- Any error messages
- The error code and hint

### 6. Send Me the Error

Send me the complete console output, and I'll tell you exactly what's wrong and how to fix it.

## Common Errors and What They Mean

### Error: "new row violates row-level security policy"
**Cause:** RLS policy is blocking the insert  
**Fix:** Run the RLS policy fix SQL script

### Error: "violates foreign key constraint"
**Cause:** The request_id or approver_id doesn't exist  
**Fix:** Check that the IDs are correct

### Error: "violates check constraint"
**Cause:** The action or approver_role value is invalid  
**Fix:** Check the constraints on the approvals table

### Error: "duplicate key value violates unique constraint"
**Cause:** An approval already exists for this request/approver  
**Fix:** Check if the request was already approved

## Quick Test

If you want to test right now:
1. Open `http://localhost:3000/head/pending`
2. Open browser console (F12)
3. Click on a request
4. Click "Approve"
5. Look at the console
6. Send me what you see!
