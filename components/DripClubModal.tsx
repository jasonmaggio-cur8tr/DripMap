import React, { useState } from 'react';
import { BillingInterval } from '../types';
import { formatPrice, getPricing, isStripeConfigured } from '../services/subscriptionService';

interface DripClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (billingInterval: BillingInterval) => void;
  isLoading?: boolean;
}

const DripClubModal: React.FC<DripClubModalProps> = ({
  isOpen,
  onClose,
  onSubscribe,
  isLoading = false,
}) => {
  const [billingCycle, setBillingCycle] = useState<BillingInterval>('annual');

  if (!isOpen) return null;

  const pricing = getPricing();
  const stripeReady = isStripeConfigured();

  const monthly = pricing.dripClub.monthly.amount;
  const annual = pricing.dripClub.annual.amount;
  const savings = pricing.dripClub.annual.savings;

  const handleSubscribe = () => {
    if (!stripeReady) {
      alert('Stripe is not configured. Please contact support.');
      return;
    }
    onSubscribe(billingCycle);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coffee theme header */}
        <div className="bg-coffee-900 px-6 md:px-8 pt-8 pb-12 text-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-volt-400/10 rounded-full blur-[60px]"></div>

          {/* Close Button - Always visible in header */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10"
          >
            <i className="fas fa-times text-sm"></i>
          </button>

          <div className="inline-flex items-center justify-center bg-volt-400 p-4 rounded-2xl mb-4">
            <i className="fas fa-crown text-coffee-900 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-serif font-black text-white mb-1">Join DripClub</h2>
          <p className="text-coffee-100 text-sm">
            Unlock 10% off at every PRO+ coffee shop
          </p>
        </div>

        <div className="px-6 md:px-8 pb-6 md:pb-8 -mt-6 relative z-10">
          {/* Billing Toggle */}
          <div className="bg-coffee-100 p-1 rounded-xl flex mb-6">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-coffee-900 shadow-md'
                  : 'text-coffee-800 hover:text-coffee-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all relative ${
                billingCycle === 'annual'
                  ? 'bg-white text-coffee-900 shadow-md'
                  : 'text-coffee-800 hover:text-coffee-900'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-1 bg-volt-400 text-coffee-900 text-[8px] font-black px-1.5 py-0.5 rounded-full">
                SAVE
              </span>
            </button>
          </div>

          {/* Price Display */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-black text-coffee-900 tracking-tight">
                {formatPrice(billingCycle === 'monthly' ? monthly : annual)}
              </span>
              <span className="text-coffee-800 font-bold">
                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            {billingCycle === 'annual' && (
              <p className="text-green-600 text-sm font-bold">
                Save {formatPrice(savings)} per year
              </p>
            )}
            {billingCycle === 'monthly' && (
              <p className="text-coffee-800 text-xs">
                or {formatPrice(annual)}/year (save {formatPrice(savings)})
              </p>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-coffee-50 rounded-2xl p-4 mb-6">
            <ul className="space-y-3">
              {[
                {
                  icon: 'fa-percent',
                  title: '10% Off Everywhere',
                  desc: 'At all PRO+ coffee shops',
                  color: 'text-coffee-900 bg-volt-400',
                },
                {
                  icon: 'fa-crown',
                  title: 'Exclusive Badge',
                  desc: 'Show your DripClub status',
                  color: 'text-amber-600 bg-amber-100',
                },
                {
                  icon: 'fa-ticket',
                  title: 'Early Event Access',
                  desc: 'Be first to RSVP to tastings',
                  color: 'text-coffee-900 bg-coffee-100',
                },
                {
                  icon: 'fa-gift',
                  title: 'Member Exclusives',
                  desc: 'Merchandise and surprises',
                  color: 'text-rose-600 bg-rose-100',
                },
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`${benefit.color} w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0`}>
                    <i className={`fas ${benefit.icon}`}></i>
                  </div>
                  <div>
                    <p className="text-coffee-900 text-sm font-bold">{benefit.title}</p>
                    <p className="text-coffee-800 text-xs">{benefit.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full py-4 bg-volt-400 text-coffee-900 rounded-xl font-bold text-base shadow-lg shadow-volt-400/30 hover:bg-volt-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-crown"></i>
                Become a Member
              </>
            )}
          </button>

          {/* Footer */}
          <p className="text-center text-coffee-800 text-xs mt-4">
            Cancel anytime. No questions asked.
            {!stripeReady && (
              <span className="block text-amber-500 mt-1">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Stripe not configured
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DripClubModal;
