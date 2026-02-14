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
        });

        if (result.success && result.data?.status === 'pending') {
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-coffee-100 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-serif font-bold text-coffee-900">
            {isEditing ? 'Edit Event' : 'Suggest New Event'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-coffee-100 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times text-coffee-600"></i>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Cover Image */}
          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
              Cover Image
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging
                ? 'border-volt-500 bg-volt-50'
                : uploadingImage
                  ? 'border-coffee-300 bg-coffee-50'
                  : 'border-coffee-200 hover:border-volt-400'
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
                  <p className="text-sm text-coffee-600 mb-2">Uploading image...</p>
                </div>
              ) : (
                <div>
                  <i className="fas fa-image text-4xl text-coffee-300 mb-3"></i>
                  <p className="text-sm text-coffee-600 mb-2">Click or Drag Image</p>
                  <p className="text-xs text-coffee-400">Max 5MB (Pro Tip: Use landscape)</p>
                  <input
                    type="text"
                    placeholder="Or paste image URL"
                    className="mt-3 w-full px-3 py-2 border border-coffee-200 rounded-lg text-sm"
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
            <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
              Shop *
            </label>
            {/* Searchable Shop Input */}
            {!isEditing && !disableShopSelection ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for a shop..."
                  className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400 mb-2"
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
              className={`w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400 ${isEditing || disableShopSelection ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
                }`}
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
              <p className="text-xs text-coffee-400 mt-1">
                {isEditing ? 'Shop cannot be changed when editing' : 'Suggesting event for this shop'}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Latte Art Throwdown"
              className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
              Description
            </label>
            <textarea
              placeholder="Event details..."
              rows={4}
              className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
              Event Type
            </label>
            <select
              className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400"
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
              <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400"
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400"
                value={formData.endDateTime}
                onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
              Location (Optional)
            </label>
            <input
              type="text"
              placeholder="Event location if different from shop"
              className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {/* Ticket Link */}
          <div>
            <label className="block text-sm font-bold text-coffee-900 mb-2 uppercase tracking-wide">
              Ticket Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://eventbrite.com/..."
              className="w-full px-4 py-3 border border-coffee-200 rounded-xl focus:outline-none focus:border-volt-400"
              value={formData.ticketLink}
              onChange={(e) => setFormData({ ...formData, ticketLink: e.target.value })}
            />
          </div>

          {/* Publish Toggle - Only for Privileged Users */}
          {isPrivileged && (
            <div className="flex items-center gap-3 p-4 bg-coffee-50 rounded-xl border border-coffee-100">
              <input
                type="checkbox"
                id="publish"
                className="w-5 h-5 text-volt-400 rounded focus:ring-volt-400"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              <label htmlFor="publish" className="text-sm font-bold text-coffee-900">
                Publish event immediately
              </label>
            </div>
          )}

          {!isPrivileged && !isEditing && (
            <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-sm flex gap-3">
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
              className="flex-1 px-6 py-3 border border-coffee-200 text-coffee-600 font-bold rounded-xl hover:bg-coffee-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-volt-400 text-coffee-900 font-bold rounded-xl hover:bg-volt-500 transition-colors disabled:opacity-50"
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
