import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

// One row from the free_drink_campaign_stats() RPC (admin-gated, SECURITY DEFINER)
interface CampaignStats {
    campaign_id: string;
    shop_id: string;
    shop_name: string;
    city: string | null;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    issued: number;
    redeemed: number;
}

// Default launch window: upcoming Monday → the Monday after
const nextMonday = (): Date => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 1 ? 0 : (8 - day) % 7;
    d.setDate(d.getDate() + diff);
    return d;
};
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const isLive = (c: CampaignStats) => {
    const now = Date.now();
    return c.is_active && now >= new Date(c.starts_at).getTime() && now <= new Date(c.ends_at).getTime();
};

const AdminCampaigns: React.FC = () => {
    const { shops } = useApp() as any;
    const { toast } = useToast();

    const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
    const [loading, setLoading] = useState(true);

    // Launch form state
    const [shopId, setShopId] = useState('');
    const [city, setCity] = useState('Sacramento');
    const [startsAt, setStartsAt] = useState(toDateInput(nextMonday()));
    const [endsAt, setEndsAt] = useState(toDateInput(new Date(nextMonday().getTime() + 7 * 86400000)));
    const [launching, setLaunching] = useState(false);

    const fetchCampaigns = useCallback(async () => {
        const { data, error } = await supabase.rpc('free_drink_campaign_stats');
        if (error) {
            toast.error(`Failed to load campaigns: ${error.message}`);
        } else {
            setCampaigns((data as CampaignStats[]) ?? []);
        }
        setLoading(false);
    }, [toast]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    const handleLaunch = async () => {
        if (!shopId) { toast.error('Pick a shop first'); return; }
        if (new Date(endsAt) <= new Date(startsAt)) { toast.error('End date must be after start date'); return; }

        const shopName = shops.find((s: any) => s.id === shopId)?.name ?? 'this shop';
        const memberNote = 'This enrolls every active DripClub member and sends them a push notification immediately.';
        if (!confirm(`Launch a free-drink campaign at ${shopName} (${fmtDate(startsAt)} → ${fmtDate(endsAt)})?\n\n${memberNote}`)) return;

        setLaunching(true);
        const { error } = await supabase.rpc('launch_free_drink_campaign', {
            p_shop_id: shopId,
            p_starts_at: new Date(startsAt + 'T00:00:00').toISOString(),
            p_ends_at: new Date(endsAt + 'T23:59:59').toISOString(),
            p_city: city || 'Sacramento',
        });
        setLaunching(false);

        if (error) {
            toast.error(`Launch failed: ${error.message}`);
        } else {
            toast.success(`Campaign launched at ${shopName} — members notified`);
            setShopId('');
            fetchCampaigns();
        }
    };

    const handleEnd = async (c: CampaignStats) => {
        if (!confirm(`End the campaign at ${c.shop_name}? Members will no longer be auto-enrolled and the redeem screen closes when the window passes.`)) return;
        const { error } = await supabase.rpc('end_free_drink_campaign', { p_campaign_id: c.campaign_id });
        if (error) {
            toast.error(`Failed to end campaign: ${error.message}`);
        } else {
            toast.success('Campaign ended');
            fetchCampaigns();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-coffee-900">Free Drink Campaigns</h2>
                <button
                    onClick={fetchCampaigns}
                    className="px-3 py-2 border border-coffee-200 rounded-lg text-sm text-coffee-700 hover:bg-coffee-50 transition-colors"
                >
                    <i className="fas fa-rotate mr-2"></i>Refresh
                </button>
            </div>

            {/* Launch form */}
            <div className="bg-white border border-coffee-100 rounded-xl p-5 mb-8">
                <h3 className="font-bold text-coffee-900 mb-4">
                    <i className="fas fa-rocket text-volt-600 mr-2"></i>Launch a campaign
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-coffee-500 mb-1">Partner shop</label>
                        <select
                            className="w-full p-2 border border-coffee-200 rounded-lg text-sm"
                            value={shopId}
                            onChange={e => setShopId(e.target.value)}
                        >
                            <option value="">Select a shop…</option>
                            {[...shops].sort((a: any, b: any) => a.name.localeCompare(b.name))
                                .map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-coffee-500 mb-1">Starts</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-coffee-200 rounded-lg text-sm"
                            value={startsAt}
                            onChange={e => setStartsAt(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-coffee-500 mb-1">Ends</label>
                        <input
                            type="date"
                            className="w-full p-2 border border-coffee-200 rounded-lg text-sm"
                            value={endsAt}
                            onChange={e => setEndsAt(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleLaunch}
                        disabled={launching}
                        className="px-4 py-2 bg-volt-400 text-coffee-900 font-bold rounded-lg hover:bg-volt-500 transition-colors text-sm disabled:opacity-50"
                    >
                        {launching ? 'Launching…' : 'Launch + notify members'}
                    </button>
                </div>
                <p className="text-xs text-coffee-500 mt-3">
                    Launching enrolls every active DripClub member and pushes them
                    “☕️ Your free drink is ready — this week at [shop]”. Members who join
                    mid-campaign are enrolled automatically.
                </p>
            </div>

            {/* Campaign list */}
            {loading ? (
                <p className="text-coffee-500 text-sm">Loading campaigns…</p>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-12 bg-white border border-coffee-100 rounded-xl">
                    <i className="fas fa-mug-hot text-3xl text-coffee-200 mb-3"></i>
                    <p className="text-coffee-500 text-sm">No campaigns yet. Launch your first one above.</p>
                </div>
            ) : (
                <div className="bg-white border border-coffee-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-coffee-50 text-left text-xs text-coffee-500">
                                <th className="px-4 py-3 font-bold">Shop</th>
                                <th className="px-4 py-3 font-bold">Window</th>
                                <th className="px-4 py-3 font-bold">Status</th>
                                <th className="px-4 py-3 font-bold text-right">Redeemed / Issued</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map(c => (
                                <tr key={c.campaign_id} className="border-t border-coffee-100">
                                    <td className="px-4 py-3">
                                        <span className="font-bold text-coffee-900">{c.shop_name}</span>
                                        {c.city && <span className="text-coffee-400 ml-2 text-xs">{c.city}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-coffee-700">
                                        {fmtDate(c.starts_at)} → {fmtDate(c.ends_at)}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isLive(c) ? (
                                            <span className="bg-volt-100 text-volt-700 text-xs font-bold px-2 py-1 rounded-full">
                                                ● Live
                                            </span>
                                        ) : c.is_active ? (
                                            <span className="bg-coffee-100 text-coffee-600 text-xs font-bold px-2 py-1 rounded-full">
                                                Scheduled / past window
                                            </span>
                                        ) : (
                                            <span className="bg-coffee-100 text-coffee-400 text-xs font-bold px-2 py-1 rounded-full">
                                                Ended
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-bold text-coffee-900">{c.redeemed}</span>
                                        <span className="text-coffee-400"> / {c.issued}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {c.is_active && (
                                            <button
                                                onClick={() => handleEnd(c)}
                                                className="text-xs text-red-500 hover:text-red-700 font-bold"
                                            >
                                                End
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminCampaigns;
