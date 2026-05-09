import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShopDraft,
  ShopDraftData,
  ShopDraftAuditEntry,
} from '../../types';
import {
  fetchDraftById,
  fetchDraftAuditLog,
  updateDraft,
  publishDraft,
  approveDraft,
  rejectDraft,
  requestMoreInfo,
  markDmSent,
  triggerLateOutreachEmail,
  uploadDraftPhotoFile,
  addDraftPhoto,
  deleteDraftPhoto,
  patchDraftPhoto,
  reorderDraftPhotos,
} from '../../services/shopDraftService';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';

const STATUS_COLORS: Record<string, string> = {
  pending_review: 'bg-volt-100 text-coffee-800',
  needs_more_info: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const ShopQueueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useApp();
  const { toast } = useToast();

  const [draft, setDraft] = useState<ShopDraft | null>(null);
  const [auditLog, setAuditLog] = useState<ShopDraftAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showNeedsInfoModal, setShowNeedsInfoModal] = useState(false);
  const [modalNotes, setModalNotes] = useState('');

  // Editable form state
  const [formData, setFormData] = useState<ShopDraftData | null>(null);
  const [email, setEmail] = useState('');
  const [emailSource, setEmailSource] = useState('');
  const [dmTemplate, setDmTemplate] = useState('');
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [pasteUrl, setPasteUrl] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);
  const [dragOverPhotos, setDragOverPhotos] = useState(false);
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadDraft();
  }, [id]);

  const loadDraft = async () => {
    if (!id) return;
    setLoading(true);
    const [d, log] = await Promise.all([
      fetchDraftById(id),
      fetchDraftAuditLog(id),
    ]);
    if (d) {
      setDraft(d);
      setFormData({ ...d.shopData });
      setEmail(d.email || '');
      setEmailSource(d.emailSource || '');
      setDmTemplate(d.dmTemplate || '');
    }
    setAuditLog(log);
    setLoading(false);
  };

  const handleFieldChange = (field: keyof ShopDraftData, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!draft || !formData || !user) return;
    setSaving(true);
    const ok = await updateDraft(draft.id, {
      shopData: formData,
      email: email || null,
      emailSource: emailSource || null,
      dmTemplate: dmTemplate || null,
    }, `admin:${user.id}`);
    setSaving(false);
    if (ok) {
      toast.success('Draft saved');
      setDirty(false);
      await loadDraft();
    } else {
      toast.error('Failed to save');
    }
  };

  const handleApproveAndPublish = async () => {
    if (!draft || !user) return;
    if (dirty) {
      toast.error('Save your changes first');
      return;
    }
    setPublishing(true);
    const result = await publishDraft(draft.id, user.id);
    setPublishing(false);
    if (result.success) {
      toast.success(`Published! Shop ID: ${result.shopId}`);
      await loadDraft();
    } else {
      toast.error(result.error || 'Publish failed');
    }
  };

  const handleApproveHoldForEmail = async () => {
    if (!draft || !user) return;
    if (dirty) {
      toast.error('Save your changes first');
      return;
    }
    const result = await approveDraft(draft.id, user.id);
    if (result.success) {
      toast.success('Approved — holding for email');
      await loadDraft();
    } else {
      toast.error(result.error || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!draft || !user) return;
    const ok = await rejectDraft(draft.id, modalNotes, user.id);
    setShowRejectModal(false);
    setModalNotes('');
    if (ok) {
      toast.success('Draft rejected');
      await loadDraft();
    } else {
      toast.error('Failed to reject');
    }
  };

  const handleNeedsMoreInfo = async () => {
    if (!draft || !user) return;
    const ok = await requestMoreInfo(draft.id, modalNotes, user.id);
    setShowNeedsInfoModal(false);
    setModalNotes('');
    if (ok) {
      toast.success('Marked as needs more info');
      await loadDraft();
    } else {
      toast.error('Failed to update');
    }
  };

  const handleMarkDmSent = async () => {
    if (!draft || !user) return;
    const ok = await markDmSent(draft.id, user.id);
    if (ok) {
      toast.success('DM marked as sent');
      await loadDraft();
    }
  };

  const handleTriggerLateEmail = async () => {
    if (!draft || !user) return;
    const ok = await triggerLateOutreachEmail(draft.id, user.id);
    if (ok) {
      toast.success('Outreach email sent');
      await loadDraft();
    } else {
      toast.error('Failed to send email');
    }
  };

  const handleFileDrop = async (files: FileList | File[]) => {
    if (!draft || !user) return;
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 8 * 1024 * 1024);
    if (fileArr.length === 0) {
      toast.error('No valid image files (must be image, max 8MB)');
      return;
    }

    for (const file of fileArr) {
      const fileKey = `${file.name}-${Date.now()}`;
      setUploading(prev => ({ ...prev, [fileKey]: 0 }));

      const uploadResult = await uploadDraftPhotoFile(file);
      if (uploadResult.error || !uploadResult.url) {
        toast.error(uploadResult.error || 'Upload failed');
        setUploading(prev => { const n = { ...prev }; delete n[fileKey]; return n; });
        continue;
      }

      setUploading(prev => ({ ...prev, [fileKey]: 50 }));

      const addResult = await addDraftPhoto(
        draft.id,
        { url: uploadResult.url, source: 'manual', attribution: 'Added by admin' },
        `admin:${user.id}`
      );

      setUploading(prev => { const n = { ...prev }; delete n[fileKey]; return n; });

      if (addResult.error) {
        toast.error(addResult.error);
      }
    }
    await loadDraft();
  };

  const handlePasteUrl = async () => {
    if (!draft || !user || !pasteUrl.trim()) return;
    setAddingUrl(true);
    const result = await addDraftPhoto(
      draft.id,
      { url: pasteUrl.trim(), source: 'manual' },
      `admin:${user.id}`
    );
    setAddingUrl(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setPasteUrl('');
      await loadDraft();
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!draft || !user) return;
    const result = await deleteDraftPhoto(draft.id, photoId, `admin:${user.id}`);
    if (result.error) {
      toast.error(result.error);
    } else {
      if (result.wasPrimary) toast.success('Primary photo removed — set a new primary');
      await loadDraft();
    }
  };

  const handleSetPrimary = async (photoId: string) => {
    if (!draft || !user) return;
    const result = await patchDraftPhoto(draft.id, photoId, { is_primary: true }, `admin:${user.id}`);
    if (result.error) {
      toast.error(result.error);
    } else {
      await loadDraft();
    }
  };

  const handlePhotoDragStart = (photoId: string) => {
    setDraggedPhotoId(photoId);
  };

  const handlePhotoDrop = async (targetPhotoId: string) => {
    if (!draft || !user || !draggedPhotoId || draggedPhotoId === targetPhotoId) {
      setDraggedPhotoId(null);
      return;
    }
    const sorted = [...draft.photos].sort((a, b) => a.position - b.position);
    const ids = sorted.map(p => p.id);
    const fromIdx = ids.indexOf(draggedPhotoId);
    const toIdx = ids.indexOf(targetPhotoId);
    if (fromIdx === -1 || toIdx === -1) { setDraggedPhotoId(null); return; }
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, draggedPhotoId);
    setDraggedPhotoId(null);

    const result = await reorderDraftPhotos(draft.id, ids, `admin:${user.id}`);
    if (result.error) {
      toast.error(result.error);
    }
    await loadDraft();
  };

  const wordCount = formData?.description
    ? formData.description.trim().split(/\s+/).filter(Boolean).length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <i className="fas fa-spinner fa-spin text-2xl text-coffee-400"></i>
      </div>
    );
  }

  if (!draft || !formData) {
    return (
      <div className="text-center py-24">
        <p className="text-coffee-600">Draft not found.</p>
        <Link to="/admin/shop-queue" className="text-volt-600 hover:underline mt-2 inline-block">
          Back to queue
        </Link>
      </div>
    );
  }

  const canPublish = draft.status === 'pending_review' || draft.status === 'approved' || draft.status === 'needs_more_info';
  const isPublished = draft.status === 'published';
  const hasEnoughPhotos = draft.photos.length >= 3;
  const hasPrimary = draft.photos.some(p => p.isPrimary);
  const photosReady = hasEnoughPhotos && hasPrimary;
  const photoGateReason = !hasEnoughPhotos
    ? `Needs at least 3 photos (has ${draft.photos.length})`
    : !hasPrimary
    ? 'No primary photo selected'
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/shop-queue" className="text-coffee-400 hover:text-coffee-600">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h2 className="text-xl font-bold text-coffee-900">{formData.name}</h2>
          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${STATUS_COLORS[draft.status] || 'bg-gray-100'}`}>
            {draft.status.replace(/_/g, ' ')}
          </span>
        </div>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-coffee-900 text-volt-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors"
          >
            {saving ? <i className="fas fa-spinner fa-spin mr-1"></i> : <i className="fas fa-save mr-1"></i>}
            Save Changes
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Content review (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos panel */}
          <div className="bg-white rounded-xl border border-coffee-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xs font-bold text-coffee-500 uppercase tracking-wider">Photos ({draft.photos.length})</h3>
              {!isPublished && (
                photosReady ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-700">
                    <i className="fas fa-check mr-1"></i>Ready to approve
                  </span>
                ) : !hasEnoughPhotos ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700">
                    <i className="fas fa-camera mr-1"></i>Needs {3 - draft.photos.length} more
                  </span>
                ) : !hasPrimary ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700">
                    No primary set
                  </span>
                ) : null
              )}
            </div>

            {/* Photo grid */}
            {draft.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[...draft.photos].sort((a, b) => a.position - b.position).map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative group ${draggedPhotoId === photo.id ? 'opacity-40' : ''}`}
                    draggable={!isPublished}
                    onDragStart={() => handlePhotoDragStart(photo.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handlePhotoDrop(photo.id)}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className={`w-full aspect-square object-cover rounded-lg ${photo.isPrimary ? 'ring-2 ring-volt-400' : ''}`}
                    />
                    {photo.isPrimary && (
                      <span className="absolute top-1 left-1 bg-volt-400 text-coffee-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        PRIMARY
                      </span>
                    )}
                    {photo.source && (
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                        {photo.source}
                      </span>
                    )}
                    {/* Hover controls */}
                    {!isPublished && (
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!photo.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(photo.id)}
                            className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-coffee-500 hover:text-volt-600 shadow-sm"
                            title="Set as primary"
                          >
                            <i className="fas fa-star text-[10px]"></i>
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-coffee-500 hover:text-red-600 shadow-sm"
                          title="Delete photo"
                        >
                          <i className="fas fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    )}
                    {/* Drag handle */}
                    {!isPublished && (
                      <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                        <i className="fas fa-grip-vertical text-white/80 text-xs drop-shadow"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload progress indicators */}
            {Object.keys(uploading).length > 0 && (
              <div className="space-y-2 mb-4">
                {Object.entries(uploading).map(([key]) => (
                  <div key={key} className="flex items-center gap-2 text-xs text-coffee-500">
                    <i className="fas fa-spinner fa-spin text-volt-600"></i>
                    <span>Uploading...</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add photos controls */}
            {!isPublished && (
              <div className="space-y-3">
                {/* Dropzone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    dragOverPhotos
                      ? 'border-volt-400 bg-volt-50'
                      : 'border-coffee-200 hover:border-coffee-400 bg-sand-50'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverPhotos(true); }}
                  onDragLeave={() => setDragOverPhotos(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverPhotos(false);
                    if (e.dataTransfer.files.length > 0) handleFileDrop(e.dataTransfer.files);
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = 'image/*';
                    input.onchange = () => { if (input.files) handleFileDrop(input.files); };
                    input.click();
                  }}
                >
                  <i className="fas fa-cloud-upload-alt text-2xl text-coffee-300 mb-2"></i>
                  <p className="text-sm text-coffee-500 font-medium">Drop images here or click to browse</p>
                  <p className="text-[11px] text-coffee-400 mt-1">JPEG, PNG, WebP, HEIC — max 8MB each</p>
                </div>

                {/* URL paste */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={pasteUrl}
                    onChange={(e) => setPasteUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePasteUrl(); }}
                    placeholder="Or paste an image URL..."
                    className="flex-1 bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  />
                  <button
                    onClick={handlePasteUrl}
                    disabled={!pasteUrl.trim() || addingUrl}
                    className="px-4 py-2 bg-coffee-900 text-volt-400 rounded-lg font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {addingUrl ? <i className="fas fa-spinner fa-spin"></i> : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Editable form fields */}
          <div className="bg-white rounded-xl border border-coffee-100 p-6 space-y-4">
            <h3 className="text-xs font-bold text-coffee-500 uppercase tracking-wider mb-3">Shop Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Neighborhood</label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => handleFieldChange('neighborhood', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">State</label>
                <input
                  type="text"
                  value={formData.state || ''}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country || ''}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Address</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                disabled={isPublished}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">
                Description
                <span className={`ml-2 font-normal ${wordCount < 100 || wordCount > 150 ? 'text-yellow-600' : 'text-green-600'}`}>
                  ({wordCount} words)
                </span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={5}
                className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500 leading-relaxed"
                disabled={isPublished}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Instagram URL</label>
                <input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => handleFieldChange('instagram_url', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Website URL</label>
                <input
                  type="url"
                  value={formData.website_url || ''}
                  onChange={(e) => handleFieldChange('website_url', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Yelp URL</label>
                <input
                  type="url"
                  value={formData.yelp_url || ''}
                  onChange={(e) => handleFieldChange('yelp_url', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Google Maps URL</label>
                <input
                  type="url"
                  value={formData.google_maps_url || ''}
                  onChange={(e) => handleFieldChange('google_maps_url', e.target.value)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500 max-w-xs"
                disabled={isPublished}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Known For</label>
              <input
                type="text"
                value={(formData.known_for || []).join(', ')}
                onChange={(e) => handleFieldChange('known_for', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="pour-over, single-origin, oat milk lattes"
                className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                disabled={isPublished}
              />
              <p className="text-[11px] text-coffee-400 mt-1">Comma-separated</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Vibe Tags</label>
              <input
                type="text"
                value={(formData.vibe_tags || []).join(', ')}
                onChange={(e) => handleFieldChange('vibe_tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                placeholder="minimalist, plant-filled, industrial"
                className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                disabled={isPublished}
              />
              <p className="text-[11px] text-coffee-400 mt-1">Comma-separated — mapped to vibes on publish</p>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.lat || ''}
                  onChange={(e) => handleFieldChange('lat', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.lng || ''}
                  onChange={(e) => handleFieldChange('lng', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
                  disabled={isPublished}
                />
              </div>
            </div>
            {!formData.lat && !formData.lng && formData.address && (
              <p className="text-xs text-yellow-600">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                No coordinates — will be geocoded from address on publish
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Workflow & outreach (1 col) */}
        <div className="space-y-6">
          {/* Status panel */}
          <div className="bg-white rounded-xl border border-coffee-100 p-6 space-y-4">
            <h3 className="text-xs font-bold text-coffee-500 uppercase tracking-wider">Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-coffee-500">Submitted by</span>
                <span className={`font-medium ${draft.submittedBy.startsWith('agent:') ? 'text-purple-700' : 'text-coffee-800'}`}>
                  {draft.submittedBy}
                </span>
              </div>
              {draft.agentRunId && (
                <div className="flex justify-between">
                  <span className="text-coffee-500">Agent Run</span>
                  <span className="text-coffee-700 font-mono text-xs">{draft.agentRunId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-coffee-500">Created</span>
                <span className="text-coffee-700">{new Date(draft.createdAt).toLocaleString()}</span>
              </div>
              {draft.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-coffee-500">Reviewed</span>
                  <span className="text-coffee-700">{new Date(draft.reviewedAt).toLocaleString()}</span>
                </div>
              )}
              {draft.publishedShopId && (
                <div className="flex justify-between">
                  <span className="text-coffee-500">Live Shop</span>
                  <Link to={`/shop/${formData.slug || draft.publishedShopId}`} className="text-volt-600 hover:underline">
                    View <i className="fas fa-external-link-alt text-[10px]"></i>
                  </Link>
                </div>
              )}
            </div>
            {draft.reviewNotes && (
              <div className="bg-sand-50 p-3 rounded-lg border border-coffee-100 mt-3">
                <p className="text-xs font-bold text-coffee-500 uppercase mb-1">Review Notes</p>
                <p className="text-sm text-coffee-700">{draft.reviewNotes}</p>
              </div>
            )}
          </div>

          {/* Outreach panel */}
          <div className="bg-white rounded-xl border border-coffee-100 p-6 space-y-4">
            <h3 className="text-xs font-bold text-coffee-500 uppercase tracking-wider">Outreach</h3>

            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">
                Email
                {emailSource && (
                  <span className="ml-1 font-normal text-coffee-400">
                    (found on {emailSource})
                  </span>
                )}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setDirty(true); }}
                placeholder="shop@example.com"
                className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500"
              />
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${
                  draft.outreachEmailStatus === 'sent' ? 'text-green-600' :
                  draft.outreachEmailStatus === 'failed' ? 'text-red-600' :
                  draft.outreachEmailStatus === 'queued' ? 'text-blue-600' :
                  'text-coffee-400'
                }`}>
                  Email: {draft.outreachEmailStatus}
                </span>
                {isPublished && email && draft.outreachEmailStatus === 'not_sent' && (
                  <button
                    onClick={handleTriggerLateEmail}
                    className="text-xs text-volt-600 hover:underline"
                  >
                    Send now
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-coffee-500 uppercase mb-1">DM Template</label>
              <textarea
                value={dmTemplate}
                onChange={(e) => { setDmTemplate(e.target.value); setDirty(true); }}
                rows={5}
                className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500 leading-relaxed"
                placeholder="Agent-generated DM..."
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => { navigator.clipboard.writeText(dmTemplate); toast.success('Copied!'); }}
                  className="text-xs bg-coffee-100 text-coffee-700 px-3 py-1.5 rounded-md hover:bg-coffee-200 transition-colors"
                  disabled={!dmTemplate}
                >
                  <i className="fas fa-copy mr-1"></i> Copy DM
                </button>
                {formData.instagram_url && (
                  <a
                    href={formData.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-coffee-100 text-coffee-700 px-3 py-1.5 rounded-md hover:bg-coffee-200 transition-colors"
                  >
                    <i className="fab fa-instagram mr-1"></i> Open IG
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium ${
                  draft.outreachDmStatus === 'sent_manually' ? 'text-green-600' : 'text-coffee-400'
                }`}>
                  DM: {draft.outreachDmStatus.replace('_', ' ')}
                </span>
                {draft.outreachDmStatus === 'not_sent' && (
                  <button
                    onClick={handleMarkDmSent}
                    className="text-xs text-volt-600 hover:underline"
                  >
                    Mark as sent
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {canPublish && (
            <div className="bg-white rounded-xl border border-coffee-100 p-4 space-y-3 sticky bottom-6">
              {photoGateReason && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-700 flex items-start gap-2">
                  <i className="fas fa-camera mt-0.5 text-orange-400"></i>
                  <span>{photoGateReason} — add photos before approving.</span>
                </div>
              )}

              <button
                onClick={handleApproveAndPublish}
                disabled={publishing || dirty || !photosReady}
                title={photoGateReason || undefined}
                className="w-full bg-volt-400 text-coffee-900 py-3 rounded-lg font-bold hover:bg-volt-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {publishing ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Publishing...</>
                ) : (
                  <><i className="fas fa-check mr-2"></i>Approve & Publish</>
                )}
              </button>

              {!email && (
                <button
                  onClick={handleApproveHoldForEmail}
                  disabled={dirty || !photosReady}
                  title={photoGateReason || undefined}
                  className="w-full bg-blue-50 text-blue-700 py-3 rounded-lg font-bold hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fas fa-pause mr-2"></i>Approve, Hold for Email
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="py-2.5 rounded-lg font-bold text-sm border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                >
                  <i className="fas fa-times mr-1"></i> Reject
                </button>
                <button
                  onClick={() => setShowNeedsInfoModal(true)}
                  className="py-2.5 rounded-lg font-bold text-sm border border-yellow-200 text-yellow-700 hover:bg-yellow-50 transition-colors"
                >
                  <i className="fas fa-question-circle mr-1"></i> Needs Info
                </button>
              </div>
            </div>
          )}

          {/* Audit log */}
          {auditLog.length > 0 && (
            <div className="bg-white rounded-xl border border-coffee-100 p-6">
              <h3 className="text-xs font-bold text-coffee-500 uppercase tracking-wider mb-3">Activity Log</h3>
              <div className="space-y-2">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2 text-xs">
                    <span className="text-coffee-400 whitespace-nowrap">
                      {new Date(entry.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <span className="text-coffee-700">
                      <span className="font-medium">{entry.actor}</span> — {entry.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-coffee-900 mb-3">Reject Draft</h3>
            <textarea
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
              className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm text-coffee-600 hover:text-coffee-900">
                Cancel
              </button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Needs more info modal */}
      {showNeedsInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNeedsInfoModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-coffee-900 mb-3">Request More Info</h3>
            <textarea
              value={modalNotes}
              onChange={(e) => setModalNotes(e.target.value)}
              placeholder="What additional information is needed..."
              rows={3}
              className="w-full bg-sand-50 border border-coffee-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-coffee-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowNeedsInfoModal(false)} className="px-4 py-2 text-sm text-coffee-600 hover:text-coffee-900">
                Cancel
              </button>
              <button onClick={handleNeedsMoreInfo} className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold text-sm hover:bg-yellow-600">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopQueueDetail;
