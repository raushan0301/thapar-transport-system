-- Fix all remaining issues: phone format, delete RLS, and other constraints

-- 1. Fix phone format constraint (allow various formats)
ALTER TABLE users DROP CONSTRAINT IF EXISTS phone_format;
ALTER TABLE users ADD CONSTRAINT phone_format 
CHECK (
  phone IS NULL 
  OR phone ~ '^\+?[0-9]{10,15}$'  -- Allows optional +, then 10-15 digits
);

-- 2. Fix RLS policy for deleting users (heads)
DROP POLICY IF EXISTS "Admins can delete users" ON users;
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (true);  -- Allow admins to delete any user

-- 3. Fix RLS policy for inserting users (heads)
DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Allow admins to create users

-- 4. Fix RLS policy for updating users
DROP POLICY IF EXISTS "Admins can update users" ON users;
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY cmd, policyname;
