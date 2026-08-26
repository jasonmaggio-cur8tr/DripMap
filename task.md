# Shop Image Management (Completed)
- [x] Create migration for `sort_order`
- [x] Backend implementation (ID support, sort order, delete, reorder)
- [x] Frontend implementation (Edit Gallery UI, Delete, Reorder)
- [x] Fix EditShop persistence bug

# Friendly URLs (Slugs)
## Database
- [ ] Create migration `004-add-shop-slugs.sql` (column + backfill)
- [ ] Verify migration execution

## Backend / Service
- [x] Update `Shop` interface with `slug`
- [x] Update `fetchShops` to return `slug`
- [x] Implement `fetchShopBySlug` (or update logic to handle slug lookup)
- [x] Update `addShop` to generate slug

## Frontend
- [x] Update `ShopCard` to link using slug
- [x] Update `ShopDetail` to resolve shop by slug
- [x] Update `App.tsx` router (if needed) - Not needed, :id param handles both

## Verification
- [x] Verify existing shops have slugs (User ran migration)
- [ ] Verify navigation works with slugs
- [x] Verify new shop creation generates slug

# Event Improvements

## Database
- [x] Create `event_attendees` table (migration script created)
- [x] Add RLS for `event_attendees` (included in script)

## Backend
- [x] Update `dbService.ts` to handle joining/leaving events
- [x] Update `fetchEvents` to get attendee counts and avatars

## Frontend (Event Creation)
- [x] Update `EventCreateModal` to sort shops alphabetically
- [x] Implement autocomplete/search for shop selection

## Frontend (Event Card)
- [x] Update `EventCard` design (taller, stacked button, 1:1 image)
- [x] Add "Going" button
- [x] Display "Going" count
- [x] Display avatar stack of last 3 attendees

# Event Improvements

## Database
- [ ] Create `event_attendees` table (migration script)
- [ ] Add RLS for `event_attendees`

## Backend
- [ ] Update `dbService.ts` to handle joining/leaving events
- [ ] Update `fetchEvents` (or separate call) to get attendee counts and avatars

## Frontend (Event Creation)
- [ ] Update `EventCreateModal` to sort shops alphabetically
- [ ] Implement autocomplete/search for shop selection

## Frontend (Event Card)
- [ ] Add "Going" button
- [ ] Display "Going" count
- [ ] Display avatar stack of last 3 attendees
