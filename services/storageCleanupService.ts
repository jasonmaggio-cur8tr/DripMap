import { supabase } from '../lib/supabase';

const FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cleanup-agent-uploads`
  : '';

export interface CleanupResult {
  scanned_folders: number;
  orphaned_found: number;
  deleted: number;
  errors: number;
  cutoff_date: string;
  referenced_count: number;
}

export async function cleanupOrphanedUploads(): Promise<CleanupResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Cleanup failed (${res.status})`);
  }

  return res.json();
}
