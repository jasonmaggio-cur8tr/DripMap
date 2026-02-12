import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShopDraft } from '../../types';
import ReviewQueueCard from '../../components/admin/ReviewQueueCard';
import { useToast } from '../../context/ToastContext';
import { useApp } from '../../context/AppContext';

const ShopDrafts: React.FC = () => {
    const [drafts, setDrafts] = useState<ShopDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { addShop } = useApp();

    const fetchDrafts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('shop_drafts')
            .select('*')
            .eq('status', 'PENDING_REVIEW')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching drafts:', error);
            toast.error('Failed to load drafts');
        } else {
            // Safe cast after generic select
            // In a real app we'd map this carefully, for now assuming DB shape matches
            setDrafts(data.map((d: any) => ({
                id: d.id,
                runId: d.run_id,
                status: d.status,
                data: d.data, // JSONB already parsed by Supabase client
                score: d.score,
                scoreBreakdown: d.score_breakdown,
                sourceUrls: d.source_urls,
                disqualifiers: d.disqualifiers,
                createdAt: d.created_at,
                updatedAt: d.updated_at
            })) as ShopDraft[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDrafts();
    }, []);

    const handleApprove = async (draft: ShopDraft) => {
        try {
            // 1. Convert Draft to Real Shop
            // We use the AppContext addShop to ensure consistency (client-side validation etc)
            // Or we could insert directly via DB service. 
            // Using addShop context function is safer as it handles local state update.

            // Ensure required fields exist (MVP safety check)
            if (!draft.data.name || !draft.data.location?.lat) {
                toast.error('Draft missing critical data');
                return;
            }

            // 2. Add to real shops table
            const newShopPayload = {
                name: draft.data.name,
                description: draft.data.description || '',
                location: {
                    lat: draft.data.location.lat,
                    lng: draft.data.location.lng,
                    address: draft.data.location.address || '',
                    city: 'Unknown', // Todo: parsing logic
                    state: 'Unknown'
                },
                vibes: draft.data.vibes || [],
                cheekyVibes: [],
                gallery: [] // Images need handling in V2
            };

            await addShop(newShopPayload);

            // 3. Update Draft Status
            const { error } = await supabase
                .from('shop_drafts')
                .update({ status: 'APPROVED' })
                .eq('id', draft.id);

            if (error) throw error;

            toast.success(`Published ${draft.data.name}!`);
            // Remove from list
            setDrafts(prev => prev.filter(d => d.id !== draft.id));

        } catch (error: any) {
            console.error('Approval error:', error);
            toast.error('Failed to publish shop');
        }
    };

    const handleReject = async (draftId: string) => {
        try {
            const { error } = await supabase
                .from('shop_drafts')
                .update({ status: 'REJECTED' })
                .eq('id', draftId);

            if (error) throw error;

            toast.success('Draft rejected');
            setDrafts(prev => prev.filter(d => d.id !== draftId));
        } catch (error) {
            console.error('Reject error:', error);
            toast.error('Failed to reject draft');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-coffee-900">Review Queue</h2>
                <button onClick={fetchDrafts} className="text-coffee-600 hover:text-volt-600">
                    <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-coffee-400">Loading drafts...</div>
            ) : drafts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-coffee-100 border-dashed">
                    <i className="fas fa-clipboard-check text-4xl text-coffee-200 mb-2"></i>
                    <p className="text-coffee-600 font-medium">All caught up!</p>
                    <p className="text-coffee-400 text-sm">No pending drafts to review.</p>
                </div>
            ) : (
                drafts.map(draft => (
                    <ReviewQueueCard
                        key={draft.id}
                        draft={draft}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                ))
            )}
        </div>
    );
};

export default ShopDrafts;
