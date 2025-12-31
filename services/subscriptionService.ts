import { supabase } from '../lib/supabase';
import {
  DripClubMembership,
  SubscriptionTier,
  SubscriptionStatus,
  BillingInterval,
  SubscriptionPrice,
  DEFAULT_PRICING,
} from '../types';

// ==================== STRIPE CONFIGURATION ====================

// Get Stripe config from environment variables
export const getStripeConfig = () => ({
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  prices: {
    shopPro: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_SHOP_PRO_MONTHLY || '',
      annual: import.meta.env.VITE_STRIPE_PRICE_SHOP_PRO_ANNUAL || '',
    },
    shopProPlus: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_SHOP_PRO_PLUS_MONTHLY || '',
      annual: import.meta.env.VITE_STRIPE_PRICE_SHOP_PRO_PLUS_ANNUAL || '',
    },
    dripClub: {
      monthly: import.meta.env.VITE_STRIPE_PRICE_DRIPCLUB_MONTHLY || '',
      annual: import.meta.env.VITE_STRIPE_PRICE_DRIPCLUB_ANNUAL || '',
    },
  },
  // Use dynamic origin in browser, fallback for SSR
  appUrl: typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_APP_URL || 'http://localhost:5173'),
});

// Check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  const config = getStripeConfig();
  return !!(config.publishableKey && config.publishableKey.startsWith('pk_'));
};

// ==================== PRICING ====================

// Get pricing with price IDs populated from env
export const getPricing = () => {
  const config = getStripeConfig();

  return {
    shopPro: {
      monthly: {
        amount: DEFAULT_PRICING.shopPro.monthly.amount,
        priceId: config.prices.shopPro.monthly,
      },
      annual: {
        amount: DEFAULT_PRICING.shopPro.annual.amount,
        priceId: config.prices.shopPro.annual,
        savings: DEFAULT_PRICING.shopPro.annual.savings,
      },
    },
    shopProPlus: {
      monthly: {
        amount: DEFAULT_PRICING.shopProPlus.monthly.amount,
        priceId: config.prices.shopProPlus.monthly,
      },
      annual: {
        amount: DEFAULT_PRICING.shopProPlus.annual.amount,
        priceId: config.prices.shopProPlus.annual,
        savings: DEFAULT_PRICING.shopProPlus.annual.savings,
      },
    },
    dripClub: {
      monthly: {
        amount: DEFAULT_PRICING.dripClub.monthly.amount,
        priceId: config.prices.dripClub.monthly,
      },
      annual: {
        amount: DEFAULT_PRICING.dripClub.annual.amount,
        priceId: config.prices.dripClub.annual,
        savings: DEFAULT_PRICING.dripClub.annual.savings,
      },
    },
  };
};

// Format price for display (cents to dollars)
export const formatPrice = (cents: number): string => {
  return `$${(cents / 100).toFixed(2)}`;
};

// ==================== SHOP SUBSCRIPTION ====================

// Get shop subscription status
export const getShopSubscription = async (shopId: string) => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select(
        'subscription_tier, subscription_status, pro_plus_discount_enabled, stripe_customer_id, stripe_subscription_id, subscription_current_period_end'
      )
      .eq('id', shopId)
      .single();

    if (error) throw error;

    return {
      tier: (data?.subscription_tier || 'free') as SubscriptionTier,
      status: (data?.subscription_status || 'inactive') as SubscriptionStatus,
      proPlusDiscountEnabled: data?.pro_plus_discount_enabled || false,
      stripeCustomerId: data?.stripe_customer_id,
      stripeSubscriptionId: data?.stripe_subscription_id,
      currentPeriodEnd: data?.subscription_current_period_end,
    };
  } catch (error) {
    console.error('[subscriptionService] Error fetching shop subscription:', error);
    return null;
  }
};

// Check if shop has active PRO or PRO+ subscription
export const isShopPro = (tier?: SubscriptionTier, status?: SubscriptionStatus): boolean => {
  return (tier === 'pro' || tier === 'pro_plus') && status === 'active';
};

// Check if shop has active PRO+ subscription
export const isShopProPlus = (tier?: SubscriptionTier, status?: SubscriptionStatus): boolean => {
  return tier === 'pro_plus' && status === 'active';
};

// Update shop's PRO+ discount opt-in preference
export const updateProPlusDiscountEnabled = async (
  shopId: string,
  enabled: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shops')
      .update({ pro_plus_discount_enabled: enabled })
      .eq('id', shopId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[subscriptionService] Error updating discount preference:', error);
    return false;
  }
};

// ==================== DRIPCLUB MEMBERSHIP ====================

// Get user's DripClub membership
export const getDripClubMembership = async (
  userId: string
): Promise<DripClubMembership | null> => {
  try {
    const { data, error } = await supabase
      .from('dripclub_memberships')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status as SubscriptionStatus,
      planType: data.plan_type as BillingInterval,
      stripeCustomerId: data.stripe_customer_id,
      stripeSubscriptionId: data.stripe_subscription_id,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('[subscriptionService] Error fetching DripClub membership:', error);
    return null;
  }
};

// Check if user has active DripClub membership
export const isDripClubMember = async (userId: string): Promise<boolean> => {
  const membership = await getDripClubMembership(userId);
  return membership?.status === 'active';
};

// ==================== PRO+ LOCATION DISCOVERY ====================

