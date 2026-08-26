# Stripe Setup Guide for DripMap

This guide outlines the steps needed to complete the Stripe subscription integration.

## Prerequisites

- Stripe account (create at https://stripe.com)
- Supabase project with Edge Functions enabled
- Access to Supabase dashboard

---

## Step 1: Create Stripe Products & Prices

### In Stripe Dashboard (https://dashboard.stripe.com)

1. **Go to Products** > Create Product

2. **Create 3 Products:**

   | Product Name | Description |
   |--------------|-------------|
   | DripMap PRO | Shop subscription for coffee shop owners |
   | DripMap PRO+ | Premium shop subscription with DripClub integration |
   | DripClub Membership | User membership for coffee lovers |

3. **For each product, create 2 Prices:**

   **DripMap PRO:**
   - Monthly: $39.98/month (Recurring)
   - Annual: $444.44/year (Recurring)

   **DripMap PRO+:** (Lower price - shops accept DripClub 10% discount)
   - Monthly: $28.88/month (Recurring)
   - Annual: $298.88/year (Recurring)

   **DripClub Membership:**
   - Monthly: $0.99/month (Recurring)
   - Annual: $9.99/year (Recurring)

4. **Copy the Price IDs** (format: `price_xxxxxxxxxxxx`) for each price

---

## Step 2: Configure Environment Variables

### In your `.env` file:

```env
# Stripe Keys (from Stripe Dashboard > Developers > API Keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxx

# Stripe Price IDs (from Step 1)
VITE_STRIPE_PRICE_SHOP_PRO_MONTHLY=price_xxxxxx
VITE_STRIPE_PRICE_SHOP_PRO_ANNUAL=price_xxxxxx
VITE_STRIPE_PRICE_SHOP_PRO_PLUS_MONTHLY=price_xxxxxx
VITE_STRIPE_PRICE_SHOP_PRO_PLUS_ANNUAL=price_xxxxxx
VITE_STRIPE_PRICE_DRIPCLUB_MONTHLY=price_xxxxxx
VITE_STRIPE_PRICE_DRIPCLUB_ANNUAL=price_xxxxxx

# App URL (for redirects)
VITE_APP_URL=https://your-app-url.com
```

### In Supabase Edge Functions Secrets:

Go to **Supabase Dashboard > Edge Functions > Secrets** and add:

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (created in Step 3)
- `STRIPE_PRICE_SHOP_PRO_MONTHLY`
- `STRIPE_PRICE_SHOP_PRO_ANNUAL`
- `STRIPE_PRICE_SHOP_PRO_PLUS_MONTHLY`
- `STRIPE_PRICE_SHOP_PRO_PLUS_ANNUAL`
- `STRIPE_PRICE_DRIPCLUB_MONTHLY`
- `STRIPE_PRICE_DRIPCLUB_ANNUAL`

---

## Step 3: Set Up Stripe Webhooks

### In Stripe Dashboard > Developers > Webhooks:

1. **Add Endpoint:**
   - URL: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

2. **Copy the Signing Secret** (starts with `whsec_`)

3. **Add to Supabase Edge Functions Secrets** as `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Deploy Edge Functions

### Using Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy all Edge Functions
supabase functions deploy create-shop-checkout
supabase functions deploy create-dripclub-checkout
supabase functions deploy stripe-webhook
supabase functions deploy create-portal-session
supabase functions deploy cancel-subscription
```

---

## Step 5: Run Database Migration

### In Supabase Dashboard > SQL Editor:

1. Open the file: `database/create_subscription_tables.sql`
2. Copy all contents
3. Paste into SQL Editor and run

This creates:
- New columns on `coffee_shops` table
- `dripclub_memberships` table
- `stripe_events` table (for webhook idempotency)
- `subscription_prices` table
- RLS policies
- Helper functions and triggers

---

## Step 6: Configure Stripe Customer Portal

### In Stripe Dashboard > Settings > Billing > Customer Portal:

1. Enable the Customer Portal
2. Configure allowed actions:
   - Update payment methods
   - Cancel subscriptions
   - Switch plans (optional)
3. Customize branding to match DripMap

---

## Step 7: Create Discount Codes (Optional)

Discount codes can be created entirely in Stripe Dashboard - no code changes needed!

### Creating Coupons:

1. Go to **Stripe Dashboard > Products > Coupons**
2. Click **+ New coupon**
3. Configure:

| Setting | Options |
|---------|---------|
| Type | Percentage off / Fixed amount |
| Value | e.g., 100% or $10 |
| Duration | Once / Repeating / Forever |
| Repeating months | 1, 6, 12, etc. |

### Recommended Coupons:

| Name | Discount | Duration | Purpose |
|------|----------|----------|---------|
| First Month Free | 100% | Once | New signups |
| 6 Months Free | 100% | 6 months | Partnerships |
| 12 Months Free | 100% | 12 months | Strategic deals |
| Launch Special | 50% | Forever | Early adopters |

### Creating Promotion Codes:

1. Click on a coupon
2. Go to **Promotion codes** tab
3. Click **+ New promotion code**
4. Set:
   - **Code**: e.g., `WELCOME2025`
   - **Max redemptions**: Limit uses
   - **Expiration**: When it expires
   - **Restrictions**: Limit to specific products

### Built-in Features:

- **DripClub**: Automatically includes 30-day free trial
- **All checkouts**: "Add promotion code" field is enabled
- **Payment Links**: Can pre-apply coupons for direct links

---

## Step 8: Test the Integration

### Test Mode Checklist:

1. **Shop Subscription Flow:**
   - [ ] Claim a shop as an owner
   - [ ] Click upgrade button
   - [ ] Complete checkout with test card `4242 4242 4242 4242`
   - [ ] Verify PRO badge appears
   - [ ] Verify subscription status in database

2. **DripClub Flow:**
   - [ ] Go to `/dripclub` page
   - [ ] Click "Join DripClub"
   - [ ] Verify "30-day free trial" shows at checkout
   - [ ] Complete checkout
   - [ ] Verify member badge on profile
   - [ ] Verify membership in database with `trialing` status

3. **Webhook Events:**
   - [ ] Verify `stripe_events` table is logging events
   - [ ] Test subscription cancellation
   - [ ] Test payment failure (use test card `4000 0000 0000 0341`)

### Test Cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`
- Payment Fail: `4000 0000 0000 0341`

---

## Step 9: Go Live

### Before going live:

1. **Switch to Live Mode in Stripe**
2. **Create live products/prices** (same as test)
3. **Update environment variables** with live keys
4. **Update webhook URL** to use live endpoint
5. **Test with a real card** (refund immediately)

---

## Troubleshooting

### Common Issues:

1. **Checkout fails with "Stripe not configured"**
   - Check `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
   - Ensure it starts with `pk_`

2. **Webhook events not processing**
   - Verify `STRIPE_WEBHOOK_SECRET` is correct
   - Check Edge Function logs in Supabase dashboard
   - Ensure all required secrets are set

3. **Subscription status not updating**
   - Check `stripe_events` table for errors
   - Verify RLS policies allow service role writes

4. **Customer portal not loading**
   - Ensure Customer Portal is enabled in Stripe
   - Check `stripe_customer_id` is saved correctly

---

## Support

For issues with:
- **Stripe**: https://support.stripe.com
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **This implementation**: Contact developer

---

## Files Reference

| File | Purpose |
|------|---------|
| `database/create_subscription_tables.sql` | Database schema |
| `services/subscriptionService.ts` | Frontend service layer |
| `lib/stripe.ts` | Stripe client utilities |
| `components/ShopPricingModal.tsx` | Shop upgrade modal |
| `components/DripClubModal.tsx` | DripClub signup modal |
| `components/DripClubCard.tsx` | Membership display card |
| `pages/DripClub.tsx` | DripClub page |
| `supabase/functions/*/` | Edge Functions |
