-- Add country column to shops table
-- This migration adds support for international coffee shops

ALTER TABLE shops ADD COLUMN IF NOT EXISTS country TEXT DEFAULT '';

-- Update any existing shops to have empty country (optional cleanup)
UPDATE shops SET country = '' WHERE country IS NULL;
