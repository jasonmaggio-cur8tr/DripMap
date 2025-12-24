
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent } from '../types';
import EventCard from '../components/EventCard';
import { useToast } from '../context/ToastContext';

const AdminEvents: React.FC = () => {
  const { events, shops, deleteEvent, updateEvent } = useApp();
  const { toast } = useToast();
  const [filterShop, setFilterShop] = useState('All');

  const filteredEvents = filterShop === 'All' 
    ? events 
    : events.filter(e => e.shopId === filterShop);

  const handleDelete = (id: string) => {
      if (confirm('Delete this event?')) {
          deleteEvent(id);
          toast.success('Event deleted');
      }
  };

  const togglePublish = (event: CalendarEvent) => {
      updateEvent({ ...event, isPublished: !event.isPublished });
      toast.success(event.isPublished ? 'Event unpublished' : 'Event published');
  };

  return (
    <div className="min-h-screen bg-coffee-50 pt-20 px-4 pb-20">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-serif font-bold text-coffee-900">Admin Event Manager</h1>
            
            <select 
                className="p-2 border border-coffee-200 rounded-lg"
                value={filterShop}
                onChange={e => setFilterShop(e.target.value)}
            >
                <option value="All">All Shops</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-coffee-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-coffee-50 border-b border-coffee-200">
                    <tr>
                        <th className="p-4 text-xs font-bold text-coffee-500 uppercase">Event</th>
                        <th className="p-4 text-xs font-bold text-coffee-500 uppercase">Shop</th>
                        <th className="p-4 text-xs font-bold text-coffee-500 uppercase">Date</th>
                        <th className="p-4 text-xs font-bold text-coffee-500 uppercase">Status</th>
                        <th className="p-4 text-xs font-bold text-coffee-500 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-coffee-100">
                    {filteredEvents.map(event => {
                        const shop = shops.find(s => s.id === event.shopId);
                        return (
                            <tr key={event.id} className="hover:bg-coffee-50 transition-colors">
                                <td className="p-4">
                                    <p className="font-bold text-coffee-900">{event.title}</p>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{event.eventType}</span>
                                </td>
                                <td className="p-4 text-sm text-coffee-600">
                                    {shop?.name || 'Unknown'}
                                </td>
                                <td className="p-4 text-sm text-coffee-600">
                                    {new Date(event.startDateTime).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => togglePublish(event)}
                                        className={`text-xs font-bold px-2 py-1 rounded border ${
                                            event.isPublished 
                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        }`}
                                    >
                                        {event.isPublished ? 'Published' : 'Draft'}
                                    </button>
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(event.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {filteredEvents.length === 0 && (
                <div className="p-8 text-center text-coffee-400">No events found.</div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
