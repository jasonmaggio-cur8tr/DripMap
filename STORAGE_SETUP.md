# Supabase Storage Setup Guide

## Quick Fix for Upload Timeout Error

If you're getting **"Upload timeout"** errors when adding spots with images, follow these steps:

---

## Step 1: Create the Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **xsusdnkzwqjepwadlqdj**
3. Click **Storage** in the left sidebar
4. Click **New Bucket** (or **Create Bucket**)
5. Configure the bucket:
   - **Name**: `shop-images` (exact name, lowercase)
   - **Public bucket**: ✅ **Enabled** (images need to be publicly accessible)
   - **File size limit**: `5242880` (5MB) or leave default
   - **Allowed MIME types**: Leave empty or add: `image/jpeg, image/png, image/webp, image/gif`
6. Click **Create Bucket**

---

## Step 2: Configure CORS Settings

CORS (Cross-Origin Resource Sharing) allows your app to upload files from different domains.

### Option A: Using Supabase Dashboard (Recommended)
1. In your Supabase project, go to **Storage** > **Policies**
2. Make sure there's a policy allowing uploads for authenticated users
3. Go to **Project Settings** > **API**
4. Under **CORS Configuration**, add your domains:
   - `http://localhost:5173` (local development)
   - `http://localhost:4173` (preview build)
   - Your production domain (e.g., `https://your-app.vercel.app`)

### Option B: Using SQL (Advanced)
Run this in your Supabase SQL Editor to create upload policies:

```sql
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload shop images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-images');

-- Allow public read access to shop images
CREATE POLICY "Public read access for shop images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'shop-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'shop-images' AND auth.uid()::text = owner);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'shop-images' AND auth.uid()::text = owner);
```

---

## Step 3: Verify Configuration

### Test the Bucket
Run this command in your browser console while on your app:

```javascript
// Import supabase client first
import { supabase } from './lib/supabase.ts';

// Check if bucket exists
const { data, error } = await supabase.storage.getBucket('shop-images');
console.log('Bucket:', data, 'Error:', error);

// Or list all buckets
const { data: buckets } = await supabase.storage.listBuckets();
console.log('All buckets:', buckets);
```

**Note:** If import doesn't work in console, the easiest way is to just check the browser Network tab when uploading - you'll see the actual API calls and errors.

### Test File Upload
Try uploading a small image through your app's "Add Spot" page. Check the browser console for detailed error messages.

---

## Step 4: Network & Performance Tips

### If uploads are still slow:
1. **Check your internet speed** - Large images (>2MB) can take time on slow connections
2. **Compress images before upload** - Use tools like TinyPNG or ImageOptim
3. **Check Supabase project location** - If your project is in a different region, uploads may be slower

### Optimize Images:
- Maximum recommended size: **2-3MB per image**
- Recommended dimensions: **1920x1080 or smaller**
- Formats: JPEG (best compression), PNG, WebP

---

## Troubleshooting

### Error: "Storage bucket not found"
- ✅ Create the `shop-images` bucket in Supabase Storage
- ✅ Make sure the name is exactly `shop-images` (lowercase, with hyphen)

### Error: "CORS error"
- ✅ Add your domain to CORS allowed origins in Supabase settings
- ✅ Include `http://localhost:5173` for local development

### Error: "Upload timeout after 120s"
- ✅ Check your internet connection
- ✅ Try uploading smaller images (compress first)
- ✅ Verify Supabase project is active and not paused

### Error: "Storage not configured"
- ✅ Check `.env` file has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Restart your dev server after changing `.env`: `npm run dev`

### Error: "Row Level Security policy violation"
- ✅ Make sure you're logged in when uploading
- ✅ Run the SQL policies from Step 2 Option B

---

## Quick Test Script

### Method 1: Check Network Tab (Easiest)
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to the **Network** tab
4. Try uploading an image in "Add Spot"
5. Look for requests to `supabase.co/storage` - check for errors (red entries)

### Method 2: Check Browser Console
The app automatically logs upload details. When you upload, check the console for:
- ✅ `"Starting upload of X files..."`
- ✅ `"Upload response - data: ..., error: ..."`
- ❌ Any red error messages

### Method 3: Verify Environment
Open console and type:
```javascript
// Check if env variables are loaded
console.log(window.location.origin); // Should show your dev server URL
// The app will show error toasts if Supabase isn't configured
```

---

## Need More Help?

1. Check the Supabase Storage docs: https://supabase.com/docs/guides/storage
2. Verify your project isn't paused (free tier pauses after inactivity)
3. Check Supabase status: https://status.supabase.com/
4. Review browser console for detailed error messages

---

**The timeout has been increased to 120 seconds (2 minutes), which should give enough time for most uploads even on slower connections. If you still experience issues, it's likely a configuration problem with the storage bucket or CORS settings.**
