-- 008: allow 'manual' as a shop_draft_photos.source
-- Admins can add photos directly in the shop queue (source = 'manual').
-- 007 was already applied in prod, so alter the existing constraint forward.

ALTER TABLE shop_draft_photos
  DROP CONSTRAINT IF EXISTS shop_draft_photos_source_check;

ALTER TABLE shop_draft_photos
  ADD CONSTRAINT shop_draft_photos_source_check
  CHECK (source IN ('instagram', 'yelp', 'website', 'google', 'other', 'manual') OR source IS NULL);
