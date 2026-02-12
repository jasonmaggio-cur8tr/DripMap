import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';
import { useToast } from '../../context/ToastContext';
import EventCreateModal from '../../components/EventCreateModal';

// Parse datetime without timezone conversion
const parseLocalDateTime = (dateTimeStr: string) => {
    const [datePart, timePart] = dateTimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
};

const AdminEvents: React.FC = () => {
    const { events, shops, deleteEvent, updateEvent } = useApp();
    const { toast } = useToast();
    const [filterShop, setFilterShop] = useState('All');
    const [showCreateModal, setShowCreateModal] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedShopId, setSelectedShopId] = useState('');
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

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

    const openCreateModal = () => {
        if (shops.length > 0) {
            setSelectedShopId(filterShop === 'All' ? shops[0].id : filterShop);
            setShowCreateModal(true);
        } else {
            toast.error('No shops available');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-coffee-900">Manage Events</h2>

                <div className="flex items-center gap-3">
                    <select
                        className="p-2 border border-coffee-200 rounded-lg text-sm"
                        value={filterShop}
                        onChange={e => setFilterShop(e.target.value)}
                    >
                        <option value="All">All Shops</option>
                        {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-volt-400 text-coffee-900 font-bold rounded-lg hover:bg-volt-500 transition-colors flex items-center gap-2 text-sm"
                    >
                        <i className="fas fa-plus"></i> Create Event
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-coffee-200 overflow-hidden">
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
                                        <p className="font-bold text-coffee-900 text-sm">{event.title}</p>
                                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{event.eventType}</span>
                                    </td>
                                    <td className="p-4 text-sm text-coffee-600">
                                        {shop?.name || 'Unknown'}
                                    </td>
                                    <td className="p-4 text-sm text-coffee-600">
                                        {parseLocalDateTime(event.startDateTime).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => togglePublish(event)}
                                            className={`text-xs font-bold px-2 py-1 rounded border ${event.isPublished
                                                    ? 'bg-green-100 text-green-700 border-green-200'
                                                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                }`}
                                        >
                                            {event.isPublished ? 'Published' : 'Draft'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setEditingEvent(event)}
                                                className="text-blue-500 hover:bg-blue-50 p-2 rounded transition-colors"
                                                title="Edit event"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                                title="Delete event"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredEvents.length === 0 && (
                    <div className="p-12 text-center text-coffee-400">
                        <i className="fas fa-calendar-times text-4xl mb-3 opacity-50"></i>
                        <p>No events found matching your filter.</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Event Modal */}
            {(showCreateModal || editingEvent) && (
                <EventCreateModal
                    shopId={editingEvent?.shopId || selectedShopId}
                    event={editingEvent || undefined}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingEvent(null);
                    }}
                    onSuccess={() => {
                        toast.success(editingEvent ? 'Event updated!' : 'Event created!');
                        setEditingEvent(null);
                        setShowCreateModal(false);
                        // Force refresh handled by context mostly, but UI should update
                    }}
                />
            )}
        </div>
    );
};

export default AdminEvents;
