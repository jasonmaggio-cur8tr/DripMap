-- Add missing columns to shops table
-- Run this in the Supabase SQL Editor

-- Add brand_id column as TEXT (frontend generates string IDs)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS brand_id text;

-- Add location_name column
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS location_name text;

-- Add open_hours column (store as JSONB)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS open_hours jsonb;

-- Add country column
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS country text;

-- Add index for brand_id for performance
CREATE INDEX IF NOT EXISTS shops_brand_id_idx ON public.shops(brand_id);
