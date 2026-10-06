-- Check if the event exists and what its status is
SELECT id, title, status, is_published, created_by, created_at 
FROM calendar_events 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if verify Admin status of the current user
-- Replace with the email you use to log in
SELECT id, email, is_admin FROM profiles WHERE email = 'YOUR_ADMIN_EMAIL_HERE';
