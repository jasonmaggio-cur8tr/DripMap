import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

// Web mirror of the iOS free-drink coupon (app/redeem/[campaignId].tsx).
// Same anti-screenshot design: live ticking clock + animated glow/shimmer —
// the barista just checks the screen is moving and watches the tap.

type ScreenState = 'loading' | 'upcoming' | 'available' | 'redeemed' | 'unavailable';

type Campaign = {
  id: string;
  shop_id: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  shopName: string | null;
};

const formatClock = (d: Date) =>
  d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const formatStamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const formatRange = (startIso: string, endIso: string) => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${e.toLocaleDateString(undefined, { day: 'numeric' })}`;
};

const Redeem: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { user } = useApp();

  const [state, setState] = useState<ScreenState>('loading');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [redeemedAt, setRedeemedAt] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [armed, setArmed] = useState(false); // two-tap confirm
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (state !== 'available') return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [state]);

  const load = useCallback(async () => {
    if (!campaignId || !user?.id) {
      setState('unavailable');
      return;
    }

    const [{ data: camp }, { data: redemptions }] = await Promise.all([
      supabase
        .from('free_drink_campaigns')
        .select('id, shop_id, starts_at, ends_at, is_active, shops(name)')
        .eq('id', campaignId)
        .maybeSingle(),
      supabase
        .from('free_drink_redemptions')
        .select('status, redeemed_at, created_at')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (camp) {
      const shop = (camp as any).shops;
      setCampaign({
        id: camp.id,
        shop_id: camp.shop_id,
        starts_at: camp.starts_at,
        ends_at: camp.ends_at,
        is_active: camp.is_active,
        shopName: Array.isArray(shop) ? shop[0]?.name ?? null : shop?.name ?? null,
      });
    }

    const available = redemptions?.find((r) => r.status === 'available');
    const lastRedeemed = redemptions?.find((r) => r.status === 'redeemed');

    const started = !!camp && Date.now() >= new Date(camp.starts_at).getTime();
    const ended = !!camp && Date.now() > new Date(camp.ends_at).getTime();
    const live = !!camp && camp.is_active && started && !ended;

    if (available && live) {
      setState('available');
    } else if (available && camp?.is_active && !started) {
      setState('upcoming');
    } else if (lastRedeemed) {
      setRedeemedAt(lastRedeemed.redeemed_at ?? null);
      setState('redeemed');
    } else {
      setState('unavailable');
    }
  }, [campaignId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRedeem = async () => {
    if (!armed) {
      setArmed(true);
      // Disarm if they don't confirm within 6s (accidental tap)
      setTimeout(() => setArmed(false), 6000);
      return;
    }
    setRedeeming(true);
    const { error } = await supabase.rpc('redeem_free_drink', { p_campaign_id: campaignId });
    setRedeeming(false);
    setArmed(false);
    if (error) {
      alert('This coupon is no longer available. Refresh and try again.');
      load();
      return;
    }
    setRedeemedAt(new Date().toISOString());
    setState('redeemed');
  };

  const isLastDay = campaign
    ? new Date().toDateString() === new Date(campaign.ends_at).toDateString()
    : false;

  const notch = (side: 'left' | 'right') => (
    <div
      className="absolute w-7 h-7 rounded-full bg-coffee-900 border border-white/10"
      style={{ top: '52%', [side]: '-14px' } as React.CSSProperties}
    />
  );

  return (
    <div className="min-h-screen bg-coffee-900 text-coffee-100 flex flex-col">
      {/* Ticket animations (mirrors the iOS glow pulse + shimmer sweep) */}
      <style>{`
        @keyframes couponGlow {
          0%, 100% { border-color: rgba(163,230,53,0.14); box-shadow: 0 0 18px rgba(163,230,53,0.06); }
          50%      { border-color: rgba(163,230,53,0.6);  box-shadow: 0 0 34px rgba(163,230,53,0.18); }
        }
        @keyframes couponSweep {
          0%   { left: -120px; }
          62%  { left: 110%; }
          100% { left: 110%; }
        }
        .coupon-ticket { animation: couponGlow 2.8s ease-in-out infinite; }
        .coupon-shimmer {
          position: absolute; top: -60px; bottom: -60px; width: 90px; pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(243,239,224,0.07), transparent);
          transform: rotate(18deg);
          animation: couponSweep 3.1s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .coupon-ticket, .coupon-shimmer { animation: none; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 max-w-md w-full mx-auto">
        <Link to="/dripclub" className="text-volt-400 text-lg" aria-label="Back to DripClub">←</Link>
        <span className="font-serif font-black text-volt-400 text-lg">DripClub</span>
        <span className="w-5" />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        {state === 'loading' && (
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-volt-400" />
        )}

        {!user && state === 'unavailable' && (
          <div className="text-center max-w-sm">
            <p className="font-serif font-black text-2xl mb-3">Sign in to see your coupon</p>
            <p className="text-coffee-100/60 text-sm mb-6">
              Your free drink coupon is tied to your DripMap account.
            </p>
            <Link
              to="/auth"
              className="inline-block bg-volt-400 text-coffee-900 font-bold rounded-2xl px-8 py-4"
            >
              Sign in
            </Link>
          </div>
        )}

        {(state === 'upcoming' || state === 'available' || state === 'redeemed') && campaign && (
          <div className="coupon-ticket relative bg-coffee-800/60 border-2 rounded-3xl px-6 py-7 text-center w-full max-w-sm overflow-hidden">
            {state === 'available' && <div className="coupon-shimmer" />}
            {notch('left')}
            {notch('right')}

            {state !== 'redeemed' && (
              <div className="flex items-center justify-center gap-2 mb-5">
                <span className="inline-flex items-center gap-2 bg-volt-400 text-coffee-900 text-[11px] font-bold tracking-widest px-3.5 py-2 rounded-full">
                  💧 FREE DRINK
                </span>
                {state === 'available' ? (
                  <span className="bg-volt-400/15 text-volt-400 text-[10px] font-bold tracking-widest px-2.5 py-2 rounded-full">
                    GOOD TODAY
                  </span>
                ) : (
                  <span className="bg-coffee-800 text-coffee-100/60 text-[10px] font-bold tracking-wider px-2.5 py-2 rounded-full">
                    🔒 UNLOCKS {formatDay(campaign.starts_at).toUpperCase()}
                  </span>
                )}
              </div>
            )}

            {state === 'redeemed' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-volt-400 text-coffee-900 text-3xl font-black flex items-center justify-center mx-auto mb-4">
                  ✓
                </div>
                <p className="font-serif font-black text-2xl">Redeemed</p>
                {campaign.shopName && (
                  <p className="text-coffee-100/60 text-sm mt-2">{campaign.shopName}</p>
                )}
                {redeemedAt && (
                  <p className="text-coffee-100/60 text-sm mt-1 font-semibold">{formatStamp(redeemedAt)}</p>
                )}
                <div className="border-t-2 border-dashed border-coffee-100/20 my-5" />
                <p className="text-coffee-100/40 text-xs leading-relaxed">
                  {isLastDay
                    ? 'Enjoy your coffee on us. ☕️ That wraps free drink week!'
                    : 'Enjoy your coffee on us. ☕️ Tonight a fresh coupon drops for tomorrow.'}
                </p>
              </>
            ) : (
              <>
                <p className="font-serif font-black text-[26px] leading-tight">
                  {campaign.shopName ?? 'Partner shop'}
                </p>
                <p className="text-coffee-100/60 text-[13px] mt-2">
                  One per day, {formatRange(campaign.starts_at, campaign.ends_at)} · DripClub member
                </p>

                {state === 'available' && (
                  <>
                    {/* Live clock — proof to the barista that this is real-time */}
                    <p className="text-volt-400 text-[38px] font-extrabold tabular-nums mt-5 whitespace-nowrap">
                      {formatClock(now)}
                    </p>
                    {user?.username && (
                      <p className="text-coffee-100/60 text-sm mt-1 font-semibold">@{user.username}</p>
                    )}
                    <div className="border-t-2 border-dashed border-coffee-100/20 my-5" />
                    <button
                      onClick={onRedeem}
                      disabled={redeeming}
                      className={`w-full font-bold rounded-2xl py-4 transition-colors ${
                        armed ? 'bg-coffee-100 text-coffee-900' : 'bg-volt-400 text-coffee-900'
                      } ${redeeming ? 'opacity-60' : ''}`}
                    >
                      {redeeming ? 'Redeeming…' : armed ? 'Tap again to confirm ✓' : 'Use my free drink'}
                    </button>
                    <p className="text-coffee-100/40 text-xs mt-3 leading-relaxed">
                      {armed
                        ? 'This uses today’s coupon — only confirm at the counter.'
                        : 'Tap only when the barista is handing you your drink.'}
                    </p>
                  </>
                )}

                {state === 'upcoming' && (
                  <>
                    {user?.username && (
                      <p className="text-coffee-100/60 text-sm mt-4 font-semibold">@{user.username}</p>
                    )}
                    <div className="border-t-2 border-dashed border-coffee-100/20 my-5" />
                    <p className="text-coffee-100/40 text-xs leading-relaxed">
                      Hang tight — your coupon goes live on {formatDay(campaign.starts_at)}. Redeem it at
                      the counter, and a fresh one drops each night after you use it.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {user && state === 'unavailable' && (
          <div className="text-center max-w-sm">
            <div className="text-5xl mb-4">☕️</div>
            <p className="font-serif font-black text-2xl mb-3">No free drink right now</p>
            <p className="text-coffee-100/60 text-sm mb-6 leading-relaxed">
              This offer isn't available on your account today. DripClub members get free drinks at
              partner shops during launch weeks.
            </p>
            <Link
              to="/dripclub"
              className="inline-block bg-volt-400 text-coffee-900 font-bold rounded-2xl px-8 py-4"
            >
              Open DripClub
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Redeem;
