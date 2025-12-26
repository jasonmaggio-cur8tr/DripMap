-- Migration: Add PRO feature columns to shops table
-- Run this in Supabase SQL Editor

-- Add PRO feature columns to shops table
ALTER TABLE public.shops
  -- Brand & Location
  ADD COLUMN IF NOT EXISTS brand_id text,
  ADD COLUMN IF NOT EXISTS location_name text,

  -- Custom Vibes & Spotify
  ADD COLUMN IF NOT EXISTS custom_vibes text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS spotify_playlist_url text,

  -- Premium Links
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS maps_url text,
  ADD COLUMN IF NOT EXISTS online_order_url text,

  -- Happening Now (Digital A-Frame)
  ADD COLUMN IF NOT EXISTS happening_now_title text,
  ADD COLUMN IF NOT EXISTS happening_now_message text,
  ADD COLUMN IF NOT EXISTS happening_now_sticker text,
  ADD COLUMN IF NOT EXISTS happening_now_expires_at timestamp with time zone,

  -- Now Brewing Menu
  ADD COLUMN IF NOT EXISTS current_menu jsonb DEFAULT '[]',

  -- Coffee Tech
  ADD COLUMN IF NOT EXISTS sourcing_info text,
  ADD COLUMN IF NOT EXISTS espresso_machine text,
  ADD COLUMN IF NOT EXISTS grinder_details text,
  ADD COLUMN IF NOT EXISTS brewing_methods text[] DEFAULT '{}',

  -- Barista Profiles
  ADD COLUMN IF NOT EXISTS baristas jsonb DEFAULT '[]',

  -- Specialty Menu
  ADD COLUMN IF NOT EXISTS specialty_drinks jsonb DEFAULT '[]',

  -- Vegan Options
  ADD COLUMN IF NOT EXISTS vegan_food_options boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS plant_milks jsonb DEFAULT '[]';

-- Add comments for documentation
COMMENT ON COLUMN shops.brand_id IS 'Brand identifier for multi-location businesses (PRO)';
COMMENT ON COLUMN shops.location_name IS 'Specific location name for multi-location brands (PRO)';
COMMENT ON COLUMN shops.custom_vibes IS 'Custom vibe tags created by shop owner (PRO)';
COMMENT ON COLUMN shops.spotify_playlist_url IS 'Spotify playlist URL for shop vibe (PRO)';
COMMENT ON COLUMN shops.website_url IS 'Shop website URL (PRO)';
COMMENT ON COLUMN shops.maps_url IS 'Google Maps or custom maps URL (PRO)';
COMMENT ON COLUMN shops.online_order_url IS 'Online ordering system URL (PRO)';
COMMENT ON COLUMN shops.happening_now_title IS 'Happening Now post title - expires after 4 hours (PRO)';
COMMENT ON COLUMN shops.happening_now_message IS 'Happening Now post message (PRO)';
COMMENT ON COLUMN shops.happening_now_sticker IS 'Happening Now optional sticker text (PRO)';
COMMENT ON COLUMN shops.happening_now_expires_at IS 'When Happening Now post expires (PRO)';
COMMENT ON COLUMN shops.current_menu IS 'Now Brewing menu items as JSON array (PRO)';
COMMENT ON COLUMN shops.sourcing_info IS 'Coffee sourcing information (PRO)';
COMMENT ON COLUMN shops.espresso_machine IS 'Espresso machine details (PRO)';
COMMENT ON COLUMN shops.grinder_details IS 'Grinder information (PRO)';
COMMENT ON COLUMN shops.brewing_methods IS 'Available brewing methods (PRO)';
COMMENT ON COLUMN shops.baristas IS 'Barista profiles as JSON array (PRO)';
COMMENT ON COLUMN shops.specialty_drinks IS 'Specialty drink menu as JSON array (PRO)';
COMMENT ON COLUMN shops.vegan_food_options IS 'Whether shop offers vegan food options (PRO)';
COMMENT ON COLUMN shops.plant_milks IS 'Available plant-based milk options as JSON (PRO)';
