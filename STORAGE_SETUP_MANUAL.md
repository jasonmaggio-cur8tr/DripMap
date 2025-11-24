# STORAGE SETUP - Manual Dashboard Method (RECOMMENDED)

## The Errors You're Seeing:

```
❌ "Bucket not found" - The shop-images bucket doesn't exist
❌ "new row violates row-level security policy" - SQL can't create buckets (permission issue)
```

## Why SQL Doesn't Work

The `storage.buckets` table has RLS policies that prevent direct SQL INSERT, even in the SQL Editor. This is a Supabase security feature.

## ✅ SOLUTION: Use Supabase Dashboard UI (2 minutes)

### Step 1: Create the Bucket

1. Go to https://supabase.com/dashboard
2. Select your project: **xsusdnkzwqjepwadlqdj**
3. Click **Storage** in the left sidebar
4. Click **"New bucket"** button (top right)
5. Fill in the form:
   ```
   Name: shop-images
   Public bucket: ✅ CHECKED (very important!)
   File size limit: 5242880 (5MB)
   Allowed MIME types: (leave empty or add)
     - image/jpeg
     - image/png
     - image/webp
     - image/gif
   ```
6. Click **"Create bucket"**

You should see: ✅ "shop-images" bucket created

### Step 2: Set Up RLS Policies

Now run this SQL in the SQL Editor (this part WILL work):

```sql
-- Clean up any old policies
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view shop images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload shop images" ON storage.objects;

-- Allow authenticated users to upload to shop-images bucket
CREATE POLICY "Authenticated can upload shop images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-images' AND
  (storage.foldername(name))[1] IN ('shops', 'avatars')
);

-- Allow everyone to view images (bucket is public)
CREATE POLICY "Public can view shop images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Users can update shop images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Users can delete shop images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images');
```

### Step 3: Verify Setup

Run this in SQL Editor:

```sql
-- Check if bucket exists
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'shop-images';

-- Check policies
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%shop%';
```

You should see:
- ✅ 1 bucket named "shop-images" with public=true
- ✅ 4 policies (upload, view, update, delete)

### Step 4: Test in Your App

1. Refresh your app
2. Log in (make sure you're authenticated)
3. Try adding a spot with an image
4. Console should show:
   ```
   ✅ Storage bucket "shop-images" exists and is accessible
   ✅ User authenticated, session valid until: [time]
   ✅ Bucket exists, proceeding with upload...
   ✅ Upload response - data: {...}
   ```

## Quick Visual Guide

```
Supabase Dashboard
├── Storage (left sidebar)
│   └── New bucket (button)
│       ├── Name: shop-images
│       ├── Public bucket: ✅
│       ├── File size limit: 5242880
│       └── Create
└── SQL Editor
    └── Paste policy SQL
    └── Run
```

## Expected Time

- ⏱️ Create bucket: **30 seconds**
- ⏱️ Run SQL policies: **15 seconds**
- ⏱️ Test upload: **5 seconds**
- **Total: < 1 minute**

## Troubleshooting

### "Bucket already exists"
✅ Good! Skip to Step 2 (policies)

### "Unauthorized" when creating policies
- Make sure you're using the SQL Editor (not terminal)
- Verify you're logged into the correct project

### Uploads still fail after setup
1. Check browser console for specific error
2. Verify you're logged in to the app
3. Run the diagnostic: Copy `storage-diagnostic.js` into console
4. Check session hasn't expired (log out and back in)

## Why This Method Works

**SQL INSERT into storage.buckets:**
- ❌ Blocked by RLS (even for project owner)
- Requires service_role key (not available in SQL Editor)

**Dashboard UI:**
- ✅ Uses internal APIs with proper permissions
- ✅ Bypasses RLS restrictions
- ✅ Always works

**SQL policies on storage.objects:**
- ✅ Works fine in SQL Editor
- ✅ No RLS restrictions on policy creation

## After Setup

Once the bucket exists and policies are set:
- ✅ Uploads will work instantly
- ✅ No more timeouts
- ✅ Session auto-refresh will handle expired tokens
- ✅ Images will be publicly viewable

**Do this now:** Go to Supabase Dashboard → Storage → New bucket → "shop-images" ✅
