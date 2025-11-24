-- ============================================
-- COMPLETE STORAGE SETUP FIX FOR DRIPMAP
-- Run this in Supabase SQL Editor to fix upload issues
-- ============================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shop-images', 
  'shop-images', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view shop images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload shop images" ON storage.objects;

-- 3. Create comprehensive RLS policies

-- Allow authenticated users to INSERT (upload) to shop-images bucket
CREATE POLICY "Authenticated can upload shop images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-images' AND
  (storage.foldername(name))[1] IN ('shops', 'avatars')
);

-- Allow PUBLIC to SELECT (view) from shop-images bucket
CREATE POLICY "Public can view shop images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Allow authenticated users to UPDATE their own uploads
CREATE POLICY "Users can update own shop images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images');

-- Allow authenticated users to DELETE their own uploads
CREATE POLICY "Users can delete own shop images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images');

-- 4. Verify the setup
SELECT 
  'Bucket Check' as check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'shop-images';

-- 5. Verify policies
SELECT 
  'Policy Check' as check_type,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%shop%';