// Get all PRO+ shops that offer DripClub discount
export const getProPlusShopsWithDiscount = async () => {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('subscription_tier', 'pro_plus')
      .eq('subscription_status', 'active')
      .eq('pro_plus_discount_enabled', true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[subscriptionService] Error fetching PRO+ shops:', error);
    return [];
  }
};

// ==================== CHECKOUT SESSIONS ====================
// Note: These functions will call Supabase Edge Functions
// The Edge Functions handle Stripe API calls securely

// Create checkout session for shop subscription
export const createShopCheckoutSession = async (
  shopId: string,
  tier: 'pro' | 'pro_plus',
  billingInterval: BillingInterval
): Promise<{ url: string } | { error: string }> => {
  try {
    const config = getStripeConfig();
    const pricing = getPricing();

    // Get the correct price ID
    const priceId =
      tier === 'pro'
        ? pricing.shopPro[billingInterval].priceId
        : pricing.shopProPlus[billingInterval].priceId;

    if (!priceId) {
      return { error: 'Stripe prices not configured. Please contact support.' };
    }

    // Verify user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { error: 'Please sign in to continue.' };
    }

    // Call Edge Function to create checkout session
    const { data, error } = await supabase.functions.invoke('create-shop-checkout', {
      body: {
        shopId,
        priceId,
        tier,
        billingInterval,
        successUrl: `${config.appUrl}/#/shop/${shopId}?subscription=success`,
        cancelUrl: `${config.appUrl}/#/shop/${shopId}?subscription=canceled`,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    return { url: data.url };
  } catch (error: any) {
    console.error('[subscriptionService] Error creating shop checkout:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }
};

// Create checkout session for DripClub membership
export const createDripClubCheckoutSession = async (
  userId: string,
  billingInterval: BillingInterval
): Promise<{ url: string } | { error: string }> => {
  try {
    const config = getStripeConfig();
    const pricing = getPricing();

    const priceId = pricing.dripClub[billingInterval].priceId;

    if (!priceId) {
      return { error: 'Stripe prices not configured. Please contact support.' };
    }

    // Verify user is authenticated before calling edge function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { error: 'Please sign in to continue.' };
    }

    // Call Edge Function to create checkout session
    // Explicitly pass the Authorization header with the access token
    const { data, error } = await supabase.functions.invoke('create-dripclub-checkout', {
      body: {
        userId,
        priceId,
        billingInterval,
        successUrl: `${config.appUrl}/#/dripclub?dripclub=success`,
        cancelUrl: `${config.appUrl}/#/dripclub?checkout=canceled`,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('[subscriptionService] Edge function error:', error);
      const errorMessage = typeof error === 'object' && error.message
        ? error.message
        : 'Failed to create checkout session';
      return { error: errorMessage };
    }

    if (!data?.url) {
      return { error: data?.error || 'No checkout URL returned' };
    }

    return { url: data.url };
  } catch (error: any) {
    console.error('[subscriptionService] Error creating DripClub checkout:', error);
    return { error: error.message || 'Failed to create checkout session' };
  }
};

// ==================== SUBSCRIPTION MANAGEMENT ====================

// Cancel subscription (calls Edge Function)
export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      console.error('[subscriptionService] Not authenticated');
      return false;
    }

    const { error } = await supabase.functions.invoke('cancel-subscription', {
      body: {
        subscriptionId,
        cancelAtPeriodEnd,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('[subscriptionService] Error canceling subscription:', error);
    return false;
  }
};

// Get customer portal URL for managing subscription
export const getCustomerPortalUrl = async (
  customerId: string,
  returnUrl: string
): Promise<{ url: string } | { error: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { error: 'Please sign in to continue.' };
    }

    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: {
        customerId,
        returnUrl,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) throw error;
    return { url: data.url };
  } catch (error: any) {
    console.error('[subscriptionService] Error creating portal session:', error);
    return { error: error.message || 'Failed to create portal session' };
  }
};

// ==================== SUBSCRIPTION STATUS HELPERS ====================

export const getSubscriptionStatusLabel = (status: SubscriptionStatus): string => {
  const labels: Record<SubscriptionStatus, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    inactive: 'Inactive',
  };
  return labels[status] || 'Unknown';
};

export const getSubscriptionStatusColor = (
  status: SubscriptionStatus
): { bg: string; text: string } => {
  const colors: Record<SubscriptionStatus, { bg: string; text: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-800' },
    trialing: { bg: 'bg-blue-100', text: 'text-blue-800' },
    past_due: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    canceled: { bg: 'bg-gray-100', text: 'text-gray-800' },
    unpaid: { bg: 'bg-red-100', text: 'text-red-800' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-500' },
  };
  return colors[status] || colors.inactive;
};

export const getTierLabel = (tier: SubscriptionTier): string => {
  const labels: Record<SubscriptionTier, string> = {
    free: 'Basic',
    pro: 'PRO',
    pro_plus: 'PRO+',
  };
  return labels[tier] || 'Basic';
};

export const getTierColor = (tier: SubscriptionTier): { bg: string; text: string } => {
  const colors: Record<SubscriptionTier, { bg: string; text: string }> = {
    free: { bg: 'bg-gray-100', text: 'text-gray-600' },
    pro: { bg: 'bg-purple-600', text: 'text-white' },
    pro_plus: { bg: 'bg-gradient-to-r from-purple-600 to-volt-400', text: 'text-white' },
  };
  return colors[tier] || colors.free;
};
