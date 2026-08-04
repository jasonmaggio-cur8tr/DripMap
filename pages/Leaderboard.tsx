import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getLeaderboard,
    getMonthlyUserStats,
    getMonthlyShopStats,
    getBadgeAwards,
    currentMonthStart,
    previousMonthStart,
} from "../services/dbService";
import { useApp } from "../context/AppContext";
import MenuDrawer from "../components/darkroast/MenuDrawer";
import BottomTabBar from "../components/darkroast/BottomTabBar";
import NotificationBell from "../components/NotificationBell";
import BadgedAvatar from "../components/BadgedAvatar";
import { sizedImageUrl } from "../lib/imageUrl";

interface LeaderboardEntry {
    user_id: string;
    username: string;
    avatar_url: string;
    total_score: number;
}

interface MonthlyUserStat {
    user_id: string;
    month_start: string;
    logs_count: number;
    matcha_shops_count: number;
    drip_likes_received: number;
    dates_created: number;
    shops_visited: number;
    engagement_given: number;
    month_points: number;
    profiles?: { username: string; avatar_url: string | null } | null;
}

interface MonthlyShopStat {
    shop_id: string;
    month_start: string;
    logs_count: number;
    dates_count: number;
    saves_count: number;
    pourn_likes_count: number;
    shops?: {
        id: string;
        name: string;
        city: string | null;
        state: string | null;
        shop_images?: { url: string }[] | null;
    } | null;
}

interface BadgeAward {
    id: string;
    badge_slug: string;
    month_start: string;
    user_id: string | null;
    shop_id: string | null;
    value: number;
    badge?: { slug: string; name: string; emoji: string; description: string; scope: string } | null;
    profile?: { username: string; avatar_url: string | null } | null;
    shop?: { id: string; name: string; city: string | null; shop_images?: { url: string }[] | null } | null;
}

// Dark Roast tokens
const BG = "#1e1712";
const SURFACE = "#2b221b";
const CHIP = "#2f251d";
const TEXT = "#f3efe0";
const MUTED = "rgba(243,239,224,0.55)";
const FAINT = "rgba(243,239,224,0.45)";
const VOLT = "#ccff00";

type UserMetric = "points" | "alltime" | "logs" | "matcha" | "driplikes" | "explorer";
type ShopMetric = "logged" | "dates" | "loved";

const USER_METRICS: { key: UserMetric; label: string; unit: string; field: keyof MonthlyUserStat }[] = [
    { key: "points", label: "Points", unit: "pts", field: "month_points" },
    { key: "alltime", label: "All-time", unit: "pts", field: "month_points" }, // field unused
    { key: "logs", label: "Logs", unit: "logs", field: "logs_count" },
    { key: "matcha", label: "Matcha", unit: "matcha spots", field: "matcha_shops_count" },
    { key: "driplikes", label: "Drip Likes", unit: "likes", field: "drip_likes_received" },
    { key: "explorer", label: "Explorer", unit: "shops", field: "shops_visited" },
];

const SHOP_METRICS: { key: ShopMetric; label: string; emoji: string; unit: string }[] = [
    { key: "logged", label: "Logged", emoji: "📓", unit: "logs" },
    { key: "dates", label: "Dates", emoji: "💘", unit: "dates" },
    { key: "loved", label: "Loved", emoji: "❤️", unit: "loves" },
];

const shopMetricValue = (s: MonthlyShopStat, metric: ShopMetric): number => {
    if (metric === "logged") return s.logs_count;
    if (metric === "dates") return s.dates_count;
    return s.saves_count + s.pourn_likes_count;
};

/** Client-side countdown to end of the current month. */
const countdownLabel = (): string => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const ms = endOfMonth.getTime() - now.getTime();
    const days = Math.floor(ms / 86400000);
    if (days < 1) return "Final hours ☕";
    const hours = Math.floor((ms % 86400000) / 3600000);
    return `${days}d ${hours}h left`;
};

const monthName = (monthStart: string): string => {
    const [y, m] = monthStart.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "long" });
};

