import { supabase } from '../lib/supabase';
import { loopService } from './loopService';
import {
  ShopDraft,
  ShopDraftStatus,
  ShopDraftPhoto,
  ShopDraftAuditEntry,
  ShopDraftData,
} from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const APP_URL = import.meta.env.VITE_APP_URL || 'https://dripmap.space';

// ==================== Mapping Helpers ====================

function mapDraftRow(row: any, photos: any[] = []): ShopDraft {
  return {
    id: row.id,
    shopData: row.shop_data,
    status: row.status,
    submittedBy: row.submitted_by,
    agentRunId: row.agent_run_id,
    reviewNotes: row.review_notes,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    email: row.email,
    emailSource: row.email_source,
    dmTemplate: row.dm_template,
    outreachEmailStatus: row.outreach_email_status,
    outreachEmailSentAt: row.outreach_email_sent_at,
    outreachDmStatus: row.outreach_dm_status,
    publishedShopId: row.published_shop_id,
    photos: (photos.length > 0 ? photos : row.shop_draft_photos || []).map(mapPhotoRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPhotoRow(row: any): ShopDraftPhoto {
  return {
    id: row.id,
    shopDraftId: row.shop_draft_id,
    url: row.url,
    source: row.source,
    sourceUrl: row.source_url,
    attribution: row.attribution,
    position: row.position,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
  };
}

function mapAuditRow(row: any): ShopDraftAuditEntry {
  return {
    id: row.id,
    shopDraftId: row.shop_draft_id,
    actor: row.actor,
    action: row.action,
    payload: row.payload,
    createdAt: row.created_at,
  };
}

function validatePhotosForApproval(photos: { isPrimary: boolean }[]): string | null {
  if (photos.length < 3) return `Needs at least 3 photos (has ${photos.length})`;
  const primaryCount = photos.filter(p => p.isPrimary).length;
  if (primaryCount !== 1) return `Exactly 1 primary photo required (found ${primaryCount})`;
  return null;
}

// ==================== Fetching ====================

export async function fetchDrafts(statusFilter?: ShopDraftStatus): Promise<ShopDraft[]> {
  let query = supabase
    .from('shop_drafts')
    .select('*, shop_draft_photos(*)')
    .order('created_at', { ascending: false });

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[ShopDraftService] fetchDrafts error:', error);
    return [];
  }
  return (data || []).map((row: any) => mapDraftRow(row));
}

export async function fetchDraftById(id: string): Promise<ShopDraft | null> {
  const { data, error } = await supabase
    .from('shop_drafts')
    .select('*, shop_draft_photos(*)')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('[ShopDraftService] fetchDraftById error:', error);
    return null;
  }
  return mapDraftRow(data);
}

export async function fetchDraftAuditLog(draftId: string): Promise<ShopDraftAuditEntry[]> {
  const { data, error } = await supabase
    .from('shop_draft_audit_log')
    .select('*')
    .eq('shop_draft_id', draftId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[ShopDraftService] fetchAuditLog error:', error);
    return [];
  }
  return (data || []).map(mapAuditRow);
}

export async function fetchDraftCounts(): Promise<Record<string, number>> {
  const statuses: ShopDraftStatus[] = ['pending_review', 'approved', 'rejected', 'published', 'needs_more_info'];
  const counts: Record<string, number> = {};

  for (const s of statuses) {
    const { count } = await supabase
      .from('shop_drafts')
      .select('id', { count: 'exact', head: true })
      .eq('status', s);
    counts[s] = count || 0;
  }
  return counts;
}

// ==================== Updates ====================

export async function updateDraft(
  id: string,
  updates: {
    shopData?: ShopDraftData;
    email?: string | null;
    emailSource?: string | null;
    dmTemplate?: string | null;
    reviewNotes?: string | null;
  },
  actor: string
): Promise<boolean> {
  const dbUpdates: any = {};
  if (updates.shopData !== undefined) dbUpdates.shop_data = updates.shopData;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.emailSource !== undefined) dbUpdates.email_source = updates.emailSource;
  if (updates.dmTemplate !== undefined) dbUpdates.dm_template = updates.dmTemplate;
  if (updates.reviewNotes !== undefined) dbUpdates.review_notes = updates.reviewNotes;

  const { error } = await supabase
    .from('shop_drafts')
    .update(dbUpdates)
    .eq('id', id);

  if (error) {
    console.error('[ShopDraftService] updateDraft error:', error);
    return false;
  }

  await logAudit(id, actor, 'edited', { fields: Object.keys(updates) });
  return true;
}

