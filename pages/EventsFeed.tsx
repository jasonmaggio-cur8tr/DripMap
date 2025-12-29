
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import EventCard from '../components/EventCard';
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
  const { events, shops } = useApp();
  const [filterType, setFilterType] = useState<EventType | 'All'>('All');
  const [search, setSearch] = useState('');

  // Sorting and Filtering Logic
  const processedEvents = useMemo(() => {
    const now = new Date();
    // Only future or today's events, sorted by date
    let filtered = events
        .filter(e => e.isPublished)
        .filter(e => parseLocalDateTime(e.startDateTime) >= new Date(now.setHours(0,0,0,0)))
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

  return (
    <div className="min-h-screen bg-coffee-50 pt-20 pb-20">
      
      {/* Sticky Filter Header */}
      <div className="sticky top-16 z-30 bg-coffee-50/95 backdrop-blur-md border-b border-coffee-200 py-4 px-4 shadow-sm">
         <div className="container mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
             <h1 className="text-2xl font-serif font-black text-coffee-900 hidden md:block">Community Events</h1>
             
             {/* Search */}
             <div className="relative w-full md:w-64">
                 <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                 <input 
                    type="text" 
                    placeholder="Search events or shops..." 
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-coffee-200 bg-white focus:outline-none focus:border-volt-400"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                 />
             </div>

             {/* Type Filter */}
             <div className="flex gap-2 overflow-x-auto w-full md:w-auto no-scrollbar pb-1">
                 {['All', ...Object.values(EventType)].map(type => (
                     <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                            filterType === type 
                            ? 'bg-coffee-900 text-volt-400 border-coffee-900'
                            : 'bg-white text-coffee-600 border-coffee-200 hover:border-coffee-900'
                        }`}
                     >
                         {type}
                     </button>
                 ))}
             </div>
         </div>
      </div>

      <div className="container mx-auto px-4 mt-8 max-w-6xl">
          
          {/* Today Section */}
          {sections.today.length > 0 && (
              <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <h2 className="text-xl font-bold uppercase tracking-widest text-coffee-900">Happening Today</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {sections.today.map(e => (
                          <EventCard key={e.id} event={e} shop={shops.find(s => s.id === e.shopId)} />
                      ))}
                  </div>
              </div>
          )}

          {/* Upcoming Section */}
          <div>
              <h2 className="text-xl font-bold uppercase tracking-widest text-coffee-900 mb-6">Upcoming</h2>
              {sections.upcoming.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {sections.upcoming.map(e => (
                          <EventCard key={e.id} event={e} shop={shops.find(s => s.id === e.shopId)} />
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-coffee-200">
                      <div className="w-16 h-16 bg-coffee-50 rounded-full flex items-center justify-center mx-auto mb-4 text-coffee-300 text-2xl">
                          <i className="fas fa-calendar-times"></i>
                      </div>
                      <p className="text-coffee-500 font-medium">No upcoming events matching your filters.</p>
                      <button onClick={() => {setFilterType('All'); setSearch('')}} className="mt-4 text-volt-500 font-bold hover:underline">Clear Filters</button>
                  </div>
              )}
          </div>

          {/* Call to Action */}
          <div className="mt-16 bg-coffee-900 rounded-3xl p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-volt-400 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
                <h3 className="text-2xl font-serif font-bold mb-2">Hosting an Event?</h3>
                <p className="text-coffee-200 mb-6 max-w-lg mx-auto">Shop owners can list tastings, workshops, and community gatherings on DripMap.</p>
                <Link to="/auth" className="inline-block bg-volt-400 text-coffee-900 font-bold px-6 py-3 rounded-xl hover:bg-white transition-colors">
                    Claim Your Shop
                </Link>
          </div>

      </div>
    </div>
  );
};

export default EventsFeed;
