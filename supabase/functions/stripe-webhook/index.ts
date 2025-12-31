// Edge Function: Handle Stripe Webhooks
import { stripe, webhookSecret, getPriceToTierMap } from '../_shared/stripe.ts';
import { supabaseAdmin } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return errorResponse('Missing stripe-signature header', 400);
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return errorResponse(`Webhook Error: ${err.message}`, 400);
    }

    // Check for duplicate event (idempotency)
    const { data: existingEvent } = await supabaseAdmin
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .single();

    if (existingEvent) {
      console.log('Duplicate event, skipping:', event.id);
      return jsonResponse({ received: true, duplicate: true });
    }

    // Store event for idempotency
    await supabaseAdmin.from('stripe_events').insert({
      id: event.id,
      type: event.type,
      payload: event.data.object,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return jsonResponse({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return errorResponse(error.message || 'Webhook handler failed', 500);
  }
});

// Handle checkout.session.completed
async function handleCheckoutCompleted(session: any) {
  const metadata = session.metadata;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (metadata.type === 'shop_subscription') {
    // Shop PRO/PRO+ subscription
    const shopId = metadata.shop_id;
    const tier = metadata.tier;

    await supabaseAdmin.from('shops').update({
      subscription_tier: tier,
      subscription_status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    }).eq('id', shopId);

    console.log(`Shop ${shopId} upgraded to ${tier}`);
  } else if (metadata.type === 'dripclub_membership') {
    // DripClub membership
    const userId = metadata.user_id;

    // Upsert membership record
    await supabaseAdmin.from('dripclub_memberships').upsert({
      user_id: userId,
      status: 'active',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan_type: metadata.billing_interval || 'monthly',
      current_period_start: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

    console.log(`User ${userId} joined DripClub`);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription: any) {
  const metadata = subscription.metadata;
  const status = mapStripeStatus(subscription.status);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
  const cancelAtPeriodEnd = subscription.cancel_at_period_end;

  if (metadata.shop_id) {
    // Shop subscription
    await supabaseAdmin.from('shops').update({
      subscription_status: status,
      subscription_current_period_end: currentPeriodEnd,
    }).eq('id', metadata.shop_id);
  } else if (metadata.user_id) {
    // DripClub subscription
    await supabaseAdmin.from('dripclub_memberships').update({
      status: status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
    }).eq('user_id', metadata.user_id);
  }
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription: any) {
  const metadata = subscription.metadata;

  if (metadata.shop_id) {
    // Shop subscription canceled
    await supabaseAdmin.from('shops').update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
    }).eq('id', metadata.shop_id);

    console.log(`Shop ${metadata.shop_id} subscription canceled`);
  } else if (metadata.user_id) {
    // DripClub membership canceled
    await supabaseAdmin.from('dripclub_memberships').update({
      status: 'canceled',
    }).eq('user_id', metadata.user_id);

    console.log(`User ${metadata.user_id} DripClub membership canceled`);
  }
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  // Get subscription to find metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const metadata = subscription.metadata;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();

  if (metadata.shop_id) {
    await supabaseAdmin.from('shops').update({
      subscription_status: 'active',
      subscription_current_period_end: currentPeriodEnd,
    }).eq('id', metadata.shop_id);
  } else if (metadata.user_id) {
    await supabaseAdmin.from('dripclub_memberships').update({
      status: 'active',
      current_period_end: currentPeriodEnd,
    }).eq('user_id', metadata.user_id);
  }
}

// Handle failed payment
async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const metadata = subscription.metadata;

  if (metadata.shop_id) {
    await supabaseAdmin.from('shops').update({
      subscription_status: 'past_due',
    }).eq('id', metadata.shop_id);
  } else if (metadata.user_id) {
    await supabaseAdmin.from('dripclub_memberships').update({
      status: 'past_due',
    }).eq('user_id', metadata.user_id);
  }
}

// Map Stripe status to our status
function mapStripeStatus(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'inactive',
    incomplete_expired: 'inactive',
    paused: 'inactive',
  };
  return statusMap[stripeStatus] || 'inactive';
}
