# Admin Shop Queue

The shop queue is how new listings get onto DripMap. An external agent (Cowork) researches shops and submits drafts via API. The admin reviews, edits, and publishes them.

---

## Lifecycle

```
Agent POSTs draft via Edge Function
        |
        v
  [pending_review] ──> Admin reviews at /admin/shop-queue/:id
        |
        ├── Approve & Publish ──> [published]
        |     - Geocodes address if lat/lng missing
        |     - Copies photos to Supabase Storage
        |     - Creates shops row
        |     - Fires Loops "shop_listed" event (if email present)
        |
        ├── Approve, Hold for Email ──> [approved]
        |     - No live shop created yet
        |     - Admin adds email later, then publishes
        |
        ├── Reject ──> [rejected]
        |     - Admin leaves review notes
        |
        └── Needs More Info ──> [needs_more_info]
              - Signals this needs human research
```

## Statuses

| Status | Meaning |
|--------|---------|
| `pending_review` | Agent submitted, awaiting admin review |
| `approved` | Admin approved but not yet published (usually waiting for email) |
| `published` | Live on DripMap — shops row exists |
| `rejected` | Not a fit — review notes explain why |
| `needs_more_info` | Needs more research before deciding |

## Agent API

### Authentication

The edge function supports **dual authentication**:

1. **Agent auth:** `Authorization: Bearer <AGENT_API_KEY>` — for automated submissions and photo uploads.
2. **Admin auth:** `Authorization: Bearer <supabase-session-jwt>` — for admin UI operations (photo management). The backend verifies the JWT and checks `profiles.is_admin`.

The API key is set as a Supabase Edge Function secret. Generate and save it in one step:
```bash
KEY=$(openssl rand -hex 32) && echo "$KEY" && supabase secrets set AGENT_API_KEY="$KEY"
```

Save the printed value in 1Password (or similar) under "DripMap Agent API Key" — the Cowork agent will need it to authenticate.

### Submit a Draft

```
POST https://<project-ref>.supabase.co/functions/v1/shop-drafts
```

```json
{
  "agent_run_id": "run_2026-05-08_abc123",
  "submitted_by": "agent:instagram-saved",
  "shop": {
    "name": "Blueprint Coffee",
    "neighborhood": "Wicker Park",
    "city": "Chicago",
    "state": "IL",
    "country": "US",
    "address": "1234 N Damen Ave, Chicago, IL 60622",
    "description": "Tucked into a corner of Wicker Park...",
    "website_url": "https://blueprintcoffee.com",
    "instagram_url": "https://instagram.com/blueprintcoffee",
    "yelp_url": "https://yelp.com/biz/blueprint-coffee",
    "google_maps_url": "https://maps.google.com/...",
    "phone": "+13125551234",
    "known_for": ["pour-over", "single-origin espresso"],
    "vibe_tags": ["minimalist", "plant-filled"],
    "email": "hello@blueprintcoffee.com",
    "email_source": "website"
  },
  "photos": [
    {
      "url": "https://...jpg",
      "source": "instagram",
      "source_url": "https://instagram.com/p/abc",
      "attribution": "@blueprintcoffee",
      "is_primary": true
    },
    {
      "url": "https://...jpg",
      "source": "yelp",
      "source_url": "https://yelp.com/...",
      "attribution": "Yelp / Jane D."
    },
    {
      "url": "https://...jpg",
      "source": "website"
    }
  ],
  "dm_template": "Saw your pour-over flight — the Ethiopia natural..."
}
```

### Required Fields

- `submitted_by` — identifies the source
- `shop.name`
- `shop.neighborhood`
- `shop.instagram_url`
- `shop.description`
- `photos` — **optional at draft creation**. Can be zero, one, or more. At most 1 may be `is_primary: true`.

> **Photo requirements move to approval time:** a draft cannot be approved or published until it has ≥3 photos with exactly 1 marked primary. Drafts with fewer photos appear in the admin queue with a **"Needs photos"** badge. The admin adds photos via the detail view before approving.

### Response

