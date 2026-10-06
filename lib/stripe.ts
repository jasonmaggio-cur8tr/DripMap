import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

// Get Stripe instance (singleton)
export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      console.warn('[Stripe] No publishable key found. Stripe will not be initialized.');
      stripePromise = Promise.resolve(null);
    } else {
      stripePromise = loadStripe(publishableKey);
    }
  }
  return stripePromise;
};

// Check if Stripe is available
export const isStripeAvailable = (): boolean => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  return !!(key && key.startsWith('pk_'));
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (sessionUrl: string): Promise<void> => {
  // Stripe Checkout sessions return a URL to redirect to
  window.location.href = sessionUrl;
};

// Open Stripe Customer Portal
export const openCustomerPortal = async (portalUrl: string): Promise<void> => {
  window.location.href = portalUrl;
};
