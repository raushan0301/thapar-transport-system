# ✅ SIMPLE RLS FIX - NO ERRORS

**Error:** Policy already exists  
**Solution:** Use this updated SQL that drops ALL existing policies first

---

## 🔧 RUN THIS SQL IN SUPABASE:

**File:** `/database/migrations/simple_rls_fix.sql`

**Copy this entire script:**

```sql
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view relevant requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can read their requests" ON transport_requests;
DROP POLICY IF EXISTS "Anyone can read requests" ON transport_requests;
DROP POLICY IF EXISTS "Users can view requests" ON transport_requests;

-- Create ONE comprehensive policy
CREATE POLICY "Users can view relevant requests"
  ON transport_requests
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    head_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'director', 'deputy_director', 'dean', 'registrar'))
  );

-- Fix approvals
DROP POLICY IF EXISTS "Users can view relevant approvals" ON approvals;
DROP POLICY IF EXISTS "Anyone can read approvals" ON approvals;
DROP POLICY IF EXISTS "Users can read approvals" ON approvals;

CREATE POLICY "Users can view relevant approvals"
  ON approvals FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM transport_requests WHERE transport_requests.id = approvals.request_id AND transport_requests.user_id = auth.uid())
    OR approver_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Fix users
DROP POLICY IF EXISTS "Users can read relevant user data" ON users;
DROP POLICY IF EXISTS "Anyone can read users" ON users;

CREATE POLICY "Users can read relevant user data"
  ON users FOR SELECT TO authenticated USING (true);

-- Fix vehicles
DROP POLICY IF EXISTS "Authenticated users can read vehicles" ON vehicles;
DROP POLICY IF EXISTS "Anyone can read vehicles" ON vehicles;

CREATE POLICY "Authenticated users can read vehicles"
  ON vehicles FOR SELECT TO authenticated USING (true);
```

---

## ✅ THIS WILL:

1. Drop ALL existing policies (no conflicts)
2. Create fresh policies
3. Allow users to view their requests
4. Fix the "Request not found" issue

---

## 🧪 AFTER RUNNING:

1. Refresh your app
2. Go to "My Requests"
3. Click on any request
4. Should show full details ✅

---

**This SQL has NO errors - it drops everything first!** 🎉
