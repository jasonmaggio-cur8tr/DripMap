import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard } from "../services/dbService";
import { useApp } from "../context/AppContext";
import MenuDrawer from "../components/darkroast/MenuDrawer";
import BottomTabBar from "../components/darkroast/BottomTabBar";
import NotificationBell from "../components/NotificationBell";
import { sizedImageUrl } from "../lib/imageUrl";

interface LeaderboardEntry {
    user_id: string;
    username: string;
    avatar_url: string;
    total_score: number;
}

const Leaderboard: React.FC = () => {
    const { user } = useApp();
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            const data = await getLeaderboard();
            setLeaders(data || []);
            setLoading(false);
        };
        fetchLeaderboard();
    }, []);

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
                            Leaders
                        </h1>
                    </div>
                    {user && <NotificationBell />}
                </div>
            </header>

            <div className="mx-auto max-w-2xl px-4 pb-[110px] pt-20 sm:px-6">
                <p className="mb-5 text-sm" style={{ color: "rgba(243,239,224,0.55)" }}>
                    The most active tastemakers in the DripMap community.
                </p>

                <div
                    className="mb-8 rounded-3xl border border-white/[0.06] p-4 sm:p-6"
                    style={{ background: "#2b221b" }}
                >
                    <div className="mb-6 flex items-center justify-between border-b border-white/[0.07] pb-4">
                        <h2 className="font-bold" style={{ color: "#f3efe0" }}>Global Ranking</h2>
                        <div
                            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
                            style={{ background: "#2f251d", color: "rgba(243,239,224,0.55)" }}
                        >
                            <i className="fas fa-info-circle"></i>
                            <span>Monthly Reset Pending</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <i className="fas fa-spinner fa-spin text-2xl" style={{ color: "rgba(243,239,224,0.45)" }}></i>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {leaders.length === 0 ? (
                                <div className="py-8 text-center italic" style={{ color: "rgba(243,239,224,0.55)" }}>
                                    No scores recorded yet. Be the first to earn points!
                                </div>
                            ) : (
                                leaders.map((user, index) => (
                                    <Link
                                        key={user.user_id}
                                        to={`/profile/${user.username}`}
                                        className="flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-white/[0.09] hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-volt-400"
                                    >
                                        <div
                                            className={`w-8 flex-shrink-0 text-center font-serif text-lg font-bold ${index === 0
                                                ? "text-2xl text-yellow-400"
                                                : index === 1
                                                    ? "text-xl text-gray-300"
                                                    : index === 2
                                                        ? "text-xl text-amber-500"
                                                        : ""
                                                }`}
                                            style={index > 2 ? { color: "rgba(243,239,224,0.45)" } : undefined}
                                        >
                                            {index < 3 ? <i className="fas fa-mug-hot"></i> : index + 1}
                                        </div>

                                        <img
                                            src={sizedImageUrl(user.avatar_url, { width: 120 }) || "https://via.placeholder.com/150"}
                                            alt={user.username}
                                            className="h-12 w-12 rounded-full border border-white/[0.09] object-cover"
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-bold" style={{ color: "#f3efe0" }}>
                                                @{user.username}
                                            </div>
                                            <div
                                                className={`text-xs ${index < 3 ? "font-bold" : ""}`}
                                                style={{ color: index < 3 ? "#e4ddce" : "rgba(243,239,224,0.55)" }}
                                            >
                                                {index === 0 && "Final Drip Boss"}
                                                {index === 1 && "Third Wave Wizard"}
                                                {index === 2 && "Crema Commander"}
                                                {index > 2 && "Tastemaker"}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 font-bold" style={{ color: "#f3efe0" }}>
                                                <i className="fas fa-bolt text-xs" style={{ color: "#ccff00" }}></i>
                                                {user.total_score}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "rgba(243,239,224,0.45)" }}>
                                                Points
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <BottomTabBar />
        </div>
    );
};

export default Leaderboard;
