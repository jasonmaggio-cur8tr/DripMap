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

`Authorization: Bearer <AGENT_API_KEY>`

The API key is set as a Supabase Edge Function secret. Generate one with:
```bash
openssl rand -hex 32
```

Then set it:
```bash
supabase secrets set AGENT_API_KEY=<your-key>
```

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
- `photos` — at least 3, exactly 1 with `is_primary: true`

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