export async function updateDraftPhotos(
  draftId: string,
  photos: { id?: string; url: string; source?: string; sourceUrl?: string; attribution?: string; position: number; isPrimary: boolean }[],
  actor: string
): Promise<boolean> {
  // Delete existing and re-insert (simplest for reordering)
  const { error: delError } = await supabase
    .from('shop_draft_photos')
    .delete()
    .eq('shop_draft_id', draftId);

  if (delError) {
    console.error('[ShopDraftService] delete photos error:', delError);
    return false;
  }

  if (photos.length > 0) {
    const rows = photos.map(p => ({
      shop_draft_id: draftId,
      url: p.url,
      source: p.source || null,
      source_url: p.sourceUrl || null,
      attribution: p.attribution || null,
      position: p.position,
      is_primary: p.isPrimary,
    }));

    const { error: insertError } = await supabase
      .from('shop_draft_photos')
      .insert(rows);

    if (insertError) {
      console.error('[ShopDraftService] insert photos error:', insertError);
      return false;
    }
  }

  await logAudit(draftId, actor, 'photos_updated', { count: photos.length });
  return true;
}

// ==================== Photo Management ====================

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shop-drafts`
  : '';

async function getSessionToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Bake EXIF orientation into the pixels and re-encode as JPEG.
 *
 * Why: iPhone photos are stored landscape with an EXIF Orientation flag (e.g. 6 =
 * rotate 90 deg CW). Supabase Storage's image transform - which the iOS/web apps use
 * via sizedImageUrl - does NOT honor EXIF orientation, so those photos render
 * sideways and cropped. Decoding with { imageOrientation: 'from-image' } applies the
 * rotation to the actual pixels and drops the now-redundant EXIF, so the image is
 * upright everywhere regardless of whether the renderer reads EXIF.
 *
 * Best-effort: returns the original file unchanged if anything is unsupported or fails.
 */
async function normalizeImageOrientation(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bitmap.close?.(); return file; }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
    if (!blob) return file;
    const newName = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export async function uploadDraftPhotoFile(file: File): Promise<{ url: string; error?: string }> {
  if (file.size > 8 * 1024 * 1024) return { url: '', error: 'File too large (max 8MB)' };
  if (!file.type.startsWith('image/')) return { url: '', error: 'File must be an image' };

  // Bake EXIF orientation into the pixels so the (EXIF-agnostic) Supabase image
  // transform used by the apps can't render the photo sideways/cropped.
  const normalized = await normalizeImageOrientation(file);

  const now = new Date();
  const datePath = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${String(now.getUTCDate()).padStart(2, '0')}`;
  const shortId = Math.random().toString(36).slice(2, 10);
  const ext = normalized.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `${datePath}/${shortId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('agent-uploads')
    .upload(storagePath, normalized, { contentType: normalized.type, upsert: false });

  if (uploadError) {
    return { url: '', error: `Storage error: ${uploadError.message}` };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('agent-uploads')
    .getPublicUrl(storagePath);

  return { url: publicUrl };
}

export async function addDraftPhoto(
  draftId: string,
  photo: { url: string; source?: string; attribution?: string; is_primary?: boolean },
  actor: string
): Promise<{ data: ShopDraftPhoto | null; error?: string }> {
  const token = await getSessionToken();
  if (!token) return { data: null, error: 'Not authenticated' };

  const res = await fetch(`${FUNCTION_URL}/${draftId}/photos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(photo),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to add photo' }));
    return { data: null, error: err.error || `Failed (${res.status})` };
  }

  const row = await res.json();
  await logAudit(draftId, actor, 'photo_added', { url: photo.url });
  return { data: mapPhotoRow(row) };
}

