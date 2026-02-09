
import React from 'react';
import { CalendarEvent, Shop } from '../types';
import { Link } from 'react-router-dom';
import AddToCalendar from './AddToCalendar';
import LazyImage from './LazyImage';

interface EventCardProps {
  event: CalendarEvent;
  shop?: Shop;
  compact?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, shop, compact = false }) => {
  // Parse datetime without timezone conversion
  // datetime-local gives "YYYY-MM-DDTHH:MM" format - parse as local time
  const parseLocalDateTime = (dateTimeStr: string) => {
    const [datePart, timePart] = dateTimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  const startDate = parseLocalDateTime(event.startDateTime);

  // Format Date: "Mon, Oct 14"
  const dateStr = startDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Format Time: "10:00 AM"
  const timeStr = startDate.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });

  const typeColors: Record<string, string> = {
    'Tasting': 'bg-orange-100 text-orange-800',
    'Music': 'bg-purple-100 text-purple-800',
    'Workshop': 'bg-blue-100 text-blue-800',
    'Pop-up': 'bg-volt-400 text-coffee-900',
    'Community': 'bg-green-100 text-green-800',
    'Active': 'bg-rose-100 text-rose-800',
    'Other': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className={`bg-white rounded-2xl border border-coffee-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full ${compact ? 'text-sm' : ''}`}>
      
      {/* Image Header (if exists) */}
      {event.coverImage && (
        <div className="relative w-full aspect-[2/1] overflow-hidden">
          <LazyImage src={event.coverImage.url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute top-2 right-2">
             <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full shadow-sm ${typeColors[event.eventType] || typeColors['Other']}`}>
               {event.eventType}
             </span>
          </div>
        </div>
      )}

      <div className="p-4 flex-1 flex flex-col">
        {/* Date Badge (if no image, show prominent date) */}
        {!event.coverImage && (
           <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                 <div className="text-center bg-coffee-50 border border-coffee-100 rounded-lg p-1.5 min-w-[50px]">
                    <span className="block text-[10px] uppercase text-red-500 font-bold">{startDate.toLocaleDateString(undefined, {month:'short'})}</span>
                    <span className="block text-lg font-black text-coffee-900 leading-none">{startDate.getDate()}</span>
                 </div>
                 <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">{startDate.toLocaleDateString(undefined, {weekday: 'long'})}</p>
                    <p className="text-sm font-bold text-coffee-900">{timeStr}</p>
                 </div>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border border-gray-100 ${typeColors[event.eventType] || typeColors['Other']}`}>
                 {event.eventType}
              </span>
           </div>
        )}

        {/* Content */}
        <div className="mb-3">
            {event.coverImage && (
                <p className="text-xs font-bold text-volt-500 mb-1 uppercase tracking-wide">
                    {dateStr} &bull; {timeStr}
                </p>
            )}
            <h3 className="font-serif font-bold text-lg text-coffee-900 leading-tight mb-1">
                {event.title}
            </h3>
            {shop && (
                <Link to={`/shop/${shop.id}`} className="text-xs font-medium text-coffee-500 hover:text-coffee-900 hover:underline flex items-center gap-1">
                    <i className="fas fa-map-marker-alt"></i> {shop.name}
                </Link>
            )}
            {event.locationName && !shop && (
                 <p className="text-xs text-coffee-500"><i className="fas fa-map-pin"></i> {event.locationName}</p>
            )}
        </div>

        <p className="text-sm text-coffee-600 line-clamp-2 mb-4 flex-1">
            {event.description}
        </p>

        {/* Actions */}
        <div className="mt-auto space-y-2">
            {event.ticketUrl && (
                <a 
                    href={event.ticketUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block w-full text-center bg-coffee-900 text-volt-400 text-xs font-bold py-2 rounded-lg hover:bg-black transition-colors"
                >
                    Get Tickets
                </a>
            )}
            <AddToCalendar event={event} shop={shop} />
        </div>
      </div>
    </div>
  );
};

export default EventCard;
