import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fetchDraftCounts } from '../../services/shopDraftService';
import { cleanupOrphanedUploads, CleanupResult } from '../../services/storageCleanupService';
import Button from '../../components/Button';

const AdminDashboard: React.FC = () => {
    const { claimRequests, markClaimRequest, shops } = useApp();
    const [loading, setLoading] = useState(false);
    const [draftCounts, setDraftCounts] = useState<Record<string, number>>({});
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
    const [cleanupError, setCleanupError] = useState<string | null>(null);

    const updateClaimRequest = async (
        requestId: string,
        status: "approved" | "rejected"
    ) => {
        setLoading(true);
        await markClaimRequest(requestId, status);
        setLoading(false);
    };

    useEffect(() => {
        fetchDraftCounts().then(setDraftCounts);
    }, []);

    const handleCleanup = async () => {
        setCleanupLoading(true);
        setCleanupResult(null);
        setCleanupError(null);
        try {
            const result = await cleanupOrphanedUploads();
            setCleanupResult(result);
        } catch (err: any) {
            setCleanupError(err.message || 'Cleanup failed');
        } finally {
            setCleanupLoading(false);
        }
    };

    const pendingRequests = claimRequests.filter(r => r.status === "pending");
    const approvedRequests = claimRequests.filter(r => r.status === "approved");

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link to="/admin/shop-queue" className="bg-white p-6 rounded-xl border border-coffee-100 shadow-sm hover:border-volt-400 transition-colors">
                    <h3 className="text-sm font-bold text-coffee-500 uppercase mb-2">Pending Review</h3>
                    <p className="text-3xl font-black text-coffee-900">{draftCounts.pending_review ?? '—'}</p>
                </Link>

                <div className="bg-white p-6 rounded-xl border border-coffee-100 shadow-sm">
                    <h3 className="text-sm font-bold text-coffee-500 uppercase mb-2">Approved (Awaiting Email)</h3>
                    <p className="text-3xl font-black text-coffee-900">{draftCounts.approved ?? '—'}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-coffee-100 shadow-sm">
                    <h3 className="text-sm font-bold text-coffee-500 uppercase mb-2">Published</h3>
                    <p className="text-3xl font-black text-green-600">{draftCounts.published ?? '—'}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-coffee-100 shadow-sm">
                    <h3 className="text-sm font-bold text-coffee-500 uppercase mb-2">Total Live Shops</h3>
                    <p className="text-3xl font-black text-coffee-900">{shops.length}</p>
                </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white rounded-3xl shadow-lg border border-coffee-100 overflow-hidden">
                <div className="bg-coffee-900 p-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-volt-400">
                        Pending Claims ({pendingRequests.length})
                    </h2>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="p-10 text-center text-coffee-400">
                        <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                        <p>No pending verification requests.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-coffee-100">
                        {pendingRequests.map(request => {
                            const shop = shops.find(s => s.id === request.shopId);
                            return (
                                <div
                                    key={request.id}
                                    className="p-6 flex flex-col md:flex-row gap-6 md:items-center"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold text-lg text-coffee-900">
                                                {shop?.name || "Unknown Shop"}
                                            </h3>
                                            <span className="text-xs bg-coffee-100 px-2 py-0.5 rounded text-coffee-600 font-medium uppercase">
                                                {request.role}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex items-center text-sm text-coffee-700 bg-coffee-50 p-2 rounded-lg border border-coffee-100">
                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-coffee-400 mr-3 shadow-sm">
                                                    <i className="fas fa-envelope"></i>
                                                </div>
                                                <div className="overflow-hidden text-ellipsis">
                                                    <p className="text-[10px] uppercase font-bold text-coffee-400">
                                                        Contact Email
                                                    </p>
                                                    <p className="font-medium">
                                                        {request.businessEmail}
                                                    </p>
                                                </div>
                                            </div>

                                            <a
                                                href={request.socialLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-sm text-coffee-700 bg-coffee-50 p-2 rounded-lg border border-coffee-100 hover:border-volt-400 hover:bg-white transition-all group"
                                            >
                                                <div className="w-8 h-8 bg-white group-hover:bg-volt-400 rounded-full flex items-center justify-center text-coffee-400 group-hover:text-coffee-900 mr-3 shadow-sm transition-colors">
                                                    <i className="fas fa-external-link-alt"></i>
                                                </div>
                                                <div className="overflow-hidden text-ellipsis">
                                                    <p className="text-[10px] uppercase font-bold text-coffee-400">
                                                        Verification Source
                                                    </p>
                                                    <p className="font-medium text-blue-600 underline truncate">
                                                        {request.socialLink}
                                                    </p>
                                                </div>
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 flex-col sm:flex-row">
                                        <Button
                                            variant="secondary"
                                            disabled={loading}
                                            onClick={() => updateClaimRequest(request.id, "approved")}
                                        >
                                            <i className="fas fa-check mr-2"></i> Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            disabled={loading}
                                            onClick={() => updateClaimRequest(request.id, "rejected")}
                                        >
                                            <i className="fas fa-times mr-2"></i> Reject
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Storage Cleanup */}
            <div className="bg-white rounded-3xl shadow-sm border border-coffee-100 overflow-hidden">
                <div className="p-6 border-b border-coffee-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-coffee-900">Storage Cleanup</h2>
                        <p className="text-sm text-coffee-400 mt-1">
                            Remove orphaned photos from agent-uploads older than 30 days
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        disabled={cleanupLoading}
                        onClick={handleCleanup}
                    >
                        {cleanupLoading ? (
                            <><i className="fas fa-spinner fa-spin mr-2"></i> Scanning...</>
                        ) : (
                            <><i className="fas fa-broom mr-2"></i> Clean Up Orphaned Uploads</>
                        )}
                    </Button>
                </div>
                {cleanupError && (
                    <div className="p-4 bg-red-50 border-b border-red-100 text-red-700 text-sm">
                        <i className="fas fa-exclamation-triangle mr-2"></i>{cleanupError}
                    </div>
                )}
                {cleanupResult && (
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-black text-coffee-900">{cleanupResult.orphaned_found}</p>
                                <p className="text-xs text-coffee-400 uppercase font-bold mt-1">Orphaned Found</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-green-600">{cleanupResult.deleted}</p>
                                <p className="text-xs text-coffee-400 uppercase font-bold mt-1">Deleted</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-coffee-900">{cleanupResult.referenced_count}</p>
                                <p className="text-xs text-coffee-400 uppercase font-bold mt-1">Referenced (kept)</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-coffee-500">{cleanupResult.cutoff_date}</p>
                                <p className="text-xs text-coffee-400 uppercase font-bold mt-1">Cutoff Date</p>
                            </div>
                        </div>
                        {cleanupResult.errors > 0 && (
                            <p className="text-sm text-red-600 mt-3 text-center">
                                <i className="fas fa-exclamation-circle mr-1"></i>
                                {cleanupResult.errors} file(s) failed to delete
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Approved History */}
            <div className="bg-white rounded-3xl shadow-sm border border-coffee-100 overflow-hidden opacity-80">
                <div className="p-6 border-b border-coffee-100">
                    <h2 className="text-lg font-bold text-coffee-900">
                        Approved History
                    </h2>
                </div>
                <div className="divide-y divide-coffee-100">
                    {approvedRequests.map(request => {
                        const shop = shops.find(s => s.id === request.shopId);
                        return (
                            <div
                                key={request.id}
                                className="p-4 flex items-center justify-between"
                            >
                                <div>
                                    <span className="font-bold text-coffee-900">
                                        {shop?.name || "Unknown Shop"}
                                    </span>
                                    <span className="text-coffee-500 text-sm mx-2">via</span>
                                    <a
                                        href={request.socialLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        Social Link
                                    </a>
                                </div>
                                <span className="text-green-600 font-bold text-sm flex items-center">
                                    <i className="fas fa-check-circle mr-1"></i> Verified
                                </span>
                            </div>
                        );
                    })}
                    {approvedRequests.length === 0 && (
                        <div className="p-4 text-coffee-400 text-sm">No history yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
