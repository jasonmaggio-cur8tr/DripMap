import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShopDraft, ShopDraftStatus } from '../../types';
import { fetchDrafts } from '../../services/shopDraftService';
import { useToast } from '../../context/ToastContext';

const STATUS_FILTERS: { label: string; value: ShopDraftStatus | 'all' }[] = [
  { label: 'Pending Review', value: 'pending_review' },
  { label: 'Needs More Info', value: 'needs_more_info' },
  { label: 'Approved', value: 'approved' },
  { label: 'Published', value: 'published' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'All', value: 'all' },
];

const STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-volt-100 text-coffee-800',
  needs_more_info: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const ShopQueue: React.FC = () => {
  const [drafts, setDrafts] = useState<ShopDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ShopDraftStatus | 'all'>('pending_review');
  const { toast } = useToast();

  const loadDrafts = async () => {
    setLoading(true);
    const data = await fetchDrafts(activeFilter === 'all' ? undefined : activeFilter);
    setDrafts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadDrafts();
  }, [activeFilter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const primaryPhotoUrl = (draft: ShopDraft): string | null => {
    const primary = draft.photos.find(p => p.isPrimary);
    return primary?.url || draft.photos[0]?.url || null;
  };

  return (
    <div className="space-y-6">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === f.value
                ? 'bg-coffee-900 text-volt-400'
                : 'bg-white border border-coffee-200 text-coffee-600 hover:border-coffee-400'
            }`}
          >
            {f.label}
          </button>
        ))}

        <button
          onClick={loadDrafts}
          className="ml-auto px-3 py-2 text-coffee-500 hover:text-volt-600 transition-colors"
          title="Refresh"
        >
          <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
        </button>
      </div>

      {/* Draft list */}
      {loading ? (
        <div className="text-center py-16 text-coffee-400">
          <i className="fas fa-spinner fa-spin text-2xl mb-3"></i>
          <p>Loading drafts...</p>
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-coffee-100 border-dashed">
          <i className="fas fa-clipboard-check text-4xl text-coffee-200 mb-3"></i>
          <p className="text-coffee-600 font-medium">No drafts found</p>
          <p className="text-coffee-400 text-sm mt-1">
            {activeFilter === 'pending_review'
              ? 'All caught up! No pending drafts to review.'
              : `No drafts with status "${activeFilter.replace('_', ' ')}".`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-coffee-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-sand-50 border-b border-coffee-100 text-left">
                <th className="px-4 py-3 text-xs font-bold text-coffee-500 uppercase w-16"></th>
                <th className="px-4 py-3 text-xs font-bold text-coffee-500 uppercase">Shop</th>
                <th className="px-4 py-3 text-xs font-bold text-coffee-500 uppercase hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-xs font-bold text-coffee-500 uppercase hidden lg:table-cell">Source</th>
                <th className="px-4 py-3 text-xs font-bold text-coffee-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-coffee-500 uppercase hidden md:table-cell">Submitted</th>
                <th className="px-4 py-3 text-xs font-bold text-coffee-500 uppercase w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-50">
              {drafts.map((draft) => {
                const photo = primaryPhotoUrl(draft);
                const sd = draft.shopData;
                const isAgent = draft.submittedBy.startsWith('agent:');

                return (
                  <tr key={draft.id} className="hover:bg-sand-50 transition-colors">
                    {/* Thumbnail */}
                    <td className="px-4 py-3">
                      {photo ? (
                        <img
                          src={photo}
                          alt={sd.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-coffee-100 flex items-center justify-center text-coffee-300">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                    </td>

                    {/* Name + neighborhood */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-coffee-900">{sd.name}</p>
                      <p className="text-sm text-coffee-500">{sd.neighborhood}</p>
                    </td>

                    {/* City, State */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-coffee-700">
                        {[sd.city, sd.state].filter(Boolean).join(', ')}
                      </p>
                    </td>

                    {/* Submitted by */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        isAgent ? 'bg-purple-100 text-purple-700' : 'bg-coffee-100 text-coffee-700'
                      }`}>
                        <i className={`fas ${isAgent ? 'fa-robot' : 'fa-user'} text-[10px]`}></i>
                        {draft.submittedBy}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[draft.status] || 'bg-gray-100 text-gray-600'}`}>
                        {draft.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-coffee-500">{formatDate(draft.createdAt)}</p>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/shop-queue/${draft.id}`}
                        className="text-volt-600 hover:text-coffee-900 font-medium text-sm flex items-center gap-1"
                      >
                        Review <i className="fas fa-arrow-right text-xs"></i>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShopQueue;
