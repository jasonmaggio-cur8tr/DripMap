import React, { useState } from 'react';
import { BillingInterval, SubscriptionTier } from '../types';
import { formatPrice, getPricing, isStripeConfigured } from '../services/subscriptionService';
import { useToast } from '../context/ToastContext';

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
  const { toast } = useToast();

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
      toast.error('Stripe is not configured. Please contact support.');
      return;
    }
    onSubscribe(tier, billingCycle);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-coffee-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Close Button - Fixed position outside scrollable area */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 md:absolute md:top-6 md:right-6 bg-coffee-900/80 hover:bg-coffee-900 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors z-[160] shadow-lg"
      >
        <i className="fas fa-times text-lg"></i>
      </button>

      <div
        className="w-full max-w-5xl rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] overflow-y-auto border border-white/[0.09]"
        style={{ background: '#221a14' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-coffee-900 to-coffee-800 p-6 md:p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-volt-400/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-serif font-black mb-2" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
              Upgrade Your Shop
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: '#e4ddce' }}>
              Unlock powerful tools to grow your coffee and/or tea shop and connect with more customers
            </p>

            {/* Billing Toggle */}
            <div className="p-1.5 rounded-2xl inline-flex mt-6 border border-white/[0.09]" style={{ background: '#2f251d' }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`py-2.5 px-6 rounded-xl text-xs font-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-volt-400 ${
                  billingCycle === 'monthly'
                    ? 'bg-volt-400 shadow-xl text-[#231b15]'
                    : 'text-[#e4ddce] hover:text-[#f3efe0]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`py-2.5 px-6 rounded-xl text-xs font-black transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-volt-400 ${
                  billingCycle === 'annual'
                    ? 'bg-volt-400 shadow-xl text-[#231b15]'
                    : 'text-[#e4ddce] hover:text-[#f3efe0]'
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
        <div className="p-4 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic (Free) Tier */}
            <div className="border border-white/[0.09] rounded-3xl p-6 flex flex-col" style={{ background: '#2b221b' }}>
              <div className="mb-6">
                <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest" style={{ background: '#2f251d', color: '#e4ddce' }}>
                  Basic
                </span>
                <h3 className="text-2xl font-serif font-black mt-3 mb-1" style={{ color: '#f3efe0' }}>Owner</h3>
                <p className="text-xs" style={{ color: 'rgba(243,239,224,0.55)' }}>Essentials for claiming your shop</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black" style={{ color: '#f3efe0' }}>$0</span>
                <span className="font-bold text-sm" style={{ color: 'rgba(243,239,224,0.5)' }}>/ forever</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Verified 'Owner' Badge",
                  'Claim Listing Ownership',
                  'Update Hours & Contact',
                  'Standard Vibe Tags',
                  'Up to 3 Gallery Photos',
                ].map((feature, i) => (
                  <li key={i} className="flex gap-2 text-xs font-medium" style={{ color: '#e4ddce' }}>
                    <i className="fas fa-check" style={{ color: 'rgba(243,239,224,0.5)' }}></i>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="w-full py-3 rounded-full border border-white/[0.09] font-bold cursor-not-allowed text-sm"
                style={{ color: 'rgba(243,239,224,0.5)' }}
              >
                {currentTier === 'free' ? 'Current Plan' : 'Included Free'}
              </button>
            </div>

            {/* PRO Tier */}
            <div className="border-2 border-purple-500/40 rounded-3xl p-6 relative flex flex-col shadow-lg shadow-purple-500/5" style={{ background: '#2b221b' }}>
              {currentTier === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full">
                  CURRENT PLAN
                </div>
              )}

              <div className="mb-6">
                <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  PRO
                </span>
                <h3 className="text-2xl font-serif font-black mt-3 mb-1" style={{ color: '#f3efe0' }}>
                  DripMap Pro
                </h3>
                <p className="text-xs" style={{ color: 'rgba(243,239,224,0.55)' }}>Full marketing & engagement suite</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-black" style={{ color: '#f3efe0' }}>
                  {formatPrice(billingCycle === 'monthly' ? proMonthly : proAnnual)}
                </span>
                <span className="font-bold text-sm" style={{ color: 'rgba(243,239,224,0.5)' }}>
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
                {billingCycle === 'annual' && (
                  <p className="text-xs font-bold mt-1" style={{ color: '#4ade80' }}>
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
                  <li key={i} className="flex gap-2 text-xs font-medium items-center" style={{ color: '#e4ddce' }}>
                    <div className="bg-purple-500/15 text-purple-300 w-5 h-5 rounded-md flex items-center justify-center text-[10px]">
                      <i className={`fas ${f.icon}`}></i>
                    </div>
                    {f.label}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe('pro')}
                disabled={isLoading || currentTier === 'pro' || currentTier === 'pro_plus'}
                className={`w-full py-3 rounded-full font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-volt-400 ${
                  currentTier === 'pro' || currentTier === 'pro_plus'
                    ? 'bg-purple-500/15 text-purple-300/50 cursor-not-allowed'
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-volt-400 text-[#231b15] text-[10px] font-black px-3 py-1 rounded-full">
                  CURRENT PLAN
                </div>
              )}

              <div className="relative z-10">
                <div className="mb-6">
                  <span className="bg-volt-400 text-[#231b15] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    PRO+
                  </span>
                  <h3 className="text-2xl font-serif font-black mt-3 mb-1" style={{ color: '#f3efe0' }}>
                    DripMap Pro+
                  </h3>
                  <p className="text-xs" style={{ color: '#e4ddce' }}>Everything + DripClub integration</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-black" style={{ color: '#f3efe0' }}>
                    {formatPrice(billingCycle === 'monthly' ? proPlusMonthly : proPlusAnnual)}
                  </span>
                  <span className="font-bold text-sm" style={{ color: '#e4ddce' }}>
                    /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                  {billingCycle === 'annual' && (
                    <p className="text-volt-400 text-xs font-bold mt-1">
                      Save {formatPrice(proPlusSavings)} vs monthly
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6 flex-1">
                  <li className="flex gap-2 text-xs text-[#e4ddce] font-medium items-center">
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
                      className="flex gap-2 text-xs text-[#e4ddce] font-medium items-center"
                    >
                      <div className="bg-volt-400/20 text-volt-400 w-5 h-5 rounded-md flex items-center justify-center text-[10px]">
                        <i className={`fas ${f.icon}`}></i>
                      </div>
                      {f.label}
                    </li>
                  ))}
                </ul>

                {/* DripClub Discount Toggle */}
                <div className="bg-[rgba(255,255,255,0.08)] border border-white/[0.09] rounded-xl p-4 mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proPlusDiscountEnabled}
                      onChange={(e) => setProPlusDiscountEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-volt-400"
                    />
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#f3efe0' }}>Offer 10% DripClub Discount</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#e4ddce' }}>
                        Required for PRO+. DripClub members get 10% off at your shop.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => handleSubscribe('pro_plus')}
                  disabled={isLoading || currentTier === 'pro_plus' || !proPlusDiscountEnabled}
                  className={`w-full py-3 rounded-full font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-volt-400 ${
                    currentTier === 'pro_plus'
                      ? 'bg-volt-400/30 text-volt-400/50 cursor-not-allowed'
                      : !proPlusDiscountEnabled
                      ? 'bg-[rgba(255,255,255,0.08)] text-white/30 cursor-not-allowed'
                      : 'bg-volt-400 text-[#231b15] hover:bg-volt-500 active:scale-[0.98]'
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
          <p className="text-center text-xs mt-6 md:mt-8 pb-2" style={{ color: 'rgba(243,239,224,0.5)' }}>
            All plans include 24/7 support. Cancel anytime.{' '}
            {!stripeReady && (
              <span className="text-amber-500">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Stripe not configured - contact admin
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShopPricingModal;
