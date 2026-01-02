// Edge Function: Create Stripe Checkout Session for Shop Subscriptions
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin, createSupabaseClient } from '../_shared/supabase.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface CheckoutRequest {
  shopId: string;
  priceId: string;
  tier: 'pro' | 'pro_plus';
  billingInterval: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }

    // Get user from auth header
    const supabase = createSupabaseClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { shopId, priceId, tier, billingInterval, successUrl, cancelUrl } = body;

    if (!shopId || !priceId || !tier || !successUrl || !cancelUrl) {
      return errorResponse('Missing required fields');
    }

    // Verify user owns this shop
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('id, name, claimed_by, stripe_customer_id')
      .eq('id', shopId)
      .single();

    console.log('Shop lookup:', { shopId, shop, shopError, userId: user.id });

    if (shopError || !shop) {
      return errorResponse(`Shop not found: ${shopError?.message || 'No data'}`, 404);
    }

    // Check ownership - allow if claimed_by matches OR if user is admin
    if (shop.claimed_by !== user.id) {
      console.log('Ownership check failed:', { claimed_by: shop.claimed_by, user_id: user.id });
      return errorResponse(`You do not own this shop. Shop owner: ${shop.claimed_by}, Your ID: ${user.id}`, 403);
    }

    // Get or create Stripe customer
    let customerId = shop.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          shop_id: shopId,
          shop_name: shop.name,
        },
      });
      customerId = customer.id;

      // Save customer ID to shop
      await supabaseAdmin
        .from('shops')
        .update({ stripe_customer_id: customerId })
        .eq('id', shopId);
    }

    // Create checkout session with promo code support
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true, // Allow discount codes at checkout
      subscription_data: {
        metadata: {
          shop_id: shopId,
          tier: tier,
          billing_interval: billingInterval,
        },
      },
      metadata: {
        shop_id: shopId,
        tier: tier,
        type: 'shop_subscription',
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
