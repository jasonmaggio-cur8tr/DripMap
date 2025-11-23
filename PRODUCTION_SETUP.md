# DripMap - Production Setup Guide

A community-driven platform for discovering and sharing coffee shops and specialty drink spots.

## 🚀 Production Deployment Checklist

### 1. Database Setup (Supabase)

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Go to SQL Editor in your Supabase dashboard
   - Copy the entire contents of `Supabase_project.sql`
   - Execute the SQL to create all tables, triggers, and RLS policies

3. **Create Storage Bucket**
   - Go to Storage in Supabase dashboard
   - Create a new public bucket named `shop-images`
   - Set max file size to 5MB
   - Allow public access for uploaded images

### 2. Environment Variables

Create a `.env` file in the project root with the following:

```env
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini AI API Key (OPTIONAL - for AI-generated descriptions)
API_KEY=your-gemini-api-key-here
```

**How to get your Supabase credentials:**
1. Go to Project Settings > API
2. Copy the Project URL → `VITE_SUPABASE_URL`
3. Copy the `anon` `public` key → `VITE_SUPABASE_ANON_KEY`

**How to get Gemini AI key (optional):**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it as `API_KEY` in your `.env` file

### 3. Install Dependencies

```bash
npm install
```

### 4. Development Server

```bash
npm run dev
```

The app will run at http://localhost:3000

### 5. Production Build

```bash
npm run build
npm run preview  # Test production build locally
```

## 📦 Deployment Platforms

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```
Add environment variables in Vercel dashboard.

### Netlify
```bash
npm run build
# Deploy the 'dist' folder
```
Add environment variables in Netlify dashboard.

### Traditional Hosting
1. Run `npm run build`
2. Upload the `dist` folder to your web server
3. Configure environment variables on your hosting platform

## 🔐 Security Notes

- **Never commit `.env` file** - It's in `.gitignore`
- The `VITE_SUPABASE_ANON_KEY` is safe to expose (it's used client-side)
- Row Level Security (RLS) policies protect your data
- All database operations are secured through Supabase RLS

## 🎨 Features

### Authentication
- Email/password signup and login
- Automatic profile creation on signup
- Session management with Supabase Auth

### Shop Management
- Add new coffee shops with location picker
- Upload multiple images (stored in Supabase Storage)
- AI-generated descriptions (optional, requires Gemini API key)
- Tag shops with vibes (Cozy, Matcha, Specialty, etc.)

### User Features
- Save favorite shops
- Check-in to shops (passport stamps)
- Write reviews and ratings
- View profile with saved/visited shops

### Business Features
- Claim shop ownership
- Submit claim requests
- Admin approval system

### Map Features
- Interactive Leaflet map
- Real-time shop markers
- Search by city, name, or vibe
- Filter by multiple vibes

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **Maps**: Leaflet.js
- **AI**: Google Gemini AI (optional)
- **Styling**: Tailwind CSS

## 📁 Project Structure

```
DripMap/
├── components/       # Reusable UI components
├── context/         # React Context (AppContext, ToastContext)
├── lib/            # Utilities (Supabase client, env validation)
├── pages/          # Route pages
├── services/       # API services (database, storage, AI)
├── constants.ts    # App constants and initial data
├── types.ts        # TypeScript type definitions
└── .env           # Environment variables (not committed)
```

## 🔄 Database Schema

Key tables:
- `profiles` - User profiles (auto-created on signup)
- `shops` - Coffee shop listings
- `shop_images` - Shop photo gallery
- `reviews` - User reviews and ratings
- `saved_shops` - User bookmarks
- `visited_shops` - Check-in history
- `claim_requests` - Business ownership claims

All tables have Row Level Security enabled.

## 🐛 Troubleshooting

### "Invalid supabaseUrl" Error
- Check that `VITE_SUPABASE_URL` is set correctly in `.env`
- Make sure it starts with `https://`
- Don't use placeholder values

### Images Not Uploading
- Verify the `shop-images` bucket exists in Supabase Storage
- Check bucket is set to public
- Verify file size is under 5MB

### AI Description Not Working
- Gemini AI key is optional
- Check `API_KEY` is set in `.env`
- Verify API key is valid at Google AI Studio

### Database Errors
- Ensure SQL schema was executed completely
- Check RLS policies are enabled
- Verify user is authenticated for protected operations

## 📧 Support

For issues, please check:
1. Environment variables are set correctly
2. Supabase project is active
3. Database schema was executed
4. Storage bucket is created

## 📄 License

MIT License - feel free to use for your own projects!
