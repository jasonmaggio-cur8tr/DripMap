-- Migration: add shop_images.image_data (base64) and create avatar_table for avatar_image_data
-- Run this in Supabase SQL editor (SQL Editor -> New query). Always review before executing in production.

BEGIN;

-- 1) Allow shop_images.url to be nullable: some rows will store image_data instead
ALTER TABLE IF EXISTS public.shop_images
  ALTER COLUMN url DROP NOT NULL;

-- 2) Add image_data column to store base64/data-URI strings
ALTER TABLE IF EXISTS public.shop_images
  ADD COLUMN IF NOT EXISTS image_data TEXT;

-- 3) Create avatar_table to store avatar base64 data per user
CREATE TABLE IF NOT EXISTS public.avatar_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_image_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4) Enable Row-Level Security (RLS) and minimal policies for avatars
ALTER TABLE IF EXISTS public.avatar_table ENABLE ROW LEVEL SECURITY;

-- Allow everyone to SELECT avatars
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'avatars_are_viewable_by_everyone' AND tablename = 'avatar_table'
  ) THEN
    CREATE POLICY "Avatars are viewable by everyone" ON public.avatar_table FOR SELECT USING (true);
  END IF;
END$$;

-- Allow authenticated users to insert their own avatars
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_can_insert_their_avatar' AND tablename = 'avatar_table'
  ) THEN
    CREATE POLICY "Users can insert their avatar" ON public.avatar_table FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Allow authenticated users to update their own avatars
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_can_update_their_avatar' AND tablename = 'avatar_table'
  ) THEN
    CREATE POLICY "Users can update their avatar" ON public.avatar_table FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

-- 5) Optional: index user_id for quick lookup
CREATE INDEX IF NOT EXISTS idx_avatar_user_id ON public.avatar_table(user_id);

COMMIT;