**201 Created:**
```json
{
  "id": "uuid",
  "status": "pending_review",
  "admin_url": "https://dripmap.space/admin/shop-queue/uuid",
  "warnings": ["description is 87 words (recommended: 100-200)"]
}
```

**422 Validation Error:**
```json
{
  "errors": [{ "field": "shop.neighborhood", "message": "required" }],
  "warnings": []
}
```

### Fetch a Draft

```
GET https://<project-ref>.supabase.co/functions/v1/shop-drafts/<id>
```

Same auth header. Returns the full draft with photos.

## curl Example

```bash
curl -X POST \
  https://zxetnactllyzslievgxj.supabase.co/functions/v1/shop-drafts \
  -H "Authorization: Bearer YOUR_AGENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "submitted_by": "agent:instagram-saved",
    "shop": {
      "name": "Test Coffee Shop",
      "neighborhood": "Arts District",
      "city": "Los Angeles",
      "state": "CA",
      "country": "US",
      "description": "A specialty coffee shop in the heart of the Arts District...",
      "instagram_url": "https://instagram.com/testcoffee"
    },
    "photos": [
      {"url": "https://picsum.photos/800/600?1", "source": "instagram", "is_primary": true},
      {"url": "https://picsum.photos/800/600?2", "source": "website"},
      {"url": "https://picsum.photos/800/600?3", "source": "yelp"}
    ]
  }'
```

### Photo Upload Endpoint

Agents can upload photos (e.g. screenshots captured via Chrome MCP) to get permanent URLs for use in draft submissions.

```
POST https://<project-ref>.supabase.co/functions/v1/shop-drafts/upload-photo
```

**Auth:** `Authorization: Bearer <AGENT_API_KEY>` (same key as other endpoints).

**Request:** `multipart/form-data` with:
- `file` (required) — image file. Allowed types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`. Max 8MB. Content type is verified by magic bytes, not file extension.
- `source` (optional) — e.g. `instagram`, `website`, `yelp`, `manual`.
- `attribution` (optional) — e.g. `@shopname on Instagram`.

**Response (201):**
```json
{
  "url": "https://<project>.supabase.co/storage/v1/object/public/agent-uploads/2026/05/08/abc123.jpg",
  "path": "agent-uploads/2026/05/08/abc123.jpg",
  "size": 248123,
  "content_type": "image/jpeg",
  "source": "instagram",
  "attribution": "@blueprintcoffee",
  "expires_at": null
}
```

**Errors:** `400` (missing file / unsupported type), `401` (bad auth), `413` (file too large), `500` (storage error).

**curl example:**
```bash
curl -X POST "$DRIPMAP_FUNCTION_URL/upload-photo" \
  -H "Authorization: Bearer $DRIPMAP_AGENT_API_KEY" \
  -F "file=@/path/to/screenshot.jpg" \
  -F "source=instagram" \
  -F "attribution=@blueprintcoffee"
