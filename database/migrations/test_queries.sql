-- TEST QUERY: Check if basic request reading works

-- 1. First, check if you can read your own requests at all
SELECT id, request_number, purpose, current_status, user_id
FROM transport_requests
WHERE user_id = auth.uid()
LIMIT 5;

-- 2. If that works, check if the specific request exists
-- Replace 'YOUR_REQUEST_ID' with actual ID from the URL
SELECT id, request_number, purpose, current_status, user_id
FROM transport_requests
WHERE id = '4B8d05fb-d52d-4f1b-a112-fb7e1be06c87';

-- 3. Check your current user ID
SELECT auth.uid() as my_user_id;

-- 4. Check if the request belongs to you
SELECT 
  tr.id,
  tr.request_number,
  tr.user_id as request_user_id,
  auth.uid() as my_user_id,
  (tr.user_id = auth.uid()) as is_mine
FROM transport_requests tr
WHERE tr.id = '4B8d05fb-d52d-4f1b-a112-fb7e1be06c87';

-- 5. Test the exact query from the app (simplified)
SELECT *
FROM transport_requests
WHERE id = '4B8d05fb-d52d-4f1b-a112-fb7e1be06c87';
