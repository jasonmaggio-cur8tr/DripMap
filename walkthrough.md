# Event Improvements & Friendly URLs Walkthrough

I have implemented two major features: **Friendly Shop URLs** and **Event "Going" Functionality**.

## 1. SQL Migration

I created a migration script to add the `event_attendees` table.

- **File**: `005-add-event-attendees.sql`
- **Action**: You must run this in your Supabase SQL Editor.

## 2. Friendly URLs (Slugs)

Shops can now be accessed via readable URLs like `/shop/daily-grind` instead of UUIDs.

- **Changes**:
    - Updated `Shop` interface to include `slug`.
    - Updated `dbService` to fetch shops by slug OR id.
    - Updated `ShopCard` to link to slugs.
    - Updated `ShopDetail` to resolve slugs.

## 3. Event Improvements

### Enhanced Shop Selection
When creating an event, you can now **filter/search** for a shop by name, and the list is **sorted alphabetically**.

- **File**: `EventCreateModal.tsx`
- **Feature**: Added a filter input above the shop select dropdown.

### "Going" Feature
Users can now RSVP to events directly from the card.

- **File**: `EventCard.tsx`
- **Feature**:
    - **"Going" Button**: Toggles your attendance status.
    - **Attendee Stack**: Shows avatars of the last 3 people who joined.
    - **Count**: Shows total attendee count (e.g., "You and 5 others").

### Backend Updates
- **File**: `dbService.ts`
- **API**:
    - `joinEvent(eventId, userId)`
    - `leaveEvent(eventId, userId)`
    - `fetchEvents` now includes `event_attendees` data.

## Verification
The application builds successfully (ignoring a pre-existing script error).

### Manual Test Plan
1.  **Run Migration**: Execute `005-add-event-attendees.sql`.
2.  **Create Event**: Open the "Create Event" modal. Type in the shop filter to find a shop.
3.  **Join Event**: Click "I'm Going" on an event card. Verify the count increases and your avatar appears.
4.  **Refresh**: Reload the page to ensure the state persists.
5.  **Navigation**: Click a shop name to verify the URL is now `/shop/shop-slug`.
