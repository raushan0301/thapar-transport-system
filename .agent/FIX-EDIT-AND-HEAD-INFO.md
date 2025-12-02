# 🔧 EDIT REQUEST & HEAD INFO - TROUBLESHOOTING

**Issues:**
1. ❌ "Failed to update request" error
2. ❌ Head info not showing on request details

**Date:** December 2, 2025, 4:46 PM

---

## 🔍 ISSUE 1: FAILED TO UPDATE REQUEST

### **Problem:**
When clicking "Save Changes" on edit request, shows error: "Failed to update request"

### **Cause:**
RLS (Row Level Security) policy blocking UPDATE operation.

### **Solution:**

**Run this SQL in Supabase:**

```sql
-- Drop existing user update policy
DROP POLICY IF EXISTS "Users can update own editable requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON transport_requests;

-- Create new policy allowing users to update their own pending requests
CREATE POLICY "Users can update own pending requests"
  ON transport_requests
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND current_status IN ('draft', 'pending_head')
  )
  WITH CHECK (
    user_id = auth.uid()
    AND current_status IN ('draft', 'pending_head')
  );
```

**This allows users to update ONLY:**
- ✅ Their own requests (`user_id = auth.uid()`)
- ✅ Requests that are still pending (`current_status IN ('draft', 'pending_head')`)

---

## 🔍 ISSUE 2: HEAD INFO NOT SHOWING

### **Problem:**
"Forwarded to: [Head Name] (email)" not appearing on request details page.

### **Possible Causes:**

**1. head_id is NULL in database**

Check if head_id is set:
```sql
SELECT id, request_number, head_id, current_status 
FROM transport_requests 
WHERE id = '468d05fb-d52d-4f1b-a112-fb7e1be06c87';
```

If `head_id` is NULL, the request hasn't been assigned to a head yet.

**2. Head user doesn't exist**

Check if the head user exists:
```sql
SELECT u.id, u.full_name, u.email, u.role
FROM users u
JOIN transport_requests tr ON tr.head_id = u.id
WHERE tr.id = '468d05fb-d52d-4f1b-a112-fb7e1be06c87';
```

If no results, the head user was deleted or doesn't exist.

### **Solution:**

**If head_id is NULL, assign a head:**

```sql
-- First, find a head user
SELECT id, full_name, email FROM users WHERE role = 'head' LIMIT 1;

-- Then assign to request
UPDATE transport_requests 
SET head_id = '<head-user-id-here>'
WHERE id = '468d05fb-d52d-4f1b-a112-fb7e1be06c87';
```

**Or create a head user if none exists:**

```sql
-- Create a head user (you'll need to do this through Supabase Auth first)
INSERT INTO users (id, email, full_name, role, department)
VALUES (
  '<auth-user-id>',
  'head@example.com',
  'Department Head',
  'head',
  'CSED'
);
```

---

## 🧪 TESTING AFTER FIXES

### **Test Update:**
1. Open browser console (F12)
2. Go to edit request page
3. Make a change
4. Click "Save Changes"
5. Check console for:
   ```
   Updating request: <id>
   User ID: <your-id>
   Update result: ...
   Update error: null (should be null if successful)
   ```
6. Should see success toast ✅
7. Should redirect to request details ✅

### **Test Head Info:**
1. Go to request details
2. Should see below status badge:
   ```
   👥 Forwarded to: Dr. John Doe (john.doe@example.com)
   ```
3. If not showing, check console:
   ```
   Request data: { ..., head: { full_name: '...', email: '...' } }
   ```
4. If `head` is null, head_id is not set in database

---

## 📝 QUICK FIXES

### **Fix 1: Update Policy (Run SQL)**
```sql
CREATE POLICY "Users can update own pending requests"
  ON transport_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND current_status IN ('draft', 'pending_head'))
  WITH CHECK (user_id = auth.uid() AND current_status IN ('draft', 'pending_head'));
```

### **Fix 2: Assign Head to Request**
```sql
-- Get a head user ID
SELECT id FROM users WHERE role = 'head' LIMIT 1;

-- Assign to your request
UPDATE transport_requests 
SET head_id = '<head-id-from-above>'
WHERE user_id = auth.uid() AND current_status = 'pending_head';
```

---

## 🎯 EXPECTED BEHAVIOR

### **After Fixes:**

**Edit Request:**
1. Click "Edit Request" button
2. Modify fields
3. Click "Save Changes"
4. See: "Request updated successfully!" ✅
5. Redirect to request details
6. See updated information

**Head Info:**
1. View request details
2. See status badge
3. See below it: "👥 Forwarded to: **Name** (email)"
4. Know who will approve the request

---

## 📁 FILES

**SQL Fix:** `/database/migrations/fix_user_update_policy.sql`  
**Modified:** `/client/src/pages/user/EditRequest.jsx` (added logging)

---

**Run the SQL fix and check browser console for detailed errors!** 🔍
