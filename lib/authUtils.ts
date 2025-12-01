import { supabase } from './supabase';

/**
 * Reset Supabase auth state by signing out and clearing all sb-* localStorage keys.
 * This is useful when we detect a corrupted or stale session that cannot be refreshed.
 * 
 * @returns Promise<void>
 */
export const resetSupabaseAuthState = async (): Promise<void> => {
  console.log('[authUtils] Resetting Supabase auth state (sign out + clear localStorage)');
  
  // Step 1: Sign out from Supabase
  try {
    await supabase.auth.signOut();
    console.log('[authUtils] Supabase signOut completed');
  } catch (e) {
    console.warn('[authUtils] Error during Supabase signOut:', e);
  }

  // Step 2: Clear all sb-* keys from localStorage (Supabase's storage prefix)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log(`[authUtils] Cleared ${keysToRemove.length} sb-* localStorage key(s)`);
    } catch (e) {
      console.warn('[authUtils] Error clearing Supabase localStorage keys:', e);
    }
  }

  console.log('[authUtils] Auth state reset complete');
};
