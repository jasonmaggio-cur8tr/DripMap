// Edge Function: Cancel Stripe Subscription
import { stripe } from '../_shared/stripe.ts';
import { supabaseAdmin, createSupabaseClient } from '../_shared/supabase.ts';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';

interface CancelRequest {
  subscriptionId: string;
  cancelAtPeriodEnd?: boolean; // true = cancel at end of period, false = cancel immediately
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
    const body: CancelRequest = await req.json();
    const { subscriptionId, cancelAtPeriodEnd = true } = body;

    if (!subscriptionId) {
      return errorResponse('Missing subscription ID');
    }

    // Verify user owns this subscription
    // Check both shop subscriptions and DripClub memberships
    const [shopResult, membershipResult] = await Promise.all([
      supabaseAdmin
        .from('shops')
        .select('id, claimed_by, stripe_subscription_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single(),
      supabaseAdmin
        .from('dripclub_memberships')
        .select('id, user_id, stripe_subscription_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single(),
    ]);

    const isShopOwner = shopResult.data?.claimed_by === user.id;
    const isMembershipOwner = membershipResult.data?.user_id === user.id;

    if (!isShopOwner && !isMembershipOwner) {
      return errorResponse('You do not own this subscription', 403);
    }

    // Cancel subscription in Stripe
    let updatedSubscription;

    if (cancelAtPeriodEnd) {
      // Cancel at end of billing period (graceful)
      updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      // Cancel immediately
      updatedSubscription = await stripe.subscriptions.cancel(subscriptionId);
    }

    // Update local database
    const canceledAt = new Date().toISOString();

    if (isShopOwner && shopResult.data) {
      await supabaseAdmin.from('shops').update({
        subscription_status: cancelAtPeriodEnd ? 'active' : 'canceled',
        cancel_at_period_end: cancelAtPeriodEnd,
        canceled_at: canceledAt,
      }).eq('id', shopResult.data.id);
    }

    if (isMembershipOwner && membershipResult.data) {
      await supabaseAdmin.from('dripclub_memberships').update({
        status: cancelAtPeriodEnd ? 'active' : 'canceled',
        cancel_at_period_end: cancelAtPeriodEnd,
      }).eq('id', membershipResult.data.id);
    }

    return jsonResponse({
      success: true,
      cancelAtPeriodEnd,
      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return errorResponse(error.message || 'Failed to cancel subscription', 500);
  }
});
