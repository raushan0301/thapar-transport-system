-- ============================================
-- CHECK PREDEFINED HEADS AND THEIR EMAILS
-- ============================================
-- Run this to see all predefined heads and their emails
-- ============================================

-- 1. Check all predefined heads
SELECT 
  ph.id as predefined_head_id,
  ph.user_id,
  ph.department,
  ph.is_active,
  u.email as head_email,
  u.full_name as head_name,
  u.role as user_role
FROM predefined_heads ph
JOIN users u ON ph.user_id = u.id
WHERE ph.is_active = true
ORDER BY ph.department;

-- 2. Check the specific head that requests are assigned to
SELECT 
  id,
  email,
  full_name,
  role,
  department
FROM users
WHERE email = 'raushanraaj04@gmail.com';

-- 3. Check all users with 'head' role
SELECT 
  id,
  email,
  full_name,
  role,
  department
FROM users
WHERE role = 'head'
ORDER BY email;

-- 4. Check the requests and which head they're assigned to
SELECT 
  tr.id,
  tr.request_number,
  tr.current_status,
  tr.head_id,
  tr.custom_head_email,
  h.email as head_user_email,
  h.full_name as head_user_name,
  h.role as head_user_role
FROM transport_requests tr
LEFT JOIN users h ON tr.head_id = h.id
WHERE tr.current_status = 'pending_head'
ORDER BY tr.submitted_at DESC
LIMIT 10;

-- ============================================
-- ANALYSIS QUESTIONS:
-- ============================================
-- After running this, answer these questions:
-- 
-- 1. Does the user with email 'raushanraaj04@gmail.com' exist?
-- 2. What is their role? (Should be 'head')
-- 3. Is there a predefined_head entry for this user?
-- 4. Do the requests have BOTH head_id AND custom_head_email set?
-- 5. Does the custom_head_email match the actual user's email?
-- ============================================
