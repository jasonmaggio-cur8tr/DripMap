import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchFollowingFeed, toggleExperienceLogLike } from "../services/dbService";
import MenuDrawer from "../components/darkroast/MenuDrawer";
import BottomTabBar from "../components/darkroast/BottomTabBar";
import NotificationBell from "../components/NotificationBell";
import { sizedImageUrl } from "../lib/imageUrl";

const CommunityFeed: React.FC = () => {
    const { user } = useApp();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

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

    return (
        <div className="min-h-screen" style={{ background: "#1e1712" }}>
            {/* Sticky glass header */}
            <header
                className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
                style={{ background: "rgba(23,18,14,0.82)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
            >
                <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Open menu"
                            className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
                            style={{ background: "#2b221b" }}
                        >
                            <i className="fas fa-bars" style={{ color: "#f3efe0" }}></i>
                        </button>
                        <h1 className="font-serif text-[19px] font-black" style={{ color: "#f3efe0", letterSpacing: "-0.02em" }}>
                            Community
                        </h1>
                    </div>
                    {user && <NotificationBell />}
                </div>
            </header>

            <div className="mx-auto max-w-2xl px-4 pb-[110px] pt-20 sm:px-6">
                {!user ? (
                    <div className="pt-12 text-center">
                        <h2 className="mb-4 font-serif text-3xl font-black" style={{ color: "#f3efe0" }}>Following Feed</h2>
                        <p className="mb-6" style={{ color: "rgba(243,239,224,0.55)" }}>
                            Please log in to see updates from the community.
                        </p>
                        <Link
                            to="/auth"
                            className="inline-block rounded-full px-6 py-2.5 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-volt-400"
                            style={{ background: "#a3e635", color: "#231b15" }}
                        >
                            Log In
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="mb-5 text-sm" style={{ color: "rgba(243,239,224,0.55)" }}>
                            Recent logs and activity from tastemakers you follow.
                        </p>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <i className="fas fa-spinner fa-spin text-2xl" style={{ color: "rgba(243,239,224,0.45)" }}></i>
                            </div>
                        ) : logs.length === 0 ? (
                            <div
                                className="mt-8 rounded-3xl border border-white/[0.06] p-8 text-center"
                                style={{ background: "#2b221b" }}
                            >
                                <h2 className="mb-2 text-xl font-bold" style={{ color: "#f3efe0" }}>It's quiet here...</h2>
                                <p className="mb-6" style={{ color: "rgba(243,239,224,0.55)" }}>
                                    You aren't following anyone with recent logs yet.
                                </p>
                                <Link
                                    to="/leaderboard"
                                    className="inline-block rounded-full border border-white/[0.09] px-6 py-2.5 text-sm font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
                                    style={{ background: "#2f251d", color: "#a3e635" }}
                                >
                                    Discover Tastemakers
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log, index) => (
                                    <div
                                        key={log.id}
                                        className="relative rounded-2xl border border-white/[0.06] p-5"
                                        style={{ background: "#2b221b" }}
                                    >

                                        {/* Header: User Info */}
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <Link to={`/profile/${log.userId}`} className="block shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400">
                                                    <div className="h-10 w-10 overflow-hidden rounded-full border border-white/[0.09]" style={{ background: "#2f251d" }}>
                                                        {log.userAvatar ? (
                                                            <img src={sizedImageUrl(log.userAvatar, { width: 120 })} alt={log.userName} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center" style={{ color: "rgba(243,239,224,0.45)" }}>
                                                                <i className="fas fa-user"></i>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Link>
                                                <div>
                                                    <Link
                                                        to={`/profile/${log.userId}`}
                                                        className="block text-sm font-bold text-[#f3efe0] transition-colors hover:text-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400"
                                                    >
                                                        {log.userName}
                                                    </Link>
                                                    <div className="text-xs" style={{ color: "rgba(243,239,224,0.45)" }}>
                                                        {new Date(log.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                className="flex items-center gap-1 rounded-md px-2 py-1"
                                                style={{ background: "rgba(163,230,53,0.14)", color: "#a3e635" }}
                                            >
                                                <i className="fas fa-tint text-[10px]"></i>
                                                <span className="text-sm font-bold">{log.overallQuality}</span>
                                            </div>
                                        </div>

                                        {/* Shop Reference + Cover */}
                                        <Link to={`/shop/${log.shopId}`} className="group mb-3 block rounded-xl focus:outline-none focus:ring-2 focus:ring-volt-400">
                                            {log.shopCoverImage && (
                                                <div className="mb-2 h-40 w-full overflow-hidden rounded-xl" style={{ background: "#2f251d" }}>
                                                    <img
                                                        src={sizedImageUrl(log.shopCoverImage, { width: 1080 })}
                                                        alt={log.shopName}
                                                        loading="lazy"
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </div>
                                            )}
                                            <h3 className="font-serif text-lg font-black text-[#f3efe0] transition-colors group-hover:text-volt-400">
                                                {log.shopName}
                                            </h3>
                                            <div className="text-xs font-bold uppercase" style={{ color: "rgba(243,239,224,0.55)" }}>
                                                <i className="fas fa-map-marker-alt mr-1"></i>
                                                {log.shopCity}, {log.shopState}
                                            </div>
                                        </Link>

                                        {/* Log Quick Take */}
                                        {log.quickTake && (
                                            <div
                                                className="relative mb-3 rounded-r py-2 pl-3 pr-2"
                                                style={{ borderLeft: "2px solid #a3e635", background: "rgba(255,255,255,0.04)" }}
                                            >
                                                <p className="text-sm italic" style={{ color: "#e4ddce" }}>"{log.quickTake}"</p>
                                            </div>
                                        )}

                                        {/* Action Bar */}
                                        <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                                            <button
                                                onClick={(e) => handleLike(e, log.id, index)}
                                                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
                                                style={
                                                    log.isLiked
                                                        ? { background: "rgba(163,230,53,0.14)", color: "#a3e635" }
                                                        : { background: "#2f251d", color: "rgba(243,239,224,0.55)" }
                                                }
                                            >
                                                <i className={`${log.isLiked ? "fas" : "far"} fa-heart`}></i>
                                                {log.likesCount > 0 && <span>{log.likesCount}</span>}
                                            </button>
                                            <Link
                                                to={`/shop/${log.shopId}`}
                                                className="text-[10px] font-bold uppercase text-[#f3efe0]/45 transition-colors hover:text-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400"
                                            >
                                                View Full Log <i className="fas fa-chevron-right ml-1"></i>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <BottomTabBar />
        </div>
    );
};

export default CommunityFeed;
