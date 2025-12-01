# Auth State Reset Implementation

## Overview
Implemented robust auth state reset functionality to handle corrupted/stale Supabase localStorage tokens that cause the "works in incognito, stuck in normal Chrome" upload bug.

## Files Modified

### 1. `lib/authUtils.ts` (NEW)
**Purpose:** Centralized auth state reset utility

**Key Function:**
```typescript
resetSupabaseAuthState(): Promise<void>
```

**What it does:**
- Signs out from Supabase using `supabase.auth.signOut()`
- Clears all `sb-*` localStorage keys (Supabase's storage prefix)
- Logs all operations for debugging

**When to use:**
- Session is missing or invalid
- Session refresh fails
- Auth errors (401/403/JWT expired) that cannot be recovered

---

### 2. `services/storageService.ts`
**Changes:** Integrated `resetSupabaseAuthState` into upload error handling

**Integration points:**
1. **Initial session check** (line ~93):
   - If `getSession()` fails or returns no session
   - Calls `resetSupabaseAuthState()` before throwing error

2. **Session refresh failure** (line ~107):
   - If expired session cannot be refreshed
   - Calls `resetSupabaseAuthState()` before throwing error

3. **Upload retry auth errors** (line ~163):
   - If session refresh fails during upload retry
   - Calls `resetSupabaseAuthState()` before breaking retry loop

**Error messages updated:**
- "Please log in again to continue" (clearer than "log out and log back in")
- More specific about auth state being invalid/stale

---

### 3. `pages/AddSpot.tsx`
**Changes:** Added auth state reset to session mismatch handler

**Integration point:**
- **Session mismatch detection** (line ~188):
  - When AppContext user ID ≠ Supabase auth user ID
  - If refresh attempt fails
  - Calls `resetSupabaseAuthState()` before showing error toast

**Error message updated:**
- "Session mismatch detected and could not be refreshed. Please log in again."

---

## How It Works

### Normal Flow (No Issues)
1. User uploads images
2. `storageService.uploadImage()` checks session
3. Session is valid → upload proceeds
4. Success ✅

### Corrupted State Flow (Bug Fix)
1. User uploads images
2. `storageService.uploadImage()` checks session
3. Session invalid/missing OR refresh fails
4. **`resetSupabaseAuthState()` called** 🔧
   - Signs out from Supabase
   - Clears all `sb-*` localStorage keys
5. Clear error message shown
6. User sees "Please log in again"
7. User logs in with fresh session
8. Upload works ✅

### Why This Fixes the "Incognito Works" Bug
- **Incognito:** No localStorage = no stale tokens = always fresh session
- **Normal Chrome:** Old tokens persist in localStorage, can become invalid
- **Fix:** When detecting invalid tokens, clear them completely (like incognito)

---

## Testing Checklist

### Test Case 1: Normal Upload
- [ ] Login → Upload single image → Success
- [ ] Login → Upload multiple images → Success
- [ ] Check console: No auth errors

### Test Case 2: Expired Session
- [ ] Login → Wait for token to expire (or force expire)
- [ ] Try to upload → Should auto-refresh → Success
- [ ] If refresh fails → localStorage cleared → "Please log in again" error

### Test Case 3: Corrupted localStorage (Reproduces Original Bug)
- [ ] Login normally
- [ ] Manually corrupt localStorage `sb-*` keys (DevTools)
- [ ] Try to upload → `resetSupabaseAuthState()` called → localStorage cleared
- [ ] Error message: "Please log in again"
- [ ] Login → Upload works

### Test Case 4: Session Mismatch
- [ ] Login → Open in 2 tabs
- [ ] Logout in tab 1, login as different user
- [ ] Tab 2: Try to upload → Detects mismatch → Refresh fails → Reset called
- [ ] Clear error → User re-authenticates → Upload works

---

## Configuration Notes

**Supabase Client Settings (lib/supabase.ts):**
```typescript
auth: {
  persistSession: true,  // ✅ KEPT - needed for user convenience
  autoRefreshToken: true // ✅ KEPT - auto-refresh valid tokens
}
```

**Why we kept `persistSession: true`:**
- Better UX (users stay logged in)
- Auth state reset handles corrupted tokens without disabling persistence
- Best of both worlds: persistence + cleanup when needed

---

## Logging & Debugging

All auth operations log to console:

**Auth reset logs:**
```
[authUtils] Resetting Supabase auth state (sign out + clear localStorage)
[authUtils] Supabase signOut completed
[authUtils] Cleared 3 sb-* localStorage key(s)
[authUtils] Auth state reset complete
```

**Upload error logs:**
```
No active session found for upload: [error details]
Failed to refresh session: [error details]
Session refresh failed during upload retry: [error details]
```

**Session mismatch logs:**
```
Detected mismatch between app user and auth user before upload
Session refresh failed while attempting to correct mismatch
```

---

## Related Files
- `lib/supabase.ts` - Supabase client configuration
- `context/AppContext.tsx` - User session management
- `pages/EditShop.tsx`, `ShopDetail.tsx`, `Profile.tsx` - Other components using `uploadImage()`

---

## Future Enhancements (Optional)

1. **Global 401/403 Handler:**
   - Intercept all Supabase API calls
   - Auto-reset on any auth failure
   - Would cover more than just uploads

2. **Auth State Health Check:**
   - Periodic validation of localStorage tokens
   - Proactive reset before failures occur

3. **User Notification:**
   - Show toast when auth reset happens
   - "Session expired - please log in again"

---

## Rollback Plan (If Needed)

If this causes issues, to rollback:
1. Remove `import { resetSupabaseAuthState }` from all files
2. Remove all `await resetSupabaseAuthState()` calls
3. Revert error messages to previous versions
4. Delete `lib/authUtils.ts`

Files to revert: `storageService.ts`, `AddSpot.tsx`

---

**Implementation Date:** 2025-01-XX  
**Status:** ✅ Implemented & Ready for Testing  
**Persistence Enabled:** ✅ Yes (`persistSession: true`)
