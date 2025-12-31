import React from 'react';
import { DripClubMembership } from '../types';
import { formatPrice, getSubscriptionStatusLabel, getPricing } from '../services/subscriptionService';

interface DripClubCardProps {
  membership: DripClubMembership | null;
  onManage?: () => void;
  onJoin?: () => void;
  compact?: boolean;
}

const DripClubCard: React.FC<DripClubCardProps> = ({
  membership,
  onManage,
  onJoin,
  compact = false,
}) => {
  const isActive = membership?.status === 'active' || membership?.status === 'trialing';
  const pricing = getPricing();

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Compact badge version (for profile header)
  if (compact) {
    if (!isActive) return null;

    return (
      <div className="inline-flex items-center gap-1.5 bg-coffee-900 text-volt-400 text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
        <i className="fas fa-crown"></i>
        <span>DripClub</span>
      </div>
    );
  }

  // Full card version
  if (!membership || !isActive) {
    // Non-member CTA card
    return (
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-coffee-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-volt-400 p-3 rounded-xl">
            <i className="fas fa-crown text-coffee-900 text-xl"></i>
          </div>
          <div>
            <h3 className="text-coffee-900 font-black text-lg">Join DripClub</h3>
            <p className="text-coffee-800 text-xs">First month free!</p>
          </div>
        </div>

        <div className="bg-coffee-50 rounded-xl p-4 mb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-coffee-900">
              {formatPrice(pricing.dripClub.monthly.amount)}
            </span>
            <span className="text-coffee-800 text-sm">/month</span>
          </div>
          <p className="text-coffee-800 text-xs">
            Or {formatPrice(pricing.dripClub.annual.amount)}/year (save{' '}
            {formatPrice(pricing.dripClub.annual.savings)})
          </p>
        </div>

        <ul className="space-y-2.5 mb-5">
          {[
            '10% off at all PRO+ coffee shops',
            'Exclusive DripClub member badge',
            'Early access to events & tastings',
            'Member-only perks & surprises',
          ].map((perk, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-coffee-800">
              <i className="fas fa-check text-volt-500 text-xs"></i>
              {perk}
            </li>
          ))}
        </ul>

        <button
          onClick={onJoin}
          className="w-full py-3 bg-volt-400 text-coffee-900 rounded-xl font-bold text-sm hover:bg-volt-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-volt-400/20"
        >
          <i className="fas fa-crown"></i>
          Join DripClub
        </button>
      </div>
    );
  }

  // Active member card
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border-2 border-volt-400 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-volt-400/20 rounded-full blur-[60px] opacity-50"></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-coffee-900 p-3 rounded-xl shadow-lg">
              <i className="fas fa-crown text-volt-400 text-xl"></i>
            </div>
            <div>
              <h3 className="text-coffee-900 font-black text-xl">DripClub</h3>
              <p className="text-volt-500 text-xs font-bold uppercase tracking-wider">
                {membership.planType === 'annual' ? 'Annual' : 'Monthly'} Member
              </p>
            </div>
          </div>

          <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
            membership.status === 'trialing'
              ? 'bg-blue-100 text-blue-600'
              : 'bg-green-100 text-green-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              membership.status === 'trialing' ? 'bg-blue-500' : 'bg-green-500'
            }`}></span>
            {membership.status === 'trialing' ? 'Trial' : getSubscriptionStatusLabel(membership.status)}
          </div>
        </div>

        {/* Member Perks */}
        <div className="bg-coffee-50 rounded-xl p-4 mb-4">
          <p className="text-coffee-800 text-xs mb-2 font-medium">Your Perks</p>
          <div className="flex flex-wrap gap-2">
            {['10% Off PRO+', 'Member Badge', 'Early Access', 'Exclusive Perks'].map(
              (perk, i) => (
                <span
                  key={i}
                  className="bg-white text-coffee-900 text-[10px] font-bold px-2.5 py-1 rounded-full border border-coffee-100"
                >
                  {perk}
                </span>
              )
            )}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="flex items-center justify-between text-xs mb-4 px-1">
          <div>
            <p className="text-coffee-800">Member Since</p>
            <p className="text-coffee-900 font-bold">{formatDate(membership.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-coffee-800">
              {membership.cancelAtPeriodEnd ? 'Ends' : 'Renews'}
            </p>
            <p className="text-coffee-900 font-bold">{formatDate(membership.currentPeriodEnd)}</p>
          </div>
        </div>

        {/* Cancel warning */}
        {membership.cancelAtPeriodEnd && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-amber-700 text-xs font-medium flex items-center gap-2">
              <i className="fas fa-exclamation-triangle"></i>
              Your membership will end on {formatDate(membership.currentPeriodEnd)}
            </p>
          </div>
        )}

        {/* Manage Button */}
        <button
          onClick={onManage}
          className="w-full py-3 bg-coffee-100 text-coffee-900 rounded-xl font-bold text-sm hover:bg-coffee-100/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <i className="fas fa-cog"></i>
          Manage Membership
        </button>
      </div>
    </div>
  );
};

export default DripClubCard;