const Leaderboard: React.FC = () => {
    const { user } = useApp();
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [monthlyUsers, setMonthlyUsers] = useState<MonthlyUserStat[]>([]);
    const [monthlyShops, setMonthlyShops] = useState<MonthlyShopStat[]>([]);
    const [champs, setChamps] = useState<BadgeAward[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [tab, setTab] = useState<"users" | "shops">("users");
    const [userMetric, setUserMetric] = useState<UserMetric>("points");
    const [shopMetric, setShopMetric] = useState<ShopMetric>("logged");

    // "Where do I stand RIGHT NOW" — always ranked by month points.
    const standing = useMemo(() => {
        if (!user?.id) return null;
        const ranked = [...monthlyUsers]
            .filter(s => (s.month_points as number) > 0)
            .sort((a, b) => (b.month_points as number) - (a.month_points as number));
        const idx = ranked.findIndex(s => s.user_id === user.id);
        if (idx === -1) return { onBoard: false as const };
        const me = ranked[idx];
        const ahead = idx > 0 ? ranked[idx - 1] : null;
        return {
            onBoard: true as const,
            rank: idx + 1,
            points: me.month_points as number,
            gap: ahead ? (ahead.month_points as number) - (me.month_points as number) : 0,
            aheadName: ahead?.profiles?.username ?? null,
        };
    }, [monthlyUsers, user?.id]);

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            const [allTime, mUsers, mShops, awards] = await Promise.all([
                getLeaderboard(),
                getMonthlyUserStats(currentMonthStart()),
                getMonthlyShopStats(currentMonthStart()),
                getBadgeAwards(previousMonthStart()),
            ]);
            setLeaders(allTime || []);
            setMonthlyUsers(mUsers as MonthlyUserStat[]);
            setMonthlyShops(mShops as MonthlyShopStat[]);
            setChamps(awards as BadgeAward[]);
            // Before the monthly tables have data, fall back to the all-time
            // ranking so the board never looks empty.
            if (!mUsers || mUsers.length === 0) setUserMetric("alltime");
            setLoading(false);
        };
        fetchAll();
    }, []);

    // user_id -> reigning badge (last month's win) for avatar overlays
    const badgeByUser = useMemo(() => {
        const map: Record<string, { emoji: string; name: string }> = {};
        for (const a of champs) {
            if (a.user_id && a.badge && !map[a.user_id]) {
                map[a.user_id] = { emoji: a.badge.emoji, name: a.badge.name };
            }
        }
        return map;
    }, [champs]);

    const activeUserMetric = USER_METRICS.find(m => m.key === userMetric)!;

    const sortedMonthlyUsers = useMemo(() => {
        const field = activeUserMetric.field;
        return monthlyUsers
            .filter(s => (s[field] as number) > 0)
            .sort((a, b) => (b[field] as number) - (a[field] as number))
            .slice(0, 50);
    }, [monthlyUsers, activeUserMetric]);

    const sortedShops = useMemo(() => {
        return monthlyShops
            .filter(s => shopMetricValue(s, shopMetric) > 0)
            .sort((a, b) => shopMetricValue(b, shopMetric) - shopMetricValue(a, shopMetric))
            .slice(0, 50);
    }, [monthlyShops, shopMetric]);

    const rankBadge = (index: number) => (
        <div
            className={`w-8 flex-shrink-0 text-center font-serif text-lg font-bold ${index === 0
                ? "text-2xl text-yellow-400"
                : index === 1
                    ? "text-xl text-gray-300"
                    : index === 2
                        ? "text-xl text-amber-500"
                        : ""
                }`}
            style={index > 2 ? { color: FAINT } : undefined}
        >
            {index < 3 ? <i className="fas fa-mug-hot"></i> : index + 1}
        </div>
    );

    const metricPill = (label: string, active: boolean, onClick: () => void) => (
        <button
            key={label}
            onClick={onClick}
            className="flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={
                active
                    ? { background: VOLT, color: "#231b15" }
                    : { background: CHIP, color: MUTED }
            }
        >
            {label}
        </button>
    );

    const emptyState = (message: string) => (
        <div className="py-8 text-center italic" style={{ color: MUTED }}>
            {message}
        </div>
    );

    return (
        <div className="min-h-screen" style={{ background: BG }}>
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
                            style={{ background: SURFACE }}
                        >
                            <i className="fas fa-bars" style={{ color: TEXT }}></i>
                        </button>
                        <h1 className="font-serif text-[19px] font-black" style={{ color: TEXT, letterSpacing: "-0.02em" }}>
                            Leaders
                        </h1>
                    </div>
                    {user && <NotificationBell />}
                </div>
            </header>

            <div className="mx-auto max-w-2xl px-4 pb-[110px] pt-20 sm:px-6">
                <p className="mb-5 text-sm" style={{ color: MUTED }}>
                    The most active tastemakers in the DripMap community.
                </p>

                {/* Tabs + countdown chip */}
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div
                        className="flex items-center gap-1 rounded-full p-1"
                        style={{ background: SURFACE }}
                    >
                        {(["users", "shops"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className="rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
                                style={
                                    tab === t
                                        ? { background: VOLT, color: "#231b15" }
                                        : { background: "transparent", color: MUTED }
                                }
                            >
                                {t === "users" ? "Users" : "Shops"}
                            </button>
                        ))}
                    </div>
                    <div
                        className="flex flex-shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{ background: CHIP, color: VOLT }}
                        title="Time left in this month's race"
                    >
                        <i className="fas fa-hourglass-half"></i>
                        <span>{countdownLabel()}</span>
                    </div>
                </div>

                {/* Your standing this month */}
                {tab === "users" && standing && (
                    <div
                        className="mb-6 flex items-center gap-4 rounded-2xl border p-4"
                        style={{ background: "rgba(204,255,0,0.10)", borderColor: "rgba(204,255,0,0.35)" }}
                    >
                        <div
                            className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full font-black"
                            style={{ background: VOLT, color: "#231b15", width: 52, height: 52, fontFamily: "Fraunces, serif" }}
                        >
                            {standing.onBoard ? `#${standing.rank}` : "—"}
                        </div>
                        <div className="min-w-0">
                            <div className="font-bold" style={{ color: TEXT }}>
                                {standing.onBoard
                                    ? `You're #${standing.rank} this month · ${standing.points.toLocaleString()} pts`
                                    : "You're not on the board yet"}
                            </div>
                            <div className="text-sm font-semibold" style={{ color: VOLT }}>
                                {standing.onBoard
                                    ? standing.rank === 1
                                        ? "You hold the crown. Defend it. 👑"
                                        : `${standing.gap.toLocaleString()} pts behind ${standing.aheadName ? "@" + standing.aheadName : "the next spot"}`
                                    : "Log a visit or a drink to enter this month's race →"}
                            </div>
                        </div>
                    </div>
                )}

                {/* Last month's champs */}
                <div className="mb-6">
                    <h2
                        className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em]"
                        style={{ color: FAINT }}
                    >
                        🏆 Last Month's Champs
                    </h2>
                    {champs.length === 0 ? (
                        <div
                            className="rounded-2xl border border-dashed border-white/[0.09] px-4 py-3 text-xs italic"
                            style={{ color: MUTED }}
                        >
                            No champs crowned yet — badges drop at the end of the month. The throne is up for grabs.
                        </div>
                    ) : (
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {champs.map(a => {
                                const isUser = !!a.user_id;
                                const label = isUser
                                    ? `@${a.profile?.username || "someone"}`
                                    : a.shop?.name || "A shop";
                                const chip = (
                                    <div
                                        className="flex flex-shrink-0 items-center gap-2.5 rounded-2xl border px-3 py-2"
                                        style={{ background: SURFACE, borderColor: "rgba(204,255,0,0.35)" }}
                                    >
                                        {isUser ? (
                                            <BadgedAvatar
                                                avatarUrl={sizedImageUrl(a.profile?.avatar_url || "", { width: 80 })}
                                                alt={label}
                                                size={36}
                                                badge={a.badge ? { emoji: a.badge.emoji, name: a.badge.name } : null}
                                            />
                                        ) : (
                                            <img
                                                src={sizedImageUrl(a.shop?.shop_images?.[0]?.url || "", { width: 80 }) || "https://via.placeholder.com/150"}
                                                alt={label}
                                                className="h-9 w-9 flex-shrink-0 rounded-xl border border-white/[0.09] object-cover"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <div className="whitespace-nowrap text-xs font-bold" style={{ color: TEXT }}>
                                                {label}
                                            </div>
                                            <div className="whitespace-nowrap text-[10px] font-bold" style={{ color: VOLT }}>
                                                {a.badge?.emoji} {a.badge?.name}
                                            </div>
                                        </div>
                                    </div>
                                );
                                return isUser && a.profile?.username ? (
                                    <Link
                                        key={a.id}
                                        to={`/profile/${a.profile.username}`}
                                        className="focus:outline-none focus:ring-2 focus:ring-volt-400"
                                    >
                                        {chip}
                                    </Link>
                                ) : !isUser && a.shop?.id ? (
                                    <Link
                                        key={a.id}
                                        to={`/shop/${a.shop.id}`}
                                        className="focus:outline-none focus:ring-2 focus:ring-volt-400"
                                    >
                                        {chip}
                                    </Link>
                                ) : (
                                    <div key={a.id}>{chip}</div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div
                    className="mb-8 rounded-3xl border border-white/[0.06] p-4 sm:p-6"
                    style={{ background: SURFACE }}
                >
                    <div className="mb-4 flex items-center justify-between border-b border-white/[0.07] pb-4">
                        <h2 className="font-bold" style={{ color: TEXT }}>
                            {tab === "shops"
                                ? `${monthName(currentMonthStart())} Shop Standings`
                                : userMetric === "alltime"
                                    ? "Global Ranking"
                                    : `${monthName(currentMonthStart())} Standings`}
                        </h2>
                    </div>

                    {/* Metric pills */}
                    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                        {tab === "users"
                            ? USER_METRICS.map(m => metricPill(m.label, userMetric === m.key, () => setUserMetric(m.key)))
                            : SHOP_METRICS.map(m => metricPill(m.label, shopMetric === m.key, () => setShopMetric(m.key)))}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <i className="fas fa-spinner fa-spin text-2xl" style={{ color: FAINT }}></i>
                        </div>
                    ) : tab === "users" && userMetric === "alltime" ? (
                        // ---------- All-time ranking (existing user_drip_scores) ----------
                        <div className="space-y-3">
                            {leaders.length === 0
                                ? emptyState("No scores recorded yet. Be the first to earn points!")
                                : leaders.map((leader, index) => (
                                    <Link
                                        key={leader.user_id}
                                        to={`/profile/${leader.username}`}
                                        className="flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-white/[0.09] hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-volt-400"
                                    >
                                        {rankBadge(index)}
                                        <BadgedAvatar
                                            avatarUrl={sizedImageUrl(leader.avatar_url, { width: 120 })}
                                            alt={leader.username}
                                            size={48}
                                            badge={badgeByUser[leader.user_id] || null}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-bold" style={{ color: TEXT }}>
                                                @{leader.username}
                                            </div>
                                            <div
                                                className={`text-xs ${index < 3 ? "font-bold" : ""}`}
                                                style={{ color: index < 3 ? "#e4ddce" : MUTED }}
                                            >
                                                {index === 0 && "Final Drip Boss"}
                                                {index === 1 && "Third Wave Wizard"}
                                                {index === 2 && "Crema Commander"}
                                                {index > 2 && "Tastemaker"}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 font-bold" style={{ color: TEXT }}>
                                                <i className="fas fa-bolt text-xs" style={{ color: VOLT }}></i>
                                                {leader.total_score}
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: FAINT }}>
                                                Points
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                        </div>
                    ) : tab === "users" ? (
                        // ---------- Monthly user standings ----------
                        <div className="space-y-3">
                            {sortedMonthlyUsers.length === 0
                                ? emptyState("Nothing on the board yet this month. Log a shop and claim your spot.")
                                : sortedMonthlyUsers.map((stat, index) => {
                                    const username = stat.profiles?.username || "someone";
                                    const value = stat[activeUserMetric.field] as number;
                                    return (
                                        <Link
                                            key={stat.user_id}
                                            to={`/profile/${username}`}
                                            className="flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-white/[0.09] hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-volt-400"
                                        >
                                            {rankBadge(index)}
                                            <BadgedAvatar
                                                avatarUrl={sizedImageUrl(stat.profiles?.avatar_url || "", { width: 120 })}
                                                alt={username}
                                                size={48}
                                                badge={badgeByUser[stat.user_id] || null}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-bold" style={{ color: TEXT }}>
                                                    @{username}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1 font-bold" style={{ color: TEXT }}>
                                                    <i className="fas fa-bolt text-xs" style={{ color: VOLT }}></i>
                                                    {value}
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: FAINT }}>
                                                    {activeUserMetric.unit}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                        </div>
                    ) : (
                        // ---------- Monthly shop standings ----------
                        <div className="space-y-3">
                            {sortedShops.length === 0
                                ? emptyState("No shop activity logged yet this month. Get out there and put your spot on the board.")
                                : sortedShops.map((stat, index) => {
                                    const shop = stat.shops;
                                    const activeShopMetric = SHOP_METRICS.find(m => m.key === shopMetric)!;
                                    return (
                                        <Link
                                            key={stat.shop_id}
                                            to={`/shop/${shop?.id || stat.shop_id}`}
                                            className="flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-white/[0.09] hover:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-volt-400"
                                        >
                                            {rankBadge(index)}
                                            <img
                                                src={sizedImageUrl(shop?.shop_images?.[0]?.url || "", { width: 120 }) || "https://via.placeholder.com/150"}
                                                alt={shop?.name || "Shop"}
                                                className="h-12 w-12 flex-shrink-0 rounded-xl border border-white/[0.09] object-cover"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-bold" style={{ color: TEXT }}>
                                                    {shop?.name || "Unknown shop"}
                                                </div>
                                                <div className="truncate text-xs" style={{ color: MUTED }}>
                                                    {shop?.city ? `${shop.city} · ` : ""}
                                                    📓 {stat.logs_count} · 💘 {stat.dates_count} · ❤️ {stat.saves_count + stat.pourn_likes_count}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1 font-bold" style={{ color: TEXT }}>
                                                    <span className="text-xs">{activeShopMetric.emoji}</span>
                                                    {shopMetricValue(stat, shopMetric)}
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: FAINT }}>
                                                    {activeShopMetric.unit}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
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
