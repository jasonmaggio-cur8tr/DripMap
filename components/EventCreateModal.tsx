import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { EventType, CalendarEvent } from '../types';
import { useToast } from '../context/ToastContext';
import { uploadImage } from '../services/storageService';

interface EventCreateModalProps {
  shopId?: string; // Optional for global create
  event?: CalendarEvent; // Optional: if provided, we're editing
  onClose: () => void;
  onSuccess?: () => void;
  disableShopSelection?: boolean; // For shop owners - lock to their shop
}

const EventCreateModal: React.FC<EventCreateModalProps> = ({ shopId, event, onClose, onSuccess, disableShopSelection = false }) => {
  const { addEvent, updateEvent, shops, user } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!event;

  const [formData, setFormData] = useState({
    shopId: event?.shopId || shopId || '',
    title: event?.title || '',
    description: event?.description || '',
    eventType: event?.eventType || EventType.TASTING,
    startDateTime: event?.startDateTime ? event.startDateTime.slice(0, 16) : '',
    endDateTime: event?.endDateTime ? event.endDateTime.slice(0, 16) : '',
    location: event?.locationName || '',
    ticketLink: event?.ticketUrl || '',
    coverImageUrl: event?.coverImage?.url || '',
    isPublished: event?.isPublished || false,
  });

  // Determine if user has privileges for this shop
  const currentShop = shops.find(s => s.id === (formData.shopId || shopId));
  const isOwner = currentShop?.claimedBy === user?.id;
  const isAdmin = user?.isAdmin;
  const isPrivileged = isOwner || isAdmin;

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Image too large. Maximum size is 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const result = await uploadImage(file, 'events');
      if (result.success && result.url) {
        setFormData(prev => ({ ...prev, coverImageUrl: result.url }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.startDateTime || !formData.shopId) {
      toast.error('Please fill in required fields (Shop, Title, Date)');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && event) {
        // Update existing event
        await updateEvent({
          ...event,
          shopId: formData.shopId,
          title: formData.title,
          description: formData.description,
          eventType: formData.eventType,
          startDateTime: formData.startDateTime,
          endDateTime: formData.endDateTime || formData.startDateTime,
          locationName: formData.location,
          ticketUrl: formData.ticketLink,
          coverImage: formData.coverImageUrl ? {
            url: formData.coverImageUrl,
            fileName: '',
            mimeType: ''
          } : undefined,
          isPublished: formData.isPublished,
        });
        toast.success('Event updated successfully!');
      } else {
        // Create new event
        const result = await addEvent({
          shopId: formData.shopId,
          title: formData.title,
          description: formData.description,
          eventType: formData.eventType,
          startDateTime: formData.startDateTime,
          endDateTime: formData.endDateTime || formData.startDateTime,
          allDay: false,
          locationName: formData.location,
          ticketUrl: formData.ticketLink,
          coverImage: formData.coverImageUrl ? {
            url: formData.coverImageUrl,
            fileName: '',
            mimeType: ''
          } : undefined,
          isPublished: formData.isPublished,
          status: 'pending' // Added to satisfy Omit<CalendarEvent, "id" | "createdAt">
        });

        // The addEvent function from context currently returns void
        // so we check isPublished instead of result.data.status
        if (!formData.isPublished) {
          toast.success('Event submitted for approval! 🎟️');
        } else {
          toast.success('Event created successfully!');
        }
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast.error(error.message || (isEditing ? 'Failed to update event' : 'Failed to create event'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-3xl border border-white/[0.09] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ background: '#221a14' }}>
        {/* Header */}
        <div className="sticky top-0 border-b border-white/[0.07] p-6 flex justify-between items-center z-10" style={{ background: '#221a14' }}>
          <h2 className="text-2xl font-serif font-black" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
            {isEditing ? 'Edit Event' : 'Suggest New Event'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
            style={{ background: '#2b221b' }}
          >
            <i className="fas fa-times" style={{ color: '#f3efe0' }}></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
              Cover Image
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging
                ? 'border-volt-400 bg-volt-400/10'
                : uploadingImage
                  ? 'border-white/[0.15] bg-[rgba(255,255,255,0.04)]'
                  : 'border-white/[0.15] hover:border-volt-400'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploadingImage && !formData.coverImageUrl && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              {formData.coverImageUrl ? (
                <div className="relative">
                  <img src={formData.coverImageUrl} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setFormData({ ...formData, coverImageUrl: '' });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : uploadingImage ? (
                <div>
                  <i className="fas fa-spinner fa-spin text-4xl text-volt-400 mb-3"></i>
                  <p className="text-sm mb-2" style={{ color: '#e4ddce' }}>Uploading image...</p>
                </div>
              ) : (
                <div>
                  <i className="fas fa-image text-4xl mb-3" style={{ color: 'rgba(243,239,224,0.25)' }}></i>
                  <p className="text-sm mb-2" style={{ color: '#e4ddce' }}>Click or Drag Image</p>
                  <p className="text-xs" style={{ color: 'rgba(243,239,224,0.5)' }}>Max 5MB (Pro Tip: Use landscape)</p>
                  <input
                    type="text"
                    placeholder="Or paste image URL"
                    className="mt-3 w-full px-3 py-2 rounded-lg border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400"
                    style={{ background: '#2f251d', color: '#f3efe0' }}
                    value={formData.coverImageUrl}
                    onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Shop Selection */}
          <div>
            <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
              Shop *
            </label>
            {/* Searchable Shop Input */}
            {!isEditing && !disableShopSelection ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for a shop..."
                  className="w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400 mb-2"
                  style={{ background: '#2f251d', color: '#f3efe0' }}
                  value={formData.shopId ? shops.find(s => s.id === formData.shopId)?.name : ''}
                  onChange={(e) => {
                    setFormData({ ...formData, shopId: '' });
                  }}
                  list="shop-options"
                />
                <datalist id="shop-options">
                  {[...shops].sort((a, b) => a.name.localeCompare(b.name)).map(shop => (
                    <option key={shop.id} value={shop.name} />
                  ))}
                </datalist>
              </div>
            ) : null}

            <select
              required
              className={`w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400 ${isEditing || disableShopSelection ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              style={{ background: '#2f251d', color: '#f3efe0', colorScheme: 'dark' }}
              value={formData.shopId}
              onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
              disabled={isEditing || disableShopSelection}
            >
              <option value="">Select a shop...</option>
              {[...shops]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(shop => (
                  <option key={shop.id} value={shop.id}>{shop.name}</option>
                ))}
            </select>

            {(isEditing || disableShopSelection) && (
              <p className="text-xs mt-1" style={{ color: 'rgba(243,239,224,0.5)' }}>
                {isEditing ? 'Shop cannot be changed when editing' : 'Suggesting event for this shop'}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Latte Art Throwdown"
              className="w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400" style={{ background: '#2f251d', color: '#f3efe0', colorScheme: 'dark' }}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
              Description
            </label>
            <textarea
              placeholder="Event details..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400 resize-none" style={{ background: '#2f251d', color: '#f3efe0', colorScheme: 'dark' }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
              Event Type
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400" style={{ background: '#2f251d', color: '#f3efe0', colorScheme: 'dark' }}
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as EventType })}
            >
              {Object.values(EventType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400" style={{ background: '#2f251d', color: '#f3efe0', colorScheme: 'dark' }}
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
                End Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400" style={{ background: '#2f251d', color: '#f3efe0', colorScheme: 'dark' }}
                value={formData.endDateTime}
                onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
              Location (Optional)
            </label>
            <input
              type="text"
              placeholder="Event location if different from shop"
              className="w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400" style={{ background: '#2f251d', color: '#f3efe0', colorScheme: 'dark' }}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {/* Ticket Link */}
          <div>
            <label className="block text-[10px] font-bold mb-2 uppercase tracking-[0.08em]" style={{ color: 'rgba(243,239,224,0.5)' }}>
              Ticket Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://eventbrite.com/..."
              className="w-full px-4 py-3 rounded-xl border-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400" style={{ background: '#2f251d', color: '#f3efe0', colorScheme: 'dark' }}
              value={formData.ticketLink}
              onChange={(e) => setFormData({ ...formData, ticketLink: e.target.value })}
            />
          </div>

          {/* Publish Toggle - Only for Privileged Users */}
          {isPrivileged && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.09]" style={{ background: '#2b221b' }}>
              <input
                type="checkbox"
                id="publish"
                className="w-5 h-5 rounded focus:outline-none focus:ring-2 focus:ring-volt-400"
                style={{ accentColor: '#a3e635' }}
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              <label htmlFor="publish" className="text-sm font-bold" style={{ color: '#f3efe0' }}>
                Publish event immediately
              </label>
            </div>
          )}

          {!isPrivileged && !isEditing && (
            <div className="p-4 rounded-xl text-sm flex gap-3" style={{ background: 'rgba(96,165,250,0.12)', color: '#93c5fd' }}>
              <i className="fas fa-info-circle mt-0.5"></i>
              <div>
                <p className="font-bold">Pending Review</p>
                <p>Your event will be reviewed by the shop owner or admin before going live.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 font-bold rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
              style={{ background: '#2b221b', color: '#e4ddce', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 font-extrabold rounded-full transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-volt-400"
              style={{ background: '#a3e635', color: '#231b15' }}
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Event' : 'Suggest Event')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventCreateModal;
