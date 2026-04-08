// Edge Function: Create Stripe Customer Portal Session
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin, createSupabaseClient } from '../_shared/supabase.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface PortalRequest {
  customerId: string;
  returnUrl: string;
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

    // Verify user is authenticated
    const supabase = createSupabaseClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // Parse request body
    const body: PortalRequest = await req.json();
    const { customerId, returnUrl } = body;

    if (!customerId || !returnUrl) {
      return errorResponse('Missing required fields');
    }

    // SECURITY: Verify user owns this customer ID
    // Check both shop subscriptions and DripClub memberships
    const [shopResult, membershipResult] = await Promise.all([
      supabaseAdmin
        .from('shops')
        .select('id, claimed_by')
        .eq('stripe_customer_id', customerId)
        .eq('claimed_by', user.id)
        .single(),
      supabaseAdmin
        .from('dripclub_memberships')
        .select('id, user_id')
        .eq('stripe_customer_id', customerId)
        .eq('user_id', user.id)
        .single(),
    ]);

    const ownsShopCustomer = !!shopResult.data;
    const ownsMembershipCustomer = !!membershipResult.data;

    if (!ownsShopCustomer && !ownsMembershipCustomer) {
      console.warn(`User ${user.id} tried to access customer ${customerId} without ownership`);
      return errorResponse('You do not have access to this billing account', 403);
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
});
