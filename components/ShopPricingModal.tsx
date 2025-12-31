import React, { useState } from 'react';
import { BillingInterval, SubscriptionTier } from '../types';
import { formatPrice, getPricing, isStripeConfigured } from '../services/subscriptionService';

interface ShopPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (tier: 'pro' | 'pro_plus', billingInterval: BillingInterval) => void;
  currentTier?: SubscriptionTier;
  isLoading?: boolean;
}

const ShopPricingModal: React.FC<ShopPricingModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  currentTier = 'free',
  isLoading = false,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingInterval>('monthly');
  const [proPlusDiscountEnabled, setProPlusDiscountEnabled] = useState(true);

  if (!isOpen) return null;

  const pricing = getPricing();
  const stripeReady = isStripeConfigured();

  // PRO pricing
  const proMonthly = pricing.shopPro.monthly.amount;
  const proAnnual = pricing.shopPro.annual.amount;
  const proSavings = pricing.shopPro.annual.savings;

  // PRO+ pricing
  const proPlusMonthly = pricing.shopProPlus.monthly.amount;
  const proPlusAnnual = pricing.shopProPlus.annual.amount;
  const proPlusSavings = pricing.shopProPlus.annual.savings;

  const handleSubscribe = (tier: 'pro' | 'pro_plus') => {
    if (!stripeReady) {
      alert('Stripe is not configured. Please contact support.');
      return;
    }
    onSubscribe(tier, billingCycle);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-coffee-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-coffee-900 to-coffee-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-volt-400/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif font-black text-white mb-2">
              Upgrade Your Shop
            </h2>
            <p className="text-coffee-100 text-sm max-w-md mx-auto">
              Unlock powerful tools to grow your coffee shop and connect with more customers
            </p>

            {/* Billing Toggle */}
            <div className="bg-coffee-800/50 p-1.5 rounded-2xl inline-flex mt-6 border border-coffee-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`py-2.5 px-6 rounded-xl text-xs font-black transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-xl text-coffee-900'
                    : 'text-coffee-100 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`py-2.5 px-6 rounded-xl text-xs font-black transition-all duration-300 relative ${
                  billingCycle === 'annual'
                    ? 'bg-white shadow-xl text-coffee-900'
                    : 'text-coffee-100 hover:text-white'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
                  SAVE
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic (Free) Tier */}
            <div className="border-2 border-coffee-100 rounded-3xl p-6 bg-coffee-50/30 flex flex-col">
              <div className="mb-6">
                <span className="bg-coffee-100 text-coffee-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Basic
                </span>
                <h3 className="text-2xl font-serif font-black mt-3 mb-1 text-coffee-900">Owner</h3>
                <p className="text-coffee-800 text-xs">Essentials for claiming your shop</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-coffee-900">$0</span>
                <span className="text-coffee-800 font-bold text-sm">/ forever</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Verified 'Owner' Badge",
                  'Claim Listing Ownership',
                  'Update Hours & Contact',
                  'Standard Vibe Tags',
                  'Up to 3 Gallery Photos',
                ].map((feature, i) => (
                  <li key={i} className="flex gap-2 text-xs text-coffee-800 font-medium">
                    <i className="fas fa-check text-coffee-800"></i>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="w-full py-3 rounded-xl border-2 border-coffee-100 font-bold text-coffee-800 cursor-not-allowed text-sm"
              >
                {currentTier === 'free' ? 'Current Plan' : 'Included Free'}
              </button>
            </div>

            {/* PRO Tier */}
            <div className="border-2 border-purple-200 rounded-3xl p-6 bg-white relative flex flex-col shadow-lg shadow-purple-500/5">
              {currentTier === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full">
                  CURRENT PLAN
                </div>
              )}

              <div className="mb-6">
                <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  PRO
                </span>
                <h3 className="text-2xl font-serif font-black mt-3 mb-1 text-coffee-900">
                  DripMap Pro
                </h3>
                <p className="text-coffee-800 text-xs">Full marketing & engagement suite</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black text-coffee-900">
                  {formatPrice(billingCycle === 'monthly' ? proMonthly : proAnnual)}
                </span>
                <span className="text-coffee-800 font-bold text-sm">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
                {billingCycle === 'annual' && (
                  <p className="text-green-600 text-xs font-bold mt-1">
                    Save {formatPrice(proSavings)} vs monthly
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  { icon: 'fa-calendar', label: 'Event Management' },
                  { icon: 'fa-bullhorn', label: 'Marketing Campaigns' },
                  { icon: 'fa-mug-hot', label: "'Now Brewing' Live Menu" },
                  { icon: 'fa-music', label: 'Spotify Vibe Setter' },
                  { icon: 'fa-link', label: 'Premium Links' },
                  { icon: 'fa-tags', label: 'Custom Vibe Tags' },
                  { icon: 'fa-images', label: 'Unlimited Photos' },
                ].map((f, i) => (
                  <li key={i} className="flex gap-2 text-xs text-coffee-900 font-medium items-center">
                    <div className="bg-purple-100 text-purple-600 w-5 h-5 rounded-md flex items-center justify-center text-[10px]">
                      <i className={`fas ${f.icon}`}></i>
                    </div>
                    {f.label}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe('pro')}
                disabled={isLoading || currentTier === 'pro' || currentTier === 'pro_plus'}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  currentTier === 'pro' || currentTier === 'pro_plus'
                    ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : currentTier === 'pro' ? (
                  'Current Plan'
                ) : currentTier === 'pro_plus' ? (
                  'Downgrade'
                ) : (
                  'Upgrade to PRO'
                )}
              </button>
            </div>

            {/* PRO+ Tier */}
            <div className="border-2 border-volt-400 rounded-3xl p-6 bg-gradient-to-br from-coffee-900 to-coffee-800 relative flex flex-col shadow-xl shadow-volt-400/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-volt-400/20 rounded-full blur-[60px] pointer-events-none"></div>

              {currentTier === 'pro_plus' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-volt-400 text-coffee-900 text-[10px] font-black px-3 py-1 rounded-full">
                  CURRENT PLAN
                </div>
              )}

              <div className="relative z-10">
                <div className="mb-6">
                  <span className="bg-volt-400 text-coffee-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    PRO+
                  </span>
                  <h3 className="text-2xl font-serif font-black mt-3 mb-1 text-white">
                    DripMap Pro+
                  </h3>
                  <p className="text-coffee-100 text-xs">Everything + DripClub integration</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-black text-white">
                    {formatPrice(billingCycle === 'monthly' ? proPlusMonthly : proPlusAnnual)}
                  </span>
                  <span className="text-coffee-100 font-bold text-sm">
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                  {billingCycle === 'annual' && (
                    <p className="text-volt-400 text-xs font-bold mt-1">
                      Save {formatPrice(proPlusSavings)} vs monthly
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex gap-2 text-xs text-coffee-100 font-medium items-center">
                    <div className="bg-volt-400/20 text-volt-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px]">
                      <i className="fas fa-check"></i>
                    </div>
                    Everything in PRO
                  </li>
                  {[
                    { icon: 'fa-percent', label: 'DripClub Partner Badge' },
                    { icon: 'fa-users', label: 'Member Discovery Priority' },
                    { icon: 'fa-chart-line', label: 'Member Analytics' },
                  ].map((f, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-xs text-coffee-100 font-medium items-center"
                    >
                      <div className="bg-volt-400/20 text-volt-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px]">
                        <i className={`fas ${f.icon}`}></i>
                      </div>
                      {f.label}
                    </li>
                  ))}
                </ul>

                {/* DripClub Discount Toggle */}
                <div className="bg-white/10 rounded-xl p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proPlusDiscountEnabled}
                      onChange={(e) => setProPlusDiscountEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-volt-400"
                    />
                    <div>
                      <p className="text-white text-xs font-bold">Offer 10% DripClub Discount</p>
                      <p className="text-coffee-100 text-[10px] mt-0.5">
                        Required for PRO+. DripClub members get 10% off at your shop.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => handleSubscribe('pro_plus')}
                  disabled={isLoading || currentTier === 'pro_plus' || !proPlusDiscountEnabled}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    currentTier === 'pro_plus'
                      ? 'bg-volt-400/30 text-volt-400/50 cursor-not-allowed'
                      : !proPlusDiscountEnabled
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-volt-400 text-coffee-900 hover:bg-volt-500 active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : currentTier === 'pro_plus' ? (
                    'Current Plan'
                  ) : !proPlusDiscountEnabled ? (
                    'Enable Discount to Subscribe'
                  ) : (
                    'Upgrade to PRO+'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-coffee-800 text-xs mt-8">
            All plans include 24/7 support. Cancel anytime.{' '}
            {!stripeReady && (
              <span className="text-amber-500">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Stripe not configured - contact admin
              </span>
            )}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-[160]"
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default ShopPricingModal;
