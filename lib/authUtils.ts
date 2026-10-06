import { supabase } from "./supabase";

/**
 * Get the current access token without risking the supabase-js getSession()
 * hang: its cross-tab LockManager lock can wedge indefinitely (e.g. when
 * another DripMap tab holds it), which surfaced as "submit keeps timing out"
 * on Add Spot. Races getSession() against a short timeout, then falls back to
 * reading the persisted session straight from localStorage — the same place
 * supabase-js stores it.
 */
export const getAccessTokenFast = async (
  timeoutMs = 6000
): Promise<string | undefined> => {
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("getSession_timeout")), timeoutMs)
      ),
    ]);
    const token = result.data.session?.access_token;
    if (token) return token;
  } catch (e) {
    console.warn(
      "[authUtils] getSession() slow or locked — falling back to localStorage:",
      (e as Error).message
    );
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const token = parsed?.access_token;
        const expiresAt = parsed?.expires_at; // epoch seconds
        // Require ≥30s of remaining validity so we don't hand back a token
        // that expires mid-upload.
        if (token && (!expiresAt || expiresAt * 1000 > Date.now() + 30_000)) {
          return token;
        }
      }
    }
  } catch (e) {
    console.warn("[authUtils] localStorage token fallback failed:", e);
  }
  return undefined;
};

/**
 * Reset Supabase auth state by signing out and clearing all sb-* localStorage keys.
 * This is useful when we detect a corrupted or stale session that cannot be refreshed.
 *
 * @returns Promise<void>
 */
export const resetSupabaseAuthState = async (): Promise<void> => {
  console.log(
    "[authUtils] Resetting Supabase auth state (sign out + clear localStorage)"
  );

  // Step 1: Sign out from Supabase
  try {
    await supabase.auth.signOut();
    console.log("[authUtils] Supabase signOut completed");
  } catch (e) {
    console.warn("[authUtils] Error during Supabase signOut:", e);
  }

  // Step 2: Clear all sb-* keys from localStorage (Supabase's storage prefix)
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(
      `[authUtils] Cleared ${keysToRemove.length} sb-* localStorage key(s)`
    );
  } catch (e) {
    console.warn("[authUtils] Error clearing Supabase localStorage keys:", e);
  }

  try {
    sessionStorage.clear();
    console.log("[authUtils] sessionStorage cleared");
  } catch (e) {
    console.warn("[authUtils] Error clearing sessionStorage:", e);
  }

  console.log("[authUtils] Auth state reset complete");
};
