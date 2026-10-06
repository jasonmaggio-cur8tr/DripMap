import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

// Shows on the DripClub page while a free-drink campaign is live (or upcoming)
// and the signed-in member holds an available coupon. Links to /redeem/:id —
// the web mirror of the iOS coupon, for members without an iPhone.
const FreeDrinkBanner: React.FC = () => {
  const { user } = useApp();
  const [campaign, setCampaign] = useState<{ id: string; shopName: string; live: boolean } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data: camps } = await supabase
        .from('free_drink_campaigns')
        .select('id, starts_at, ends_at, is_active, shops(name)')
        .eq('is_active', true)
        .gte('ends_at', new Date().toISOString());
      const camp = camps?.[0];
      if (!camp) return;

      const { data: coupon } = await supabase
        .from('free_drink_redemptions')
        .select('id')
        .eq('campaign_id', camp.id)
        .eq('user_id', user.id)
        .eq('status', 'available')
        .limit(1);
      if (!coupon?.length) return;

      const shop = (camp as any).shops;
      setCampaign({
        id: camp.id,
        shopName: Array.isArray(shop) ? shop[0]?.name ?? 'a partner shop' : shop?.name ?? 'a partner shop',
        live: Date.now() >= new Date(camp.starts_at).getTime(),
      });
    })();
  }, [user?.id]);

  if (!campaign) return null;

  return (
    <div className="container mx-auto px-4 pt-4">
      <Link
        to={`/redeem/${campaign.id}`}
        className="block bg-volt-400 text-coffee-900 rounded-2xl px-5 py-4 shadow-xl hover:bg-volt-500 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-black text-base">
              ☕️ {campaign.live ? 'Your free drink is ready' : 'Free Drink Week is coming'}
            </p>
            <p className="text-sm font-medium opacity-80">
              {campaign.live
                ? `Show this coupon at ${campaign.shopName} — one free drink today.`
                : `You're locked in at ${campaign.shopName} — tap to preview your coupon.`}
            </p>
          </div>
          <span className="text-2xl">→</span>
        </div>
      </Link>
    </div>
  );
};

export default FreeDrinkBanner;
