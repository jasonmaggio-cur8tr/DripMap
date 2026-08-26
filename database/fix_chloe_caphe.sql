-- Paste this into your Supabase SQL Editor to manually upgrade info@chloe-caphe.com to PRO+

UPDATE shops
SET 
  subscription_tier = 'pro_plus', 
  subscription_status = 'active'
WHERE claimed_by = (
  SELECT id FROM auth.users 
  WHERE email = 'info@chloe-caphe.com' 
  LIMIT 1
);
