# DripMap Database Schema

**Generated:** 2024-12-24

## Instructions
1. Go to Supabase Dashboard → SQL Editor
2. Run the query from `export_schema.sql` (query #6 - the big one)
3. Copy the results and paste them below

---

## Database Tables and Columns

```
Paste the results from Supabase SQL query here
```

---

## Known Field Name Mappings (snake_case ↔ camelCase)

Based on the error messages, here are the confirmed mappings:

### profiles table
- Database (snake_case) → Code (camelCase)
- `is_admin` → `isAdmin`
- `is_pro` → `isPro`
- `is_business_owner` → `isBusinessOwner`

### shops table
- Database (snake_case) → Code (camelCase)
- `claimed_by` → `claimedBy`
- `subscription_tier` → `subscriptionTier`

### Common patterns
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`
- `user_id` → `userId`
- `shop_id` → `shopId`

---

## To Check Current Values

Run these corrected queries in Supabase SQL Editor:

```sql
-- Check your user profile (using snake_case)
SELECT id, email, username, is_pro, is_admin, is_business_owner
FROM profiles
LIMIT 10;

-- Check shops (using snake_case)
SELECT id, name, subscription_tier, claimed_by
FROM shops
LIMIT 10;

-- Set your user to NOT PRO
UPDATE profiles
SET is_pro = false
WHERE email = 'your-email@example.com';

-- Set a shop to NOT PRO
UPDATE shops
SET subscription_tier = 'free'
WHERE id = 'shop-id-here';
```