export async function deleteDraftPhoto(
  draftId: string,
  photoId: string,
  actor: string
): Promise<{ deleted: boolean; wasPrimary: boolean; error?: string }> {
  const token = await getSessionToken();
  if (!token) return { deleted: false, wasPrimary: false, error: 'Not authenticated' };

  const res = await fetch(`${FUNCTION_URL}/${draftId}/photos/${photoId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete' }));
    return { deleted: false, wasPrimary: false, error: err.error };
  }

  const data = await res.json();
  await logAudit(draftId, actor, 'photo_deleted', { photoId });
  return { deleted: true, wasPrimary: data.was_primary };
}

export async function patchDraftPhoto(
  draftId: string,
  photoId: string,
  updates: { is_primary?: boolean; position?: number; attribution?: string },
  actor: string
): Promise<{ data: ShopDraftPhoto | null; error?: string }> {
  const token = await getSessionToken();
  if (!token) return { data: null, error: 'Not authenticated' };

  const res = await fetch(`${FUNCTION_URL}/${draftId}/photos/${photoId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to update' }));
    return { data: null, error: err.error };
  }

  const row = await res.json();
  await logAudit(draftId, actor, 'photo_updated', { photoId, ...updates });
  return { data: mapPhotoRow(row) };
}

export async function reorderDraftPhotos(
  draftId: string,
  order: string[],
  actor: string
): Promise<{ data: ShopDraftPhoto[]; error?: string }> {
  const token = await getSessionToken();
  if (!token) return { data: [], error: 'Not authenticated' };

  const res = await fetch(`${FUNCTION_URL}/${draftId}/photos/reorder`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to reorder' }));
    return { data: [], error: err.error };
  }

  const rows = await res.json();
  await logAudit(draftId, actor, 'photos_reordered', { order });
  return { data: (rows || []).map(mapPhotoRow) };
}

// ==================== Status Transitions ====================

export async function rejectDraft(id: string, reviewNotes: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('shop_drafts')
    .update({
      status: 'rejected',
      review_notes: reviewNotes,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[ShopDraftService] rejectDraft error:', error);
    return false;
  }
  await logAudit(id, `admin:${userId}`, 'rejected', { review_notes: reviewNotes });
  return true;
}

export async function requestMoreInfo(id: string, reviewNotes: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('shop_drafts')
    .update({
      status: 'needs_more_info',
      review_notes: reviewNotes,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[ShopDraftService] requestMoreInfo error:', error);
    return false;
  }
  await logAudit(id, `admin:${userId}`, 'needs_more_info', { review_notes: reviewNotes });
  return true;
}

export async function approveDraft(id: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const draft = await fetchDraftById(id);
  if (!draft) return { success: false, error: 'Draft not found' };

  const photoError = validatePhotosForApproval(draft.photos);
  if (photoError) return { success: false, error: photoError };

  const { error } = await supabase
    .from('shop_drafts')
    .update({
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[ShopDraftService] approveDraft error:', error);
    return { success: false, error: error.message };
  }
  await logAudit(id, `admin:${userId}`, 'approved', {});
  return { success: true };
}

export async function publishDraft(id: string, userId: string): Promise<{ success: boolean; shopId?: string; error?: string }> {
  const draft = await fetchDraftById(id);
  if (!draft) return { success: false, error: 'Draft not found' };

  const photoError = validatePhotosForApproval(draft.photos);
  if (photoError) return { success: false, error: photoError };

  const sd = draft.shopData;

  if (!sd.address?.trim()) {
    return { success: false, error: 'Cannot publish without a full address.' };
  }

  // Geocode if lat/lng missing — best-effort, not required
  let lat = sd.lat || 0;
  let lng = sd.lng || 0;
  if ((!sd.lat || !sd.lng) && sd.address && MAPBOX_TOKEN) {
    const geo = await geocodeAddress(sd.address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }
  }

  // 2. Copy photos to Supabase Storage.
  // Order: the admin-selected primary first, then by position — so the hero image
  // in the apps (which sort by sort_order asc) matches the primary pick.
  const orderedPhotos = [...draft.photos].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.position - b.position;
  });
  const shopImages: { url: string; type: 'owner' }[] = [];

  for (const photo of orderedPhotos) {
    try {
      const cdnUrl = await copyPhotoToStorage(photo.url, sd.slug || sd.name);
      if (cdnUrl) {
        shopImages.push({ url: cdnUrl, type: 'owner' });
      }
    } catch (err) {
      console.error('[ShopDraftService] photo copy failed:', err);
    }
  }

  // 3. Map vibe_tags to the vibes array format the shops table expects
  const vibes = (sd.vibe_tags || []).map(tag =>
    tag.charAt(0).toUpperCase() + tag.slice(1)
  );

  // 4. Create the live shop
  const slug = sd.slug || sd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const { data: newShop, error: shopError } = await supabase
    .from('shops')
    .insert({
      name: sd.name,
      slug,
      description: sd.description,
      lat,
      lng,
      address: sd.address || '',
      city: sd.city || '',
      state: sd.state || '',
      country: sd.country || '',
      vibes,
      cheeky_vibes: sd.known_for || [],
      instagram_url: sd.instagram_url || null,
      open_hours: sd.hours || null,
    })
    .select()
    .single();

  if (shopError || !newShop) {
    console.error('[ShopDraftService] shop insert error:', shopError);
    return { success: false, error: shopError?.message || 'Failed to create shop' };
  }

  // 5. Insert shop images
  if (shopImages.length > 0) {
    const imageRows = shopImages.map((img, index) => ({
      shop_id: newShop.id,
      url: img.url,
      type: img.type,
      sort_order: index,
    }));
    await supabase.from('shop_images').insert(imageRows);
  }

  // 6. Update draft status
  await supabase
    .from('shop_drafts')
    .update({
      status: 'published',
      published_shop_id: newShop.id,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  await logAudit(id, `admin:${userId}`, 'published', { shop_id: newShop.id, slug });

  // 7. Trigger outreach email if email present
  if (draft.email && draft.outreachEmailStatus === 'not_sent') {
    await triggerOutreachEmail(id, draft.email, sd.name, slug, sd.neighborhood, sd.city || '');
  }

  return { success: true, shopId: newShop.id };
}

// ==================== DM Status ====================

export async function markDmSent(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('shop_drafts')
    .update({ outreach_dm_status: 'sent_manually' })
    .eq('id', id);

  if (error) {
    console.error('[ShopDraftService] markDmSent error:', error);
    return false;
  }
  await logAudit(id, `admin:${userId}`, 'dm_marked_sent', {});
  return true;
}

// ==================== Outreach ====================

async function triggerOutreachEmail(
  draftId: string,
  email: string,
  shopName: string,
  slug: string,
  neighborhood: string,
  city: string
): Promise<void> {
  await supabase
    .from('shop_drafts')
    .update({ outreach_email_status: 'queued' })
    .eq('id', draftId);

  try {
    await loopService.sendTransactionalEmail(email, 'cmoxfdi3p06np0i0tuaow5yw4', {
      shopName,
      shopDripmapUrl: `${APP_URL}/shop/${slug}`,
      shopClaimUrl: `${APP_URL}/shop/${slug}?claim=1`,
      neighborhood,
      city,
    });

    await supabase
      .from('shop_drafts')
      .update({
        outreach_email_status: 'sent',
        outreach_email_sent_at: new Date().toISOString(),
      })
      .eq('id', draftId);

    await logAudit(draftId, 'system', 'outreach_triggered', { email, transactionalId: 'cmoxfdi3p06np0i0tuaow5yw4' });
  } catch (err) {
    console.error('[ShopDraftService] outreach email failed:', err);
    await supabase
      .from('shop_drafts')
      .update({ outreach_email_status: 'failed' })
      .eq('id', draftId);
  }
}

export async function triggerLateOutreachEmail(draftId: string, userId: string): Promise<boolean> {
  const draft = await fetchDraftById(draftId);
  if (!draft || !draft.email || draft.outreachEmailStatus !== 'not_sent') return false;
  if (draft.status !== 'published' || !draft.publishedShopId) return false;

  const sd = draft.shopData;
  const slug = sd.slug || sd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  await supabase
    .from('shop_drafts')
    .update({ outreach_email_status: 'queued' })
    .eq('id', draftId);

  try {
    await loopService.sendTransactionalEmail(draft.email, 'cmoxfngrk08jk0iy5w6o1d55a', {
      shopName: sd.name,
      shopDripmapUrl: `${APP_URL}/shop/${slug}`,
      shopClaimUrl: `${APP_URL}/shop/${slug}?claim=1`,
      neighborhood: sd.neighborhood,
      city: sd.city || '',
    });

    await supabase
      .from('shop_drafts')
      .update({
        outreach_email_status: 'sent',
        outreach_email_sent_at: new Date().toISOString(),
      })
      .eq('id', draftId);

    await logAudit(draftId, `admin:${userId}`, 'outreach_triggered', { email: draft.email, transactionalId: 'cmoxfngrk08jk0iy5w6o1d55a' });
    return true;
  } catch (err) {
    console.error('[ShopDraftService] late outreach email failed:', err);
    await supabase
      .from('shop_drafts')
      .update({ outreach_email_status: 'failed' })
      .eq('id', draftId);
    return false;
  }
}

// ==================== Geocoding ====================

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encoded}&access_token=${MAPBOX_TOKEN}&limit=1`
    );
    const json = await res.json();
    const coords = json.features?.[0]?.geometry?.coordinates;
    if (coords) {
      return { lat: coords[1], lng: coords[0] };
    }
  } catch (err) {
    console.error('[ShopDraftService] geocode error:', err);
  }
  return null;
}

// ==================== Photo Storage ====================

async function copyPhotoToStorage(sourceUrl: string, shopIdentifier: string): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl);
    if (!res.ok) return null;
    const blob = await res.blob();

    const ext = sourceUrl.match(/\.(jpg|jpeg|png|webp)/i)?.[1] || 'jpg';
    const fileName = `drafts/${shopIdentifier}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from('shop-images')
      .upload(fileName, blob, { contentType: blob.type, upsert: false });

    if (error) {
      console.error('[ShopDraftService] storage upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('shop-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.error('[ShopDraftService] copyPhotoToStorage error:', err);
    return null;
  }
}

// ==================== Audit Log ====================

async function logAudit(draftId: string, actor: string, action: string, payload: any): Promise<void> {
  await supabase.from('shop_draft_audit_log').insert({
    shop_draft_id: draftId,
    actor,
    action,
    payload,
  });
}