```

The returned `url` can then be used in the `photos` array when POSTing a draft. On approval, the existing photo-copy step picks it up from the `agent-uploads` bucket the same way it handles any external URL.

**Storage:** Photos are stored in the `agent-uploads` bucket at `<YYYY>/<MM>/<DD>/<random-id>.<ext>`. Original filenames are discarded for safety.

## Approval

A draft **cannot be approved or published** until it meets the photo requirements:
- At least 3 photos attached
- Exactly 1 photo marked as primary

In the admin UI:
- Drafts with <3 photos show a **"Needs photos"** badge in the queue list
- The detail view shows how many more photos are needed
- "Approve & Publish" and "Approve, Hold for Email" buttons are disabled with an explanation until photos are ready
- The backend also enforces this: attempting to approve or publish with insufficient photos returns an error

## Managing Photos in the Admin Queue

The admin detail view (`/admin/shop-queue/:id`) includes a full photo management panel. Admins can add, remove, reorder, and set primary photos before approving a draft.

### Adding photos

- **Drag & drop / file picker:** Drop image files onto the dropzone or click to browse. Files are uploaded to `agent-uploads` storage and linked to the draft automatically.
- **Paste a URL:** Enter an image URL and click "Add". The backend validates the URL returns an `image/*` content type before accepting it.

### Photo controls

- **Set primary:** Click the star icon on any photo to make it the primary image. The backend enforces the single-primary invariant — setting a new primary automatically unsets the old one.
- **Delete:** Click the trash icon to remove a photo from the draft.
- **Drag to reorder:** Drag photos by their handle to change display order. Order is saved via the reorder endpoint.

### Photo CRUD API

All endpoints support dual auth: agent Bearer token **or** admin Supabase session JWT.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/:id/photos` | `{ url, source?, source_url?, attribution?, is_primary? }` | Add a photo by URL |
| `DELETE` | `/:id/photos/:photoId` | — | Remove a photo |
| `PATCH` | `/:id/photos/:photoId` | `{ is_primary?, source?, attribution? }` | Update photo metadata |
| `POST` | `/:id/photos/reorder` | `{ photo_ids: string[] }` | Set display order |

**Photo add validation:** The backend issues a HEAD request to the provided URL and checks that the response `content-type` starts with `image/`. Non-image URLs are rejected with a 400 error.

**Single-primary invariant:** When `is_primary: true` is set on a photo (via add or patch), all other photos for that draft are automatically set to `is_primary: false`.

## Adding a Shop Manually

1. Go to `/admin/shop-queue`
2. (Future: "Add Draft" button — for now, use the API with `submitted_by: "admin:<your-id>"`)
3. Review and edit all fields
4. Approve & Publish

## Environment Variables

Set these as Supabase Edge Function secrets:

| Variable | Purpose |
|----------|---------|
| `AGENT_API_KEY` | Bearer token for the agent API |
| `LOOPS_API_KEY` | Already set — used by loops-proxy |
| `APP_URL` | Base URL for generated links (default: https://dripmap.space) |

## Database Tables

- `shop_drafts` — draft listings with workflow status and outreach fields
- `shop_draft_photos` — photos attached to drafts (separate from shop_images)
- `shop_draft_audit_log` — every status change and edit is logged

Run `migrations/007_shop_drafts_and_queue.sql` in the Supabase SQL Editor.

## Loops Transactional Emails (required before first approval)

Two transactional emails in Loops.so power outreach:

### "Shop Listed Notification"
- **Transactional ID:** `cmoxfdi3p06np0i0tuaow5yw4`
- Fires when a draft is published and the shop has an email address.

### "Shop Listed Late Notification"
- **Transactional ID:** `cmoxfngrk08jk0iy5w6o1d55a`
- Fires when an email is added to an already-published draft.

Both use the same template with data variables: `shopName`, `shopClaimUrl`, `neighborhood`, `city`.

The code calls the Loops Transactional API (via `loops-proxy` Edge Function), not the Events API.

## Deployment Checklist

1. Run migration 007 in Supabase SQL Editor
1b. Create the `agent-uploads` Storage bucket in Supabase Dashboard → Storage → New bucket:
    - Name: `agent-uploads`
    - Public: **Yes** (these are non-sensitive shop photos)
    - File size limit: 8MB
    - Allowed MIME types: `image/jpeg, image/png, image/webp, image/heic`
2. Generate and store the agent API key:
   ```bash
   KEY=$(openssl rand -hex 32) && echo "$KEY" && supabase secrets set AGENT_API_KEY="$KEY"
   ```
3. Save the key in 1Password under "DripMap Agent API Key"
4. Deploy the Edge Function (must use `--no-verify-jwt` since the function handles its own Bearer token auth):
   ```bash
   supabase functions deploy shop-drafts --no-verify-jwt
   ```
5. Create Loops transactional emails "Shop Listed Notification" and "Shop Listed Late Notification"
6. Smoke test with the curl example above (replace `YOUR_AGENT_API_KEY`)
7. Check `/admin/shop-queue` — the test draft should appear
8. Share the function URL with Cowork for agent integration:
   `https://zxetnactllyzslievgxj.supabase.co/functions/v1/shop-drafts`
