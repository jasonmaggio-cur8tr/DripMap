# 🚀 Quick Deploy to Vercel

## Prerequisites
- GitHub account
- Vercel account (free)
- Supabase project configured

## Step 1: Push to GitHub (if not already)

```bash
git add .
git commit -m "Production ready with all features tested"
git push origin main
```

## Step 2: Deploy on Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - Framework Preset: **Vite** (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Add Environment Variables:

```
VITE_SUPABASE_URL = https://xsusdnkzwqjepwadlqdj.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzdXNkbmt6d3FqZXB3YWRscWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzYyODMsImV4cCI6MjA3OTMxMjI4M30._cAwwlEDfmdu6O-PEZYMW4smfi3nYEXYekgniuECGyw
GEMINI_API_KEY = your-gemini-key-here (optional)
```

6. Click **"Deploy"**
7. Wait 2-3 minutes
8. Done! ✅

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts and add environment variables when asked
```

## Step 3: Verify Deployment

Visit your deployed URL (e.g., `https://dripmap.vercel.app`) and test:

- [x] Homepage loads with map
- [x] Can view shop details
- [x] Can sign up / login
- [x] Images load correctly
- [x] No console errors

## Step 4: Set Admin User (Optional)

In Supabase SQL Editor:

```sql
UPDATE profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure build command is `npm run build`
- Check Vercel build logs for specific errors

### Images Don't Load
- Verify Supabase storage bucket is public
- Check CORS settings in Supabase
- Verify storage URL in environment variables

### Authentication Issues
- Verify Supabase URL and anon key
- Check email confirmation settings in Supabase
- Ensure auth redirect URLs include your Vercel domain

### AI Features Not Working
- Set `GEMINI_API_KEY` in Vercel environment variables
- Or ignore - app works fine without it (fallback description)

## Post-Deployment

1. **Test all features** using checklist in TESTING_REPORT.md
2. **Share link** with test users
3. **Monitor** Vercel analytics and logs
4. **Iterate** based on feedback

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Project Issues: Check TESTING_REPORT.md

---

**Your app is ready to go live! 🎉**

Deployment time: ~3-5 minutes
