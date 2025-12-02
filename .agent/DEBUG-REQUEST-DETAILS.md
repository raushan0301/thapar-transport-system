# 🔍 REQUEST DETAILS DEBUGGING GUIDE

**Issue:** "Request not found" when clicking on requests  
**Status:** Policies exist, but still not working  
**Next Step:** Check browser console for detailed error

---

## 🧪 STEP 1: CHECK BROWSER CONSOLE

I've added detailed logging to RequestDetails.jsx.

**Do this:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console
4. Click on any request in "My Requests"
5. Look at the console output

**You should see:**
```
Fetching request with ID: 4B8d05fb-d52d-4f1b-a112-fb7e1be06c87
Current user ID: <your-user-id>
Request data: <data or null>
Request error: <error details or null>
```

---

## 📊 WHAT TO LOOK FOR:

### **If you see:**
```
Request error: {
  message: "Row level security policy violation"
  code: "PGRST301"
}
```
**→ RLS policy is still blocking**

### **If you see:**
```
Request data: null
Request error: null
```
**→ Request doesn't exist or wrong ID**

### **If you see:**
```
Request error: {
  message: "Could not find foreign key relationship..."
}
```
**→ Database relationship issue**

---

## 🔧 SOLUTIONS BASED ON ERROR:

### **Solution 1: RLS Policy Issue**

If error code is `PGRST301` or mentions "policy violation":

**Run this SQL:**
```sql
-- Check if request belongs to you
SELECT 
  id,
  request_number,
  user_id,
  (user_id = auth.uid()) as is_mine
FROM transport_requests
WHERE id = '4B8d05fb-d52d-4f1b-a112-fb7e1be06c87';

-- If is_mine = false, the request doesn't belong to you
-- If is_mine = true but still blocked, policy is wrong
```

**Then fix policy:**
```sql
-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can view own requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can view relevant requests" ON transport_requests;

-- Create ONE simple policy
CREATE POLICY "Users can view own requests"
  ON transport_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

---

### **Solution 2: Foreign Key Issue**

If error mentions "foreign key relationship":

**Simplify the query temporarily:**

Edit RequestDetails.jsx line 31-34 to:
```javascript
const { data: requestData, error: requestError } = await supabase
  .from('transport_requests')
  .select('*')  // Remove joins temporarily
  .eq('id', id)
  .single();
```

If this works, the issue is with the joins. Add them back one by one.

---

### **Solution 3: Request Doesn't Exist**

If `requestData` is `null` and no error:

**Check if request exists:**
```sql
SELECT * FROM transport_requests 
WHERE id = '4B8d05fb-d52d-4f1b-a112-fb7e1be06c87';
```

If no results, the request was deleted or ID is wrong.

---

## 📝 REPORT BACK:

**Please share:**
1. The console output (all 4 lines)
2. Any error messages
3. Screenshot of console if possible

**This will tell us exactly what's wrong!**

---

## 🎯 MOST LIKELY ISSUE:

Based on having TWO read policies:
- "Users can view relevant requests"
- "Users can view own requests"

**These might conflict!**

**Quick fix:**
```sql
-- Keep only ONE policy
DROP POLICY "Users can view relevant requests" ON transport_requests;

-- The "Users can view own requests" should be enough
```

---

**Check the browser console and share the output!** 🔍
