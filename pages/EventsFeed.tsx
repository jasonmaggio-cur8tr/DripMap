
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import EventCard from '../components/EventCard';
import EventCreateModal from '../components/EventCreateModal';
import MenuDrawer from '../components/darkroast/MenuDrawer';
import BottomTabBar from '../components/darkroast/BottomTabBar';
import NotificationBell from '../components/NotificationBell';
import { EventType } from '../types';
import { Link } from 'react-router-dom';

// Parse datetime without timezone conversion
const parseLocalDateTime = (dateTimeStr: string) => {
    const [datePart, timePart] = dateTimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
};

const EventsFeed: React.FC = () => {
    const { events, shops, user, shopsLoading } = useApp();
    const { toast } = useToast();
    const [filterType, setFilterType] = useState<EventType | 'All'>('All');
    const [search, setSearch] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Sorting and Filtering Logic
    const processedEvents = useMemo(() => {
        const now = new Date();
        // Only future or today's events, sorted by date
        let filtered = events
            .filter(e => e.isPublished)
            .filter(e => parseLocalDateTime(e.startDateTime) >= new Date(now.setHours(0, 0, 0, 0)))
            .sort((a, b) => parseLocalDateTime(a.startDateTime).getTime() - parseLocalDateTime(b.startDateTime).getTime());

        if (filterType !== 'All') {
            filtered = filtered.filter(e => e.eventType === filterType);
        }

        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(q) ||
                shops.find(s => s.id === e.shopId)?.name.toLowerCase().includes(q)
            );
        }

        return filtered;
    }, [events, filterType, search, shops]);

    // Group by Date sections
    const sections = useMemo(() => {
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

        const isSameDay = (d1: Date, d2: Date) =>
            d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();

        const grouped = {
            today: [] as typeof processedEvents,
            upcoming: [] as typeof processedEvents
        };

        processedEvents.forEach(e => {
            const eDate = parseLocalDateTime(e.startDateTime);
            if (isSameDay(eDate, today)) {
                grouped.today.push(e);
            } else {
                grouped.upcoming.push(e);
            }
        });

        return grouped;
    }, [processedEvents]);

    const chipStyle = (active: boolean): React.CSSProperties =>
        active
            ? { background: '#a3e635', color: '#231b15' }
            : { background: '#2b221b', color: '#e4ddce', border: '1px solid rgba(255,255,255,0.09)' };

    return (
        <div className="min-h-screen" style={{ background: '#1e1712' }}>

            {/* Sticky glass header */}
            <header
                className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
                style={{ background: 'rgba(23,18,14,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            >
                <div className="mx-auto max-w-6xl px-5 pb-3 pt-2">
                    <div className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setDrawerOpen(true)}
                                aria-label="Open menu"
                                className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
                                style={{ background: '#2b221b' }}
                            >
                                <i className="fas fa-bars" style={{ color: '#f3efe0' }}></i>
                            </button>
                            <h1 className="font-serif text-[19px] font-black" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
                                Events
                            </h1>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                                aria-label="Search events"
                                className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
                                style={{ background: '#2b221b' }}
                            >
                                <i className={`fas ${isSearchExpanded ? 'fa-times' : 'fa-search'} text-sm`} style={{ color: '#f3efe0' }}></i>
                            </button>
                            {user && <NotificationBell />}
                            <button
                                onClick={() => {
                                    if (!user) {
                                        toast.error("Please login to suggest an event");
                                        return;
                                    }
                                    setShowCreateModal(true);
                                }}
                                className="flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-volt-400"
                                style={{ background: '#a3e635', color: '#231b15' }}
                            >
                                <i className="fas fa-plus"></i> Suggest Event
                            </button>
                        </div>
                    </div>

                    {/* Search input (toggled) */}
                    {isSearchExpanded && (
                        <div className="relative py-1.5">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(243,239,224,0.45)' }}></i>
                            <input
                                type="text"
                                placeholder="Search events or shops..."
                                className="w-full rounded-xl border-none py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400"
                                style={{ background: '#2b221b', color: '#f3efe0' }}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Type Filter */}
                    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pt-1.5">
                        {['All', ...Object.values(EventType)].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type as any)}
                                className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
                                style={chipStyle(filterType === type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-6xl px-4 pb-[110px] pt-[130px]">

                {/* Today Section */}
                {sections.today.length > 0 && (
                    <div className="mb-12">
                        <div className="mb-6 flex items-center gap-2">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>Happening Today</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {sections.today.map(e => (
                                <EventCard key={e.id} event={e} shop={shops.find(s => s.id === e.shopId)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Section */}
                <div>
                    <h2 className="mb-6 text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>Upcoming</h2>
                    {sections.upcoming.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {sections.upcoming.map(e => (
                                <EventCard key={e.id} event={e} shop={shops.find(s => s.id === e.shopId)} />
                            ))}
                        </div>
                    ) : shopsLoading ? (
                        <div className="py-20 text-center">
                            <i className="fas fa-spinner fa-spin text-2xl" style={{ color: 'rgba(243,239,224,0.45)' }}></i>
                        </div>
                    ) : (
                        <div
                            className="rounded-3xl border border-white/[0.06] py-20 text-center"
                            style={{ background: '#2b221b' }}
                        >
                            <div
                                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl"
                                style={{ background: '#2f251d', color: 'rgba(243,239,224,0.35)' }}
                            >
                                <i className="fas fa-calendar-times"></i>
                            </div>
                            <p className="font-medium" style={{ color: '#e4ddce' }}>No upcoming events matching your filters.</p>
                            <button
                                onClick={() => { setFilterType('All'); setSearch('') }}
                                className="mt-4 rounded-lg font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-volt-400"
                                style={{ color: '#a3e635' }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* Call to Action */}
                <div
                    className="relative mt-16 overflow-hidden rounded-3xl border border-white/[0.06] p-8 text-center"
                    style={{ background: '#2b221b' }}
                >
                    <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-volt-400 opacity-10 blur-[100px]"></div>
                    <h3 className="mb-2 font-serif text-2xl font-black" style={{ color: '#f3efe0' }}>Hosting an Event?</h3>
                    <p className="mx-auto mb-6 max-w-lg" style={{ color: 'rgba(243,239,224,0.55)' }}>
                        Shop owners can list tastings, workshops, and community gatherings on DripMap.
                    </p>
                    <Link
                        to="/auth"
                        className="inline-block rounded-full px-6 py-3 font-extrabold transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
                        style={{ background: '#a3e635', color: '#231b15' }}
                    >
                        Claim Your Shop
                    </Link>
                </div>

            </div>

            {/* Suggest Event Modal */}
            {showCreateModal && (
                <EventCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => setShowCreateModal(false)}
                />
            )}

            <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <BottomTabBar />
        </div>
    );
};

export default EventsFeed;
