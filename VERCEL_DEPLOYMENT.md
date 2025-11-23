# DripMap - Vercel Deployment Guide

## Prerequisites
- Vercel account ([signup here](https://vercel.com))
- Supabase project setup (database tables, RLS policies, storage bucket)
- GitHub repository (optional but recommended)

## Deployment Steps

### 1. Prepare Your Supabase Project

Make sure you've completed these steps in your Supabase dashboard:

1. **Run SQL Schema** (SQL Editor):
   - Execute `Supabase_project.sql` - Creates all tables, triggers, and RLS policies
   - Execute `admin-setup.sql` - Adds admin functionality and policies

2. **Configure Storage**:
   - Create bucket named `shop-images` (public)
   - Add RLS policies for authenticated uploads

3. **Disable Email Confirmation** (Authentication → Settings):
   - Turn off "Enable email confirmations" for easier testing
   - Re-enable for production if needed

4. **Set Admin User** (SQL Editor):
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = 'your-email@example.com';
   ```

### 2. Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and login
2. Click "Add New" → "Project"
3. Import your Git repository (or upload the project folder)
4. Configure build settings (auto-detected from `vercel.json`):
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = your-anon-key-here
   GEMINI_API_KEY = your-gemini-key (optional)
   ```

6. Click "Deploy"

#### Option B: Deploy via Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts and set environment variables
# Deploy to production
vercel --prod
```

### 3. Configure Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Your Supabase anon/public key |
| `GEMINI_API_KEY` | `AIzaSy...` | Google Gemini API key (optional) |

**Where to find these:**
- Supabase URL & Key: Supabase Dashboard → Project Settings → API
- Gemini API Key: [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4. Post-Deployment Checks

After deployment completes:

1. ✅ Visit your deployment URL
2. ✅ Test signup/login functionality
3. ✅ Add a test coffee shop with images
4. ✅ Submit a claim request
5. ✅ Login as admin and approve claim
6. ✅ Verify profile shows owned shops

### 5. Custom Domain (Optional)

1. Go to project **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs if using OAuth

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure all dependencies are in `package.json`
- Check build logs for TypeScript errors

### Blank Page After Deployment
- Open browser console (F12) for errors
- Verify environment variables start with `VITE_`
- Check Supabase URL is accessible

### Authentication Not Working
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active
- Ensure email confirmation setting matches your setup

### Images Not Uploading
- Verify storage bucket `shop-images` exists and is public
- Check RLS policies allow authenticated uploads
- Confirm bucket policies in Supabase Dashboard → Storage

### Admin Panel Empty
- Ensure user has `is_admin = true` in database
- Check RLS policy "Admins can view all claim requests" exists
- Verify claim requests table has data

## Environment Variables Reference

Create a `.env` file locally (use `.env.example` as template):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

**Note**: Never commit `.env` to Git. It's already in `.gitignore`.

## Updating Your Deployment

After making code changes:

```powershell
# Commit changes to Git
git add .
git commit -m "Your changes"
git push

# Vercel auto-deploys from Git
# Or manually trigger: vercel --prod
```

## Production Checklist

- [ ] All SQL scripts executed in Supabase
- [ ] Storage bucket created with RLS policies
- [ ] Admin user set in database
- [ ] Environment variables configured in Vercel
- [ ] Test signup/login flow
- [ ] Test adding shops with images
- [ ] Test claim request workflow
- [ ] Custom domain configured (if applicable)
- [ ] Analytics/monitoring setup (optional)

## Support

For issues:
1. Check browser console for errors
2. Review Vercel deployment logs
3. Verify Supabase configuration
4. Check RLS policies in SQL Editor

## Database Maintenance

Useful SQL queries:

```sql
-- View all users
SELECT * FROM profiles;

-- Make user an admin
UPDATE profiles SET is_admin = true WHERE email = 'user@example.com';

-- View all claim requests
SELECT cr.*, p.email, s.name as shop_name 
FROM claim_requests cr
JOIN profiles p ON cr.user_id = p.id
JOIN shops s ON cr.shop_id = s.id;

-- Reset claimed shop
UPDATE shops SET is_claimed = false, claimed_by = NULL WHERE id = 'shop-id';
UPDATE profiles SET is_business_owner = false WHERE id = 'user-id';
```

---

**Your DripMap app is now production-ready! 🎉**
