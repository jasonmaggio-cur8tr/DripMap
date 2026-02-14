import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import EventCreateModal from './EventCreateModal';
import { LockedOverlay } from './OwnerTools';

// Parse datetime without timezone conversion
const parseLocalDateTime = (dateTimeStr: string) => {
  const [datePart, timePart] = dateTimeStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
};

interface EventsSectionProps {
  shopId: string;
  isPro: boolean;
  onUpgrade?: () => void;
}

const EventsSection: React.FC<EventsSectionProps> = ({ shopId, isPro, onUpgrade }) => {
  const { events, user, shops } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const currentShop = shops.find(s => s.id === shopId);
  const isOwner = currentShop?.claimedBy === user?.id;
  const isAdmin = user?.isAdmin;
  const isPrivileged = isOwner || isAdmin;

  // Filter events: 
  // 1. By Shop
  // 2. By Date (Upcoming)
  // 3. By Status (Approved OR Privileged OR Created by current user)
  const shopEvents = events.filter(e => e.shopId === shopId);
  const visibleEvents = shopEvents.filter(e => {
    // Show if approved
    if (e.status === 'approved' || e.isPublished) return true;
    // Show if privileged (admin/owner)
    if (isPrivileged) return true;
    // Show if created by current user
    if (user && e.createdByUserId === user.id) return true;

    return false;
  });

  const upcomingEvents = visibleEvents.filter(e => parseLocalDateTime(e.startDateTime) >= new Date());

  const handleCreateClick = () => {
    if (!user) {
      toast.error("Please login to create an event");
      // in a real app, trigger login modal
      return;
    }
    setShowCreateModal(true);
  };

  return (
    <div className="relative bg-white rounded-3xl shadow-sm border border-coffee-100 overflow-hidden">
      {/* Removed LockedOverlay to allow public events */}

      <div className="bg-coffee-900 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-volt-400 flex items-center gap-2">
            <i className="fas fa-calendar-alt"></i> Events
          </h2>
          <p className="text-coffee-200 text-sm mt-1">
            Community workshops, tastings & meetups
          </p>
        </div>

        <button
          onClick={handleCreateClick}
          className="px-4 py-2 bg-volt-400 text-coffee-900 font-bold rounded-lg hover:bg-volt-500 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus"></i> {isPrivileged ? 'Create Event' : 'Suggest Event'}
        </button>
      </div>

      <div className="p-6">
        {visibleEvents.length === 0 ? (
          <div className="text-center py-12 text-coffee-400">
            <i className="fas fa-calendar-times text-4xl mb-3 opacity-50"></i>
            <p className="font-medium">No events yet</p>
            <p className="text-sm mt-1">Be the first to create an event here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-coffee-900">Upcoming Events ({upcomingEvents.length})</h3>
              {isPrivileged && (
                <a
                  href="/admin/events"
                  className="text-sm text-volt-500 hover:underline font-medium"
                >
                  Manage All →
                </a>
              )}
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
                      <div className="flex gap-2">
                        {/* Status Badge */}
                        {(isPrivileged || event.createdByUserId === user?.id) && (
                          <span className={`text-xs px-2 py-1 rounded font-bold ${event.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : event.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {event.status === 'approved' ? 'Active' : event.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-coffee-600">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-calendar text-xs"></i>
                        {parseLocalDateTime(event.startDateTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-clock text-xs"></i>
                        {parseLocalDateTime(event.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      {showCreateModal && (
        <EventCreateModal
          shopId={shopId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            // Optionally refresh events here if needed, but AppContext usually updates state
          }}
          disableShopSelection={true}
        />
      )}
    </div>
  );
};

export default EventsSection;
