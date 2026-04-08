// Edge Function: Create Stripe Checkout Session for DripClub Membership
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin, createSupabaseClient } from '../_shared/supabase.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface CheckoutRequest {
  userId: string;
  priceId: string;
  billingInterval: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('=== DripClub Checkout Request ===');

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);

    if (!authHeader) {
      return errorResponse('Missing authorization header', 401);
    }

    // Get user from auth header
    const supabase = createSupabaseClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('User error:', userError?.message || 'none');
    console.log('User found:', !!user);

    if (userError) {
      return errorResponse(`Auth error: ${userError.message}`, 401);
    }

    if (!user) {
      return errorResponse('No user found in token', 401);
    }

    console.log('User ID:', user.id);

    // Parse request body
    const body: CheckoutRequest = await req.json();
    const { priceId, billingInterval, successUrl, cancelUrl } = body;

    if (!priceId || !successUrl || !cancelUrl) {
      return errorResponse('Missing required fields');
    }

    // Check if user already has a DripClub membership
    const { data: existingMembership } = await supabaseAdmin
      .from('dripclub_memberships')
      .select('id, status, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingMembership?.status === 'active') {
      return errorResponse('You already have an active DripClub membership', 400);
    }

    // Get or create Stripe customer
    let customerId = existingMembership?.stripe_customer_id;

    if (!customerId) {
      // Check profile for existing customer ID
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      customerId = profile?.stripe_customer_id;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          type: 'dripclub_member',
        },
      });
      customerId = customer.id;
    }

    // Create checkout session with first month free trial
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
        trial_period_days: 30, // First month free
        metadata: {
          user_id: user.id,
          billing_interval: billingInterval,
        },
      },
      metadata: {
        user_id: user.id,
        type: 'dripclub_membership',
      },
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error('Error creating DripClub checkout session:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
