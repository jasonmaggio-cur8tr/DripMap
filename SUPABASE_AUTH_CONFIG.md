# Supabase Authentication Configuration Guide

## Fix: Email Verification Redirecting to localhost:3000

If your email verification links are redirecting to `localhost:3000` instead of your production URL, you need to configure the **Site URL** and **Redirect URLs** in your Supabase project.

---

## Step 1: Configure Site URL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **xsusdnkzwqjepwadlqdj**
3. Navigate to **Authentication** → **URL Configuration** (or **Settings**)
4. Set the **Site URL** to your custom domain:
   ```
   https://dripmap.space
   ```

---

## Step 2: Add Redirect URLs

In the same **URL Configuration** section:

1. Find **Redirect URLs** (or **Additional Redirect URLs**)
2. Add the following URLs (one per line):
   ```
   http://localhost:5173
   http://localhost:4173
   http://localhost:3000
   https://dripmap.space
   https://dripmap.space/*
   https://www.dripmap.space
   https://www.dripmap.space/*
   https://your-app-name.vercel.app
   https://your-app-name.vercel.app/*
   ```

3. Click **Save**

### Why These URLs?
- `http://localhost:5173` - Vite dev server (development)
- `http://localhost:4173` - Vite preview (local testing)
- `http://localhost:3000` - Common local port (fallback)
- `https://dripmap.space` - Your custom domain
- `https://dripmap.space/*` - Allow all routes on custom domain
- `https://www.dripmap.space` - With www subdomain
- `https://your-app-name.vercel.app` - Your Vercel domain (fallback)

---

## Step 3: Verify Your Vercel Domain

### Find Your Vercel URL:
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project
3. Copy the **Domain** (usually `your-app-name.vercel.app`)
4. Use this exact URL in the Supabase settings above

### Custom Domain (Optional):
If you have a custom domain like `dripmap.com`:
- Add it to the Redirect URLs list
- Update the Site URL to your custom domain

---

## Step 4: Test the Configuration

1. **Deploy your latest code** to Vercel (the code now includes `emailRedirectTo`)
2. **Create a new test account** on your production site
3. **Check your email** - the verification link should now point to your Vercel domain
4. **Click the verification link** - it should redirect you to your production app

---

## Troubleshooting

### Still redirecting to localhost?
- ✅ Clear your browser cache
- ✅ Make sure you deployed the latest code (with the `emailRedirectTo` fix)
- ✅ Double-check the Site URL in Supabase matches your Vercel domain exactly
- ✅ Wait a few minutes for Supabase settings to propagate

### Email not arriving?
- ✅ Check spam/junk folder
- ✅ Verify email confirmations are enabled: **Authentication** → **Settings** → **Enable email confirmations**
- ✅ Check Supabase email rate limits (free tier has limits)

### "Invalid redirect URL" error?
- ✅ Make sure the URL is added to the Redirect URLs list
- ✅ Check for typos in the URL
- ✅ Include both `https://domain.com` and `https://domain.com/*`

### Using a custom domain?
If you've set up a custom domain in Vercel:
1. Add your custom domain to Supabase Redirect URLs
2. Update the Site URL to your custom domain
3. Keep the `.vercel.app` URL as a fallback

---

## Additional Configuration (Optional)

### Email Templates
Customize the verification email in **Authentication** → **Email Templates**:
- Subject line
- Email body
- Branding/logo

### Email Provider
For production, consider setting up a custom SMTP provider:
- **Authentication** → **Settings** → **SMTP Settings**
- Providers: SendGrid, AWS SES, Mailgun, etc.

---

## Summary

**What was fixed:**
- Added `emailRedirectTo: window.location.origin` in the signup function
- This dynamically sets the redirect URL based on where the app is running

**What you need to do:**
1. Configure Site URL in Supabase to your Vercel domain
2. Add your Vercel domain to Redirect URLs
3. Deploy the updated code to Vercel
4. Test signup with a new email address

---

## Quick Reference

**Your Supabase Project:**
- URL: `https://xsusdnkzwqjepwadlqdj.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/xsusdnkzwqjepwadlqdj

**Where to configure:**
```
Supabase Dashboard
  └── Authentication
       └── URL Configuration
            ├── Site URL: https://dripmap.space
            └── Redirect URLs:
                 ├── http://localhost:5173
                 ├── http://localhost:4173
                 ├── http://localhost:3000
                 ├── https://dripmap.space
                 ├── https://dripmap.space/*
                 ├── https://www.dripmap.space
                 ├── https://www.dripmap.space/*
                 ├── https://your-vercel-app.vercel.app
                 └── https://your-vercel-app.vercel.app/*
```

**After configuring, new signups will redirect to the correct domain!**
