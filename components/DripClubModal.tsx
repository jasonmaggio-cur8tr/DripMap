import React, { useState } from 'react';
import { BillingInterval } from '../types';
import { formatPrice, getPricing, isStripeConfigured } from '../services/subscriptionService';
import { useToast } from '../context/ToastContext';

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
  const { toast } = useToast();

  if (!isOpen) return null;

  const pricing = getPricing();
  const stripeReady = isStripeConfigured();

  const monthly = pricing.dripClub.monthly.amount;
  const annual = pricing.dripClub.annual.amount;
  const savings = pricing.dripClub.annual.savings;

  const handleSubscribe = () => {
    if (!stripeReady) {
      toast.error('Stripe is not configured. Please contact support.');
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
        className="w-full max-w-md rounded-3xl border border-white/[0.09] shadow-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
        style={{ background: '#221a14' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Coffee theme header */}
        <div className="px-6 md:px-8 pt-8 pb-12 text-center relative border-b border-white/[0.07]" style={{ background: '#2b221b' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-volt-400/10 rounded-full blur-[60px]"></div>

          {/* Close Button - Always visible in header */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-10 focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: '#2f251d', color: '#f3efe0' }}
          >
            <i className="fas fa-times text-sm"></i>
          </button>

          <div className="inline-flex items-center justify-center bg-volt-400 p-4 rounded-2xl mb-4">
            <i className="fas fa-crown text-2xl" style={{ color: '#231b15' }}></i>
          </div>
          <h2 className="text-2xl font-serif font-black mb-1" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>Join DripClub</h2>
          <p className="text-sm" style={{ color: '#e4ddce' }}>
            Unlock 10% off at every PRO+ coffee shop
          </p>
        </div>

        <div className="px-6 md:px-8 pb-6 md:pb-8 -mt-6 relative z-10">
          {/* Billing Toggle */}
          <div className="p-1 rounded-xl flex mb-6 border border-white/[0.09]" style={{ background: '#2f251d' }}>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-volt-400 ${
                billingCycle === 'monthly'
                  ? 'bg-volt-400 text-[#231b15] shadow-md'
                  : 'text-[#e4ddce] hover:text-[#f3efe0]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all relative focus:outline-none focus:ring-2 focus:ring-volt-400 ${
                billingCycle === 'annual'
                  ? 'bg-volt-400 text-[#231b15] shadow-md'
                  : 'text-[#e4ddce] hover:text-[#f3efe0]'
              }`}
            >
              Annual
              <span className="absolute -top-2 -right-1 bg-volt-400 text-[#231b15] text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#221a14]">
                SAVE
              </span>
            </button>
          </div>

          {/* Price Display */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-5xl font-black tracking-tight" style={{ color: '#f3efe0' }}>
                {formatPrice(billingCycle === 'monthly' ? monthly : annual)}
              </span>
              <span className="font-bold" style={{ color: 'rgba(243,239,224,0.5)' }}>
                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
              </span>
            </div>
            {billingCycle === 'annual' && (
              <p className="text-sm font-bold" style={{ color: '#4ade80' }}>
                Save {formatPrice(savings)} per year
              </p>
            )}
            {billingCycle === 'monthly' && (
              <p className="text-xs" style={{ color: 'rgba(243,239,224,0.5)' }}>
                or {formatPrice(annual)}/year (save {formatPrice(savings)})
              </p>
            )}
          </div>

          {/* Benefits */}
          <div className="rounded-2xl p-4 mb-6 border border-white/[0.07]" style={{ background: '#2b221b' }}>
            <ul className="space-y-3">
              {[
                {
                  icon: 'fa-percent',
                  title: '10% Off Everywhere',
                  desc: 'At all PRO+ coffee shops',
                  color: 'text-[#231b15] bg-volt-400',
                },
                {
                  icon: 'fa-crown',
                  title: 'Exclusive Badge',
                  desc: 'Show your DripClub status',
                  color: 'text-amber-400 bg-amber-400/10',
                },
                {
                  icon: 'fa-ticket',
                  title: 'Early Event Access',
                  desc: 'Be first to RSVP to tastings',
                  color: 'text-[#f3efe0] bg-[#2f251d]',
                },
                {
                  icon: 'fa-gift',
                  title: 'Member Exclusives',
                  desc: 'Merchandise and surprises',
                  color: 'text-rose-400 bg-rose-400/10',
                },
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className={`${benefit.color} w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0`}>
                    <i className={`fas ${benefit.icon}`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#f3efe0' }}>{benefit.title}</p>
                    <p className="text-xs" style={{ color: 'rgba(243,239,224,0.55)' }}>{benefit.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full py-4 rounded-full font-extrabold text-base shadow-lg shadow-volt-400/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: '#ccff00', color: '#231b15' }}
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
          <p className="text-center text-xs mt-4" style={{ color: 'rgba(243,239,224,0.5)' }}>
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
