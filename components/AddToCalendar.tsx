
import React from 'react';
import { CalendarEvent, Shop } from '../types';

interface AddToCalendarProps {
  event: CalendarEvent;
  shop?: Shop;
  className?: string;
}

const AddToCalendar: React.FC<AddToCalendarProps> = ({ event, shop, className = '' }) => {
  
  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  };

  const googleStart = formatGoogleDate(event.startDateTime);
  const googleEnd = event.endDateTime 
    ? formatGoogleDate(event.endDateTime) 
    : formatGoogleDate(new Date(new Date(event.startDateTime).getTime() + 60 * 60 * 1000).toISOString()); // Default 1 hour

  const location = event.addressOverride || (shop ? `${shop.name}, ${shop.location.address}, ${shop.location.city}` : 'Coffee Shop');
  const details = event.description || `Event at ${shop?.name || 'local coffee shop'}. Found on DripMap.`;

  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${googleStart}/${googleEnd}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;

  const downloadIcs = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DripMap//Events//EN
BEGIN:VEVENT
UID:${event.id}@dripmap.com
DTSTAMP:${formatGoogleDate(new Date().toISOString())}
DTSTART:${googleStart}
DTEND:${googleEnd}
SUMMARY:${event.title}
DESCRIPTION:${details.replace(/\n/g, '\\n')}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.title.replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <a 
        href={googleUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex-1 bg-white border border-coffee-200 hover:border-coffee-900 text-coffee-900 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <i className="fab fa-google"></i> Google Cal
      </a>
      <button 
        onClick={downloadIcs}
        className="flex-1 bg-white border border-coffee-200 hover:border-coffee-900 text-coffee-900 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <i className="fas fa-file-download"></i> .ICS
      </button>
    </div>
  );
};

export default AddToCalendar;
