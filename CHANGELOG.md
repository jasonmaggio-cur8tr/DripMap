# Changelog

All notable changes to DripMap are documented in this file.

## [Unreleased] — feature/admin-shop-queue
### Added
- Admin Shop Queue: agent-facing API, approval workflow, outreach pipeline
- `shop_drafts`, `shop_draft_photos`, `shop_draft_audit_log` tables
- `instagram_url` column on `shops` table
- Supabase Edge Function for agent draft submission
- Loops integration for shop-listed outreach emails
- DM template voice spec (`docs/dm-template-spec.md`)
- Admin shop queue docs (`docs/admin-shop-queue.md`)
- This changelog

### Removed
- Old Curator (mock AI scout) tab and ShopDrafts review page
- `curatorService.ts` (replaced by `shopDraftService.ts`)

---

## Prior History (summarized from git log)

### 2025-04 — App Store Prep & Mobile Fixes
- Static /privacy page for Apple App Store
- Fix mobile photo upload hangs (XHR upload, aggressive compression, session timeouts)
- Brand picker redesign with explicit brandMode state

### 2025-03 — Gamification, Social & Community
- Gamification system: Drip Score, Experience Logs, Leaderboard
- Social features: user follows, notifications, community feed
- Custom vibes for shop owners
- Privacy Policy & Terms of Service pages

### 2025-02 — Map, Search & Performance
- Mapbox geocoder integration with global search
- PRO tier shop sorting with distance banding
- Mobile map fixes (container height, searchbox overlap)
- Drip Score badge on map popups
- 15s global fetch timeout for Safari deadlock prevention

### 2025-01 — Subscriptions & Quick Wins
- Stripe subscription system (PRO, PRO+, DripClub)
- DripClub promo banner and membership badge
- Scout Bounty page
- Favicon and logo updates
- Image optimization and lazy loading
- Friendly URL slugs for shops and events

### 2024-12 — Events & Pro Features
- Calendar events system with public submission
- PRO features database integration
- Claim approval workflow
- Loops.so email integration
- Coffee Date MVP
- Password reset flow

### 2024-11 — Foundation
- Initial project setup (Vite + React + TypeScript + Supabase)
- Core shop CRUD, map view, user profiles
- Auth system, image upload, shop claiming
