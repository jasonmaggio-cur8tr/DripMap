# 🚀 DripMap - Quick Reference

## Essential Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Environment Setup (.env)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
API_KEY=AIzxxx... (optional)
```

## Database Setup (One-Time)

1. Create Supabase project → supabase.com
2. SQL Editor → Paste `Supabase_project.sql` → Run
3. Storage → Create bucket `shop-images` (public)
4. Settings → API → Copy URL & anon key to `.env`

## Key Features

✅ User signup/login with email & password  
✅ Add coffee shops with photos  
✅ AI-generated descriptions (optional)  
✅ Interactive map with markers  
✅ Save & visit shops (bookmarks & check-ins)  
✅ Reviews & ratings  
✅ Business ownership claims  
✅ Admin approval system  

## API Services

**Auth**: `context/AppContext.tsx`
- `signup(email, password, username)`
- `login(email, password)`
- `logout()`

**Shops**: `services/dbService.ts`
- `fetchShops()` - Get all shops
- `createShop(data)` - Add new spot
- `addReview(shopId, userId, rating, comment)`

**User**: `services/dbService.ts`
- `fetchUserProfile(userId)`
- `updateUserProfile(userId, updates)`
- `toggleSavedShop(userId, shopId, isSaved)`
- `toggleVisitedShop(userId, shopId, isVisited)`

**Images**: `services/storageService.ts`
- `uploadImage(file, folder)`
- `uploadImages(files, folder)`
- `deleteImage(url)`

## Project Structure

```
DripMap/
├── components/      # UI components
├── context/        # Global state (AppContext, ToastContext)
├── lib/           # Supabase client, utilities
├── pages/         # Route pages (Home, Auth, AddSpot, etc.)
├── services/      # API layer (dbService, storageService, geminiService)
├── constants.ts   # Demo data & constants
├── types.ts       # TypeScript types
└── .env          # Environment variables
```

## Deployment Checklist

- [ ] Database SQL executed in Supabase
- [ ] Storage bucket `shop-images` created
- [ ] `.env` file configured with real credentials
- [ ] Test signup/login locally
- [ ] Test adding a spot with images
- [ ] Deploy to Vercel/Netlify
- [ ] Add env vars in hosting dashboard

## Common Issues

**Blank page**: Check browser console for errors  
**"Invalid supabaseUrl"**: Update `.env` with real URL  
**Images not uploading**: Create `shop-images` bucket  
**Database errors**: Run SQL schema completely  
**No shops showing**: Database is empty initially  

## Tech Stack

React 19 • TypeScript • Vite • Supabase • Leaflet • Tailwind CSS

---

For detailed docs: See `PRODUCTION_SETUP.md` and `PRODUCTION_READY.md`
