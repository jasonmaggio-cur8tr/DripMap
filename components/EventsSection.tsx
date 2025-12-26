import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import EventCreateModal from './EventCreateModal';
import { LockedOverlay } from './OwnerTools';

interface EventsSectionProps {
  shopId: string;
  isPro: boolean;
  onUpgrade?: () => void;
}

const EventsSection: React.FC<EventsSectionProps> = ({ shopId, isPro, onUpgrade }) => {
  const { events } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const shopEvents = events.filter(e => e.shopId === shopId);
  const upcomingEvents = shopEvents.filter(e => new Date(e.startDateTime) >= new Date());

  return (
    <div className="relative bg-white rounded-3xl shadow-sm border border-coffee-100 overflow-hidden">
      {!isPro && <LockedOverlay label="Events - PRO Feature" onUpgrade={onUpgrade} />}

      <div className="bg-coffee-900 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-volt-400 flex items-center gap-2">
            <i className="fas fa-calendar-alt"></i> Events
          </h2>
          <p className="text-coffee-200 text-sm mt-1">
            Promote workshops, tastings & community events
          </p>
        </div>
        {isPro && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-volt-400 text-coffee-900 font-bold rounded-lg hover:bg-volt-500 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> Create Event
          </button>
        )}
      </div>

      <div className="p-6">
        {shopEvents.length === 0 ? (
          <div className="text-center py-12 text-coffee-400">
            <i className="fas fa-calendar-times text-4xl mb-3 opacity-50"></i>
            <p className="font-medium">No events yet</p>
            <p className="text-sm mt-1">Create your first event to engage your community</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-coffee-900">Upcoming Events ({upcomingEvents.length})</h3>
              <a
                href="/admin/events"
                className="text-sm text-volt-500 hover:underline font-medium"
              >
                Manage All →
              </a>
            </div>

            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-coffee-400">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className="p-4 border border-coffee-100 rounded-xl hover:border-volt-400 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-coffee-900">{event.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded font-bold ${
                        event.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {event.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-coffee-600">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-calendar text-xs"></i>
                        {new Date(event.startDateTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-clock text-xs"></i>
                        {new Date(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="px-2 py-0.5 bg-coffee-50 rounded text-xs font-medium">
                        {event.eventType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && isPro && (
        <EventCreateModal
          shopId={shopId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
          disableShopSelection={true}
        />
      )}
    </div>
  );
};

export default EventsSection;
