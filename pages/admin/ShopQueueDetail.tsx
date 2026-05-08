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
    const ok = await approveDraft(draft.id, user.id);
    if (ok) {
      toast.success('Approved — holding for email');
      await loadDraft();
    } else {
      toast.error('Failed to approve');
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
          {/* Photos */}
          <div className="bg-white rounded-xl border border-coffee-100 p-6">
            <h3 className="text-xs font-bold text-coffee-500 uppercase tracking-wider mb-3">Photos ({draft.photos.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {draft.photos.sort((a, b) => a.position - b.position).map((photo) => (
                <div key={photo.id} className="relative group">
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
                </div>
              ))}
            </div>
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
              <button
                onClick={handleApproveAndPublish}
                disabled={publishing || dirty}
                className="w-full bg-volt-400 text-coffee-900 py-3 rounded-lg font-bold hover:bg-volt-300 transition-colors disabled:opacity-50"
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
                  disabled={dirty}
                  className="w-full bg-blue-50 text-blue-700 py-3 rounded-lg font-bold hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50"
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
