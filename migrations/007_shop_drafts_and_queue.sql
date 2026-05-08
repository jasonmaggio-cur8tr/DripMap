-- Migration 007: Shop Drafts, Approval Queue & Outreach Pipeline
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. Add instagram_url to shops table
-- ============================================================

ALTER TABLE shops ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- ============================================================
-- 2. shop_drafts table
-- ============================================================

CREATE TABLE IF NOT EXISTS shop_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Shop data (JSONB — mirrors the payload the agent sends)
  -- Contains: name, neighborhood, city, state, country, address,
  -- description, website_url, instagram_url, yelp_url, google_maps_url,
  -- phone, hours, known_for, vibe_tags, lat, lng
  shop_data JSONB NOT NULL,

  -- Workflow
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'rejected', 'published', 'needs_more_info')),
  submitted_by TEXT NOT NULL,
  agent_run_id TEXT,
  review_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,

  -- Outreach
  email TEXT,
  email_source TEXT CHECK (email_source IN ('website', 'yelp', 'instagram_bio', 'google', 'manual') OR email_source IS NULL),
  dm_template TEXT,
  outreach_email_status TEXT NOT NULL DEFAULT 'not_sent'
    CHECK (outreach_email_status IN ('not_sent', 'queued', 'sent', 'failed', 'skipped')),
  outreach_email_sent_at TIMESTAMPTZ,
  outreach_dm_status TEXT NOT NULL DEFAULT 'not_sent'
    CHECK (outreach_dm_status IN ('not_sent', 'sent_manually', 'skipped')),

  -- Traceability
  published_shop_id UUID REFERENCES shops(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for the queue list view (most common query)
CREATE INDEX IF NOT EXISTS idx_shop_drafts_status ON shop_drafts(status);
CREATE INDEX IF NOT EXISTS idx_shop_drafts_created_at ON shop_drafts(created_at DESC);

-- ============================================================
-- 3. shop_draft_photos table
-- ============================================================

CREATE TABLE IF NOT EXISTS shop_draft_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_draft_id UUID NOT NULL REFERENCES shop_drafts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source TEXT CHECK (source IN ('instagram', 'yelp', 'website', 'google', 'other') OR source IS NULL),
  source_url TEXT,
  attribution TEXT,
  position INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_draft_photos_draft_id ON shop_draft_photos(shop_draft_id);

-- ============================================================
-- 4. shop_draft_audit_log table
-- ============================================================

CREATE TABLE IF NOT EXISTS shop_draft_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_draft_id UUID NOT NULL REFERENCES shop_drafts(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'created', 'edited', 'approved', 'rejected',
    'published', 'needs_more_info', 'email_added', 'outreach_triggered',
    'dm_marked_sent', 'photos_updated'
  )),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_draft_audit_log_draft_id ON shop_draft_audit_log(shop_draft_id);

-- ============================================================
-- 5. Updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_shop_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shop_drafts_updated_at ON shop_drafts;
CREATE TRIGGER shop_drafts_updated_at
  BEFORE UPDATE ON shop_drafts
  FOR EACH ROW EXECUTE FUNCTION update_shop_drafts_updated_at();

-- ============================================================
-- 6. RLS Policies
-- ============================================================

ALTER TABLE shop_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_draft_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_draft_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin users can do everything
CREATE POLICY shop_drafts_admin_all ON shop_drafts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY shop_draft_photos_admin_all ON shop_draft_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

CREATE POLICY shop_draft_audit_log_admin_all ON shop_draft_audit_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
  );

-- Service role (Edge Functions with AGENT_API_KEY) bypasses RLS automatically
-- No additional policy needed for the agent API since Edge Functions use service_role key
