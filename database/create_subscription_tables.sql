-- =====================================================
-- DripMap Subscription System Database Schema
-- FEAT-014 & FEAT-015: PRO/PRO+ Pricing + DripClub
-- =====================================================

-- =====================================================
-- 1. Update shops table with subscription fields
-- =====================================================
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'
  CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'inactive')),
ADD COLUMN IF NOT EXISTS pro_plus_discount_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Update subscription_tier to include pro_plus option
-- First drop the existing check constraint if it exists
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_subscription_tier_check;

-- Update column to allow new tier
ALTER TABLE shops
ALTER COLUMN subscription_tier TYPE TEXT,
ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Add new check constraint
ALTER TABLE shops
ADD CONSTRAINT shops_subscription_tier_check
CHECK (subscription_tier IN ('free', 'pro', 'pro_plus'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shops_subscription_tier ON shops(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_shops_stripe_customer ON shops(stripe_customer_id);

-- Unique index on stripe_subscription_id (prevents duplicate syncs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_stripe_sub_unique
  ON shops(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- =====================================================
-- 2. Create dripclub_memberships table
-- =====================================================
CREATE TABLE IF NOT EXISTS dripclub_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'inactive')),
  plan_type TEXT NOT NULL DEFAULT 'monthly'
    CHECK (plan_type IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one membership per user
  CONSTRAINT unique_user_membership UNIQUE (user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_dripclub_user ON dripclub_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_dripclub_stripe_customer ON dripclub_memberships(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_dripclub_status ON dripclub_memberships(status);

-- =====================================================
-- 3. Create stripe_events table for webhook idempotency
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY, -- Stripe event ID (evt_xxx)
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB
);

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed_at);

-- =====================================================
-- 4. Create subscription_prices table (for caching Stripe prices)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_prices (
  id TEXT PRIMARY KEY, -- Stripe price ID (price_xxx)
  product_type TEXT NOT NULL
    CHECK (product_type IN ('shop_pro', 'shop_pro_plus', 'dripclub')),
  billing_interval TEXT NOT NULL
    CHECK (billing_interval IN ('monthly', 'annual')),
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. Update profiles table for DripClub badge display
-- =====================================================
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS dripclub_member BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dripclub_member_since TIMESTAMPTZ;

-- =====================================================
-- 6. RLS Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE dripclub_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_prices ENABLE ROW LEVEL SECURITY;

-- DripClub Memberships Policies
-- Users can read their own membership
CREATE POLICY "Users can view own membership" ON dripclub_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (via Edge Functions)
CREATE POLICY "Service role can manage memberships" ON dripclub_memberships
  FOR ALL USING (auth.role() = 'service_role');

-- Stripe Events Policies
-- Only service role can access (webhook handler)
CREATE POLICY "Service role can manage stripe events" ON stripe_events
  FOR ALL USING (auth.role() = 'service_role');

-- Subscription Prices Policies
-- Anyone can read prices (public)
CREATE POLICY "Anyone can view prices" ON subscription_prices
  FOR SELECT USING (true);

-- Only service role can manage prices
CREATE POLICY "Service role can manage prices" ON subscription_prices
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. Update existing shop policies for subscription fields
-- =====================================================

-- Shop owners can update their own subscription opt-in preference
-- (pro_plus_discount_enabled field only, not subscription status)
-- Note: subscription_status, stripe_* fields should only be updated by service role

-- =====================================================
-- 8. Helper function to check if a shop has active PRO+ with discount
-- =====================================================
CREATE OR REPLACE FUNCTION is_pro_plus_with_discount(shop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shops
    WHERE id = shop_id
      AND subscription_tier = 'pro_plus'
      AND subscription_status = 'active'
      AND pro_plus_discount_enabled = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. Helper function to check if user has active DripClub
-- =====================================================
CREATE OR REPLACE FUNCTION has_active_dripclub(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM dripclub_memberships
    WHERE user_id = uid
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. Trigger to update profiles.dripclub_member on membership change
-- =====================================================
CREATE OR REPLACE FUNCTION sync_dripclub_member_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE profiles
    SET
      dripclub_member = (NEW.status = 'active'),
      dripclub_member_since = CASE
        WHEN NEW.status = 'active' AND dripclub_member_since IS NULL THEN NOW()
        ELSE dripclub_member_since
      END
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET dripclub_member = FALSE
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_dripclub_membership_change ON dripclub_memberships;
CREATE TRIGGER on_dripclub_membership_change
  AFTER INSERT OR UPDATE OR DELETE ON dripclub_memberships
  FOR EACH ROW EXECUTE FUNCTION sync_dripclub_member_status();

-- =====================================================
-- 11. Updated_at trigger for dripclub_memberships
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_dripclub_updated_at ON dripclub_memberships;
CREATE TRIGGER set_dripclub_updated_at
  BEFORE UPDATE ON dripclub_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 12. Data migration for existing PRO shops
-- =====================================================
-- If shops already have subscription_tier = 'pro' but no status,
-- set them to 'active' to maintain backward compatibility
UPDATE shops
SET subscription_status = 'active'
WHERE subscription_tier IN ('pro', 'pro_plus')
  AND (subscription_status IS NULL OR subscription_status = 'inactive');

-- =====================================================
-- 13. Cleanup job for old stripe_events (run manually or via pg_cron)
-- =====================================================
-- DELETE FROM stripe_events WHERE processed_at < NOW() - INTERVAL '90 days';

-- =====================================================
-- Done! Run this SQL in your Supabase SQL Editor
-- =====================================================
