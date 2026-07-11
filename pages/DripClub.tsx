import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import DripClubCard from '../components/DripClubCard';
import LazyImage from '../components/LazyImage';
import DripClubModal from '../components/DripClubModal';
import BottomTabBar from '../components/darkroast/BottomTabBar';
import { sizedImageUrl } from '../lib/imageUrl';
import {
  getDripClubMembership,
  createDripClubCheckoutSession,
  getProPlusShopsWithDiscount,
  getCustomerPortalUrl,
} from '../services/subscriptionService';
import { DripClubMembership, BillingInterval } from '../types';

const DripClub: React.FC = () => {
  const { user } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [membership, setMembership] = useState<DripClubMembership | null>(null);
  const [proShops, setProShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'canceled'; show: boolean } | null>(null);

  // Check for success/cancel URL params
  useEffect(() => {
    const success = searchParams.get('dripclub');
    const checkout = searchParams.get('checkout');

    if (success === 'success') {
      setBanner({ type: 'success', show: true });
    } else if (checkout === 'canceled') {
      setBanner({ type: 'canceled', show: true });
    }
  }, [searchParams]);

  // Fetch membership and PRO+ shops
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [membershipData, shopsData] = await Promise.all([
          user ? getDripClubMembership(user.id) : null,
          getProPlusShopsWithDiscount(),
        ]);
        setMembership(membershipData);
        setProShops(shopsData);
      } catch (error) {
        console.error('Error fetching DripClub data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubscribe = async (billingInterval: BillingInterval) => {
    if (!user) {
      toast.error('Please sign in to join DripClub');
      navigate('/auth');
      return;
    }

    setIsCheckingOut(true);
    try {
      const result = await createDripClubCheckoutSession(user.id, billingInterval);

      if ('error' in result) {
        toast.error(result.error);
        setIsCheckingOut(false);
        // Don't close modal on error - let user try again
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error?.message || 'Failed to start checkout. Please try again.');
      setIsCheckingOut(false);
      // Don't close modal on error
    }
  };

  const handleManageMembership = async () => {
    if (!membership?.stripeCustomerId) {
      toast.error('Unable to open billing portal');
      return;
    }

    try {
      const result = await getCustomerPortalUrl(
        membership.stripeCustomerId,
        window.location.href
      );

      if ('error' in result) {
        toast.error(result.error);
      } else {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Failed to open billing portal');
    }
  };

  const isActiveMember = membership?.status === 'active';

  return (
    <div className="min-h-screen pb-[110px]" style={{ background: '#1e1712' }}>
      {/* Success/Cancel Banner - Fixed below navbar */}
      {banner?.show && (
        <div className={`fixed top-0 left-0 right-0 z-40 ${
          banner.type === 'success'
            ? 'bg-green-500'
            : 'bg-amber-500'
        } text-white px-4 py-3 shadow-lg`}>
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className={`fas ${
                banner.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'
              } text-xl`}></i>
              <div>
                <p className="font-bold">
                  {banner.type === 'success'
                    ? 'Welcome to DripClub!'
                    : 'Checkout Canceled'}
                </p>
                <p className="text-sm opacity-90">
                  {banner.type === 'success'
                    ? 'Your membership is now active. Enjoy 10% off at all PRO+ shops!'
                    : 'No charges were made. You can try again anytime.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setBanner(null)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/[0.07]" style={{ background: '#231b15' }}>
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-volt-400/10 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-coffee-800/50 rounded-full blur-[100px]"></div>

        <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: '#2b221b', color: '#e4ddce', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </Link>

          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-volt-400 p-4 rounded-2xl">
                <i className="fas fa-crown text-coffee-900 text-3xl"></i>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-serif font-black" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
                  DripClub
                </h1>
                <p className="text-volt-400 font-bold text-sm uppercase tracking-wider">
                  Coffee Lovers Membership
                </p>
              </div>
            </div>

            <p className="text-xl mb-8 leading-relaxed" style={{ color: '#e4ddce' }}>
              Get <span className="text-volt-400 font-bold">10% off</span> at every PRO+
              coffee shop, plus exclusive perks and early access to events.
            </p>

            {!isActiveMember && (
              <button
                onClick={() => (user ? setShowModal(true) : navigate('/auth'))}
                className="inline-flex items-center gap-3 bg-volt-400 text-coffee-900 px-8 py-4 rounded-full font-black text-lg hover:bg-volt-500 active:scale-[0.98] transition-all shadow-xl focus:outline-none focus:ring-2 focus:ring-volt-400"
              >
                <i className="fas fa-crown"></i>
                {user ? 'Join DripClub' : 'Sign in to Join'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Membership Card or CTA */}
          <div className="lg:col-span-1">
            {isLoading ? (
              <div className="rounded-3xl p-8 animate-pulse border border-white/[0.07]" style={{ background: '#2b221b' }}>
                <div className="h-40 rounded-xl" style={{ background: '#2f251d' }}></div>
              </div>
            ) : (
              <DripClubCard
                membership={membership}
                onJoin={() => (user ? setShowModal(true) : navigate('/auth'))}
                onManage={handleManageMembership}
              />
            )}

            {/* Benefits List */}
            <div className="rounded-3xl p-6 border border-white/[0.09] mt-6" style={{ background: '#2b221b' }}>
              <h3 className="font-serif font-black mb-4" style={{ color: '#f3efe0' }}>Member Benefits</h3>
              <ul className="space-y-3">
                {[
                  { icon: 'fa-percent', text: '10% off at all PRO+ locations', color: 'text-coffee-900 bg-volt-400' },
                  { icon: 'fa-crown', text: 'Exclusive DripClub member badge', color: 'text-amber-300 bg-amber-500/15' },
                  { icon: 'fa-ticket', text: 'Early access to tastings & events', color: 'text-[#e4ddce] bg-[#2f251d]' },
                  { icon: 'fa-gift', text: 'Surprise perks from partner shops', color: 'text-rose-300 bg-rose-500/15' },
                  { icon: 'fa-map-marker-alt', text: 'Discover new PRO+ shops', color: 'text-emerald-300 bg-emerald-500/15' },
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm" style={{ color: '#e4ddce' }}>
                    <div className={`${benefit.color} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${benefit.icon} text-xs`}></i>
                    </div>
                    {benefit.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - PRO+ Shops */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-serif font-black" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
                  PRO+ Partner Shops
                </h2>
                <p className="text-sm" style={{ color: 'rgba(243,239,224,0.5)' }}>
                  {proShops.length} shops offering 10% DripClub discount
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-4 animate-pulse border border-white/[0.07]"
                    style={{ background: '#2b221b' }}
                  >
                    <div className="h-32 rounded-xl mb-3" style={{ background: '#2f251d' }}></div>
                    <div className="h-4 rounded w-3/4 mb-2" style={{ background: '#2f251d' }}></div>
                    <div className="h-3 rounded w-1/2" style={{ background: '#2f251d' }}></div>
                  </div>
                ))}
              </div>
            ) : proShops.length === 0 ? (
              <div className="rounded-3xl p-12 border border-white/[0.09] text-center" style={{ background: '#2b221b' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#2f251d' }}>
                  <i className="fas fa-store text-3xl" style={{ color: 'rgba(243,239,224,0.45)' }}></i>
                </div>
                <h3 className="text-xl font-serif font-black mb-2" style={{ color: '#f3efe0' }}>
                  Coming Soon!
                </h3>
                <p className="max-w-md mx-auto" style={{ color: '#e4ddce' }}>
                  PRO+ shops are joining DripClub. Check back soon to discover
                  partner locations offering member discounts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proShops.map((shop) => (
                  <Link
                    key={shop.id}
                    to={`/shop/${shop.id}`}
                    className="rounded-2xl overflow-hidden border border-white/[0.07] hover:border-volt-400/50 transition-colors group focus:outline-none focus:ring-2 focus:ring-volt-400"
                    style={{ background: '#2b221b' }}
                  >
                    <div className="h-32 relative overflow-hidden" style={{ background: '#2f251d' }}>
                      {shop.gallery?.[0]?.url ? (
                        <LazyImage
                          src={sizedImageUrl(shop.gallery[0].url, { width: 1080 })!}
                          alt={shop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="fas fa-mug-hot text-4xl" style={{ color: 'rgba(243,239,224,0.35)' }}></i>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="bg-coffee-900 text-volt-400 text-[10px] font-bold px-2 py-1 rounded-full">
                          <i className="fas fa-crown mr-1"></i> PRO+
                        </span>
                      </div>
                      {isActiveMember && (
                        <div className="absolute bottom-3 right-3">
                          <span className="bg-volt-400 text-coffee-900 text-[10px] font-bold px-2 py-1 rounded-full">
                            10% OFF
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold mb-1 group-hover:text-volt-400 transition-colors" style={{ color: '#f3efe0' }}>
                        {shop.name}
                      </h3>
                      <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(243,239,224,0.5)' }}>
                        <i className="fas fa-map-marker-alt"></i>
                        {shop.city}, {shop.state}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomTabBar />

      {/* DripClub Modal */}
      <DripClubModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubscribe={handleSubscribe}
        isLoading={isCheckingOut}
      />
    </div>
  );
};

export default DripClub;
