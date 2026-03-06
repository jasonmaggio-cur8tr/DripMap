import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard } from "../services/dbService";

interface LeaderboardEntry {
    user_id: string;
    username: string;
    avatar_url: string;
    total_score: number;
}

const Leaderboard: React.FC = () => {
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

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
        <div className="min-h-screen bg-coffee-50 pt-20 px-4 sm:px-6 pb-20">
            <div className="container mx-auto max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <i className="fas fa-mug-hot text-volt-500 text-3xl"></i>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-coffee-900">
                            Leaderboard
                        </h1>
                        <p className="text-coffee-600 text-sm">
                            The most active tastemakers in the DripMap community.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-coffee-100 p-4 sm:p-6 mb-8">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-coffee-100">
                        <h2 className="font-bold text-coffee-900">Global Ranking</h2>
                        <div className="flex items-center gap-2 text-xs font-bold bg-coffee-50 text-coffee-500 px-3 py-1.5 rounded-full">
                            <i className="fas fa-info-circle"></i>
                            <span>Monthly Reset Pending</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <i className="fas fa-spinner fa-spin text-coffee-800 text-2xl"></i>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {leaders.length === 0 ? (
                                <div className="text-center py-8 text-coffee-500 italic">
                                    No scores recorded yet. Be the first to earn points!
                                </div>
                            ) : (
                                leaders.map((user, index) => (
                                    <Link
                                        key={user.user_id}
                                        to={`/profile/${user.username}`}
                                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-coffee-50 transition-colors border border-transparent hover:border-coffee-100"
                                    >
                                        <div
                                            className={`w-8 font-serif font-bold text-lg text-center flex-shrink-0 ${index === 0
                                                ? "text-yellow-500 text-2xl"
                                                : index === 1
                                                    ? "text-gray-400 text-xl"
                                                    : index === 2
                                                        ? "text-amber-600 text-xl"
                                                        : "text-coffee-400"
                                                }`}
                                        >
                                            {index < 3 ? <i className="fas fa-mug-hot"></i> : index + 1}
                                        </div>

                                        <img
                                            src={user.avatar_url || "https://via.placeholder.com/150"}
                                            alt={user.username}
                                            className="w-12 h-12 rounded-full border border-coffee-200 object-cover"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-coffee-900 truncate">
                                                @{user.username}
                                            </div>
                                            <div className={`text-xs ${index < 3 ? 'font-bold text-coffee-800' : 'text-coffee-500'}`}>
                                                {index === 0 && "Final Drip Boss"}
                                                {index === 1 && "Third Wave Wizard"}
                                                {index === 2 && "Crema Commander"}
                                                {index > 2 && "Tastemaker"}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="font-bold text-coffee-900 flex items-center gap-1 justify-end">
                                                <i className="fas fa-bolt text-volt-500 text-xs"></i>
                                                {user.total_score}
                                            </div>
                                            <div className="text-[10px] text-coffee-400 font-bold uppercase tracking-wide">
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
        </div>
    );
};

export default Leaderboard;
