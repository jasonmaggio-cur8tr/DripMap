import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchFollowingFeed, toggleExperienceLogLike } from "../services/dbService";

const CommunityFeed: React.FC = () => {
    const { user } = useApp();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            const data = await fetchFollowingFeed(user.id);
            setLogs(data);
            setLoading(false);
        };
        fetchFeed();
    }, [user]);

    const handleLike = async (e: React.MouseEvent, logId: string, index: number) => {
        e.stopPropagation();
        if (!user) return;

        // Copy logs for optimistic update
        const newLogs = [...logs];
        const log = newLogs[index];

        const wasLiked = log.isLiked;
        log.isLiked = !wasLiked;
        log.likesCount = (log.likesCount || 0) + (log.isLiked ? 1 : -1);
        setLogs(newLogs);

        try {
            const result = await toggleExperienceLogLike(logId, user.id);
            if (!result.success) {
                // Revert on failure
                newLogs[index].isLiked = wasLiked;
                newLogs[index].likesCount = (newLogs[index].likesCount || 0) + (wasLiked ? 1 : -1);
                setLogs([...newLogs]);
            }
        } catch {
            newLogs[index].isLiked = wasLiked;
            newLogs[index].likesCount = (newLogs[index].likesCount || 0) + (wasLiked ? 1 : -1);
            setLogs([...newLogs]);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-coffee-50 pt-20 px-4 text-center">
                <h1 className="text-3xl font-serif font-bold text-coffee-900 mt-12 mb-4">Following Feed</h1>
                <p className="text-coffee-600 mb-6">Please log in to see updates from the community.</p>
                <Link to="/auth" className="inline-block bg-coffee-900 text-white px-6 py-2 rounded-xl">Log In</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-coffee-50 pt-20 px-4 sm:px-6 pb-20">
            <div className="container mx-auto max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex text-volt-500 text-3xl h-8 overflow-visible" style={{ letterSpacing: "-0.25em" }}>
                        <i className="fas fa-mug-hot relative z-10 scale-[0.8]"></i>
                        <i className="fas fa-mug-hot relative z-30 scale-110 -ml-2 mb-1"></i>
                        <i className="fas fa-mug-hot relative z-20 scale-[0.9] -ml-2"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-coffee-900">
                            Following
                        </h1>
                        <p className="text-coffee-600 text-sm">
                            Recent logs and activity from tastemakers you follow.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <i className="fas fa-spinner fa-spin text-coffee-800 text-2xl"></i>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-coffee-100 p-8 text-center mt-8">
                        <h2 className="text-xl font-bold text-coffee-900 mb-2">It's quiet here...</h2>
                        <p className="text-coffee-600 mb-6">You aren't following anyone with recent logs yet.</p>
                        <Link to="/leaderboard" className="inline-block border border-coffee-200 bg-coffee-50 hover:bg-white text-coffee-900 font-bold px-6 py-2 rounded-xl transition-colors">
                            Discover Tastemakers
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log, index) => (
                            <div key={log.id} className="p-5 rounded-2xl bg-white border border-coffee-100 shadow-sm relative">

                                {/* Header: User Info */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <Link to={`/profile/${log.userId}`} className="block shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-coffee-100 overflow-hidden border border-coffee-200">
                                                {log.userAvatar ? (
                                                    <img src={log.userAvatar} alt={log.userName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-coffee-400">
                                                        <i className="fas fa-user"></i>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                        <div>
                                            <Link to={`/profile/${log.userId}`} className="font-bold text-coffee-900 text-sm hover:text-volt-600 block">
                                                {log.userName}
                                            </Link>
                                            <div className="text-xs text-coffee-400">
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 bg-coffee-900 text-volt-400 px-2 py-1 rounded-md">
                                        <i className="fas fa-tint text-[10px]"></i>
                                        <span className="text-sm font-bold">{log.overallQuality}</span>
                                    </div>
                                </div>

                                {/* Shop Reference + Cover */}
                                <Link to={`/shop/${log.shopId}`} className="block group mb-3">
                                    {log.shopCoverImage && (
                                        <div className="h-40 w-full rounded-xl overflow-hidden mb-2">
                                            <img src={log.shopCoverImage} alt={log.shopName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    )}
                                    <h3 className="font-serif font-bold text-lg text-coffee-900 group-hover:text-volt-600 transition-colors">
                                        {log.shopName}
                                    </h3>
                                    <div className="text-xs text-coffee-500 uppercase font-bold">
                                        <i className="fas fa-map-marker-alt mr-1"></i>
                                        {log.shopCity}, {log.shopState}
                                    </div>
                                </Link>

                                {/* Log Quick Take */}
                                {log.quickTake && (
                                    <div className="relative pl-3 border-l-2 border-volt-400 mb-3 bg-coffee-50/50 py-2 rounded-r pr-2">
                                        <p className="text-coffee-700 italic text-sm">"{log.quickTake}"</p>
                                    </div>
                                )}

                                {/* Action Bar */}
                                <div className="flex items-center justify-between pt-3 border-t border-coffee-50">
                                    <button
                                        onClick={(e) => handleLike(e, log.id, index)}
                                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${log.isLiked
                                            ? "bg-red-50 text-red-500 hover:bg-red-100"
                                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                            }`}
                                    >
                                        <i className={`${log.isLiked ? 'fas' : 'far'} fa-heart`}></i>
                                        {log.likesCount > 0 && <span>{log.likesCount}</span>}
                                    </button>
                                    <Link to={`/shop/${log.shopId}`} className="text-[10px] text-coffee-400 font-bold uppercase hover:text-volt-500 transition-colors">
                                        View Full Log <i className="fas fa-chevron-right ml-1"></i>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityFeed;
