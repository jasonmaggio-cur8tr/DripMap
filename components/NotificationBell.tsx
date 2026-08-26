import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fetchNotifications, markNotificationRead } from '../services/dbService';

const NotificationBell: React.FC = () => {
    const { user } = useApp();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadNotifications = async () => {
            if (!user) return;
            const data = await fetchNotifications(user.id);
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        };

        loadNotifications();
        // In a real app, you might poll this or use realtime subscriptions here
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRead = async (id: string) => {
        await markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const getNotificationContent = (notif: any) => {
        switch (notif.type) {
            case 'follow':
                return (
                    <Link to={`/profile/${notif.actor_id}`} onClick={() => handleRead(notif.id)} className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-full bg-volt-100 text-volt-600 flex items-center justify-center shrink-0">
                            <i className="fas fa-user-plus"></i>
                        </div>
                        <div className="flex-1 text-sm text-left">
                            <span className="font-bold text-coffee-900">{notif.actor?.username || 'Someone'}</span> started following you.
                        </div>
                    </Link>
                );
            case 'like':
                return (
                    <div onClick={() => handleRead(notif.id)} className="flex items-center gap-3 w-full cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0">
                            <i className="fas fa-heart"></i>
                        </div>
                        <div className="flex-1 text-sm text-left">
                            <span className="font-bold text-coffee-900">{notif.actor?.username || 'Someone'}</span> liked your Experience Log.
                        </div>
                    </div>
                );
            case 'badge':
                return (
                    <div onClick={() => handleRead(notif.id)} className="flex items-center gap-3 w-full cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-500 flex items-center justify-center shrink-0">
                            <i className="fas fa-mug-hot"></i>
                        </div>
                        <div className="flex-1 text-sm text-left">
                            You earned a new <span className="font-bold text-coffee-900">Leaderboard Badge</span>!
                        </div>
                    </div>
                );
            default:
                return (
                    <div onClick={() => handleRead(notif.id)} className="text-sm">You have a new notification.</div>
                );
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-coffee-800 hover:bg-coffee-50 transition-colors relative"
            >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-volt-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-coffee-100 overflow-hidden z-50">
                    <div className="p-4 border-b border-coffee-100 flex justify-between items-center bg-coffee-50">
                        <h3 className="font-bold text-coffee-900 font-serif">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-volt-400 text-white px-2 py-0.5 rounded-full">
                                {unreadCount} NEW
                            </span>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-sm text-coffee-500">
                                You're all up to date!
                            </div>
                        ) : (
                            <div className="divide-y divide-coffee-50">
                                {notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 transition-colors hover:bg-coffee-50 ${!notif.is_read ? 'bg-volt-50/30' : ''}`}
                                    >
                                        {getNotificationContent(notif)}
                                        <div className="text-[10px] text-coffee-400 mt-2 ml-11">
                                            {new Date(notif.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
