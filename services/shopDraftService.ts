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

export async function approveDraft(id: string, userId: string): Promise<boolean> {
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
    return false;
  }
  await logAudit(id, `admin:${userId}`, 'approved', {});
  return true;
}

export async function publishDraft(id: string, userId: string): Promise<{ success: boolean; shopId?: string; error?: string }> {
  const draft = await fetchDraftById(id);
  if (!draft) return { success: false, error: 'Draft not found' };

  const sd = draft.shopData;

  // 1. Geocode if lat/lng missing
  let lat = sd.lat;
  let lng = sd.lng;
  if ((!lat || !lng) && sd.address && MAPBOX_TOKEN) {
    const geo = await geocodeAddress(sd.address);
    if (geo) {
      lat = geo.lat;
      lng = geo.lng;
    }
  }

  if (!lat || !lng) {
    return { success: false, error: 'Cannot publish without coordinates. Geocode the address first.' };
  }

  // 2. Copy photos to Supabase Storage
  const primaryPhoto = draft.photos.find(p => p.isPrimary) || draft.photos[0];
  const shopImages: { url: string; type: 'owner' }[] = [];

  for (const photo of draft.photos.sort((a, b) => a.position - b.position)) {
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
    const imageRows = shopImages.map(img => ({
      shop_id: newShop.id,
      url: img.url,
      type: img.type,
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
    await loopService.sendEvent(email, 'shop_listed', {
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

    await logAudit(draftId, 'system', 'outreach_triggered', { email, event: 'shop_listed' });
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
    await loopService.sendEvent(draft.email, 'shop_listed_late', {
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

    await logAudit(draftId, `admin:${userId}`, 'outreach_triggered', { email: draft.email, event: 'shop_listed_late' });
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
