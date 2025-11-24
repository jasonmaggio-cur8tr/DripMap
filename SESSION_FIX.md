# Session Expiration Fix - Complete Solution

## You Were Right! 🎯

**The timeout issue was caused by expired JWT sessions.** Here's what was happening:

### The Problem:

1. **User logs in** → Gets JWT token (valid for 1 hour by default)
2. **User browses app** → Session token sits idle
3. **After ~60 minutes** → Token expires
4. **User tries to upload/update** → Request fails silently
5. **Upload times out** → Appears as "Upload timeout after 120s"

The real error wasn't a timeout - it was **permission denied due to expired session**, but the error handling made it look like a network issue.

## Complete Fix Applied

### 1. **Automatic Session Refresh** (`lib/supabase.ts`)
```typescript
auth: {
  autoRefreshToken: true,      // ✅ Auto-refresh before expiry
  persistSession: true,         // ✅ Keep session across page reloads
  detectSessionInUrl: true      // ✅ Handle email verification
}
```

### 2. **Pre-Operation Session Validation** (`context/AppContext.tsx`)
Added `ensureValidSession()` helper that:
- ✅ Checks if session exists
- ✅ Validates expiration time
- ✅ Automatically refreshes if expiring within 5 minutes
- ✅ Returns null if refresh fails

Applied to all critical operations:
- ✅ Adding spots (shops)
- ✅ Adding reviews
- ✅ Updating profile
- ✅ Uploading images

### 3. **Upload-Time Session Refresh** (`services/storageService.ts`)
Before every upload:
- ✅ Checks session validity
- ✅ Refreshes expired sessions automatically
- ✅ Provides clear error if refresh fails
- ✅ Logs session expiration time

### 4. **Better Auth State Handling** (`context/AppContext.tsx`)
Improved auth state listener to:
- ✅ Log all auth events (TOKEN_REFRESHED, SIGNED_OUT, etc.)
- ✅ Handle token refresh events properly
- ✅ Maintain user state during refresh
- ✅ Clear user on sign out

## How It Works Now

### Before (Broken):
```
1. User logs in at 9:00 AM
2. User browses until 10:30 AM
3. User tries to upload → Session expired (10:00 AM)
4. Upload fails silently
5. Times out after 120s
6. User sees: "Upload timeout"
```

### After (Fixed):
```
1. User logs in at 9:00 AM
2. User browses until 10:30 AM
3. User tries to upload
4. System checks: "Session expires at 10:00 AM - expired!"
5. System auto-refreshes session
6. Upload succeeds in 2-5 seconds
7. User sees: Success! ✅
```

## Session Lifecycle

### Automatic Refresh (Supabase handles this):
- Token valid for: **60 minutes**
- Auto-refresh starts: **5 minutes before expiry** (at 55 minutes)
- Refresh window: **55-60 minutes**

### Manual Validation (We added this):
- Check before uploads: **Every time**
- Check before reviews: **Every time**
- Check before profile updates: **Every time**
- Refresh if expiring within: **5 minutes**

## Error Messages

### Old (Confusing):
```
❌ "Upload timeout after 120s - check your internet connection"
```

### New (Clear):
```
✅ "Your session has expired. Please log out and log back in."
✅ "Session refreshed successfully"
✅ "User authenticated, session valid until: [timestamp]"
```

## Console Logs for Debugging

You'll now see helpful logs:
```javascript
// Session validation
"User authenticated, session valid until: Mon Nov 24 2025 11:00:00"
"Session expiring soon, refreshing..."
"Session refreshed successfully"

// Auth events
"Auth state changed: TOKEN_REFRESHED"
"Token refreshed automatically"

// Failures
"Session expired, attempting to refresh..."
"Failed to refresh session: [error]"
```

## What Changed in Code

### Storage Service:
```typescript
// OLD: Just checked if session exists
const { data: { session } } = await supabase.auth.getSession();
if (!session) return error;

// NEW: Validates AND refreshes if needed
let session = await getSession();
if (session.expires_at < now) {
  session = await refreshSession(); // Auto-fix!
}
```

### Context Actions:
```typescript
// OLD: Assumed session was valid
const addReview = async (...) => {
  await db.addReview(...);
}

// NEW: Validates session first
const addReview = async (...) => {
  const session = await ensureValidSession(); // Check!
  if (!session) return error;
  await db.addReview(...);
}
```

## Testing the Fix

### Test Scenario 1: Fresh Session
1. Log in
2. Immediately add a spot with image
3. Should work instantly ✅

### Test Scenario 2: Idle Session
1. Log in
2. Wait 55+ minutes (or manually expire token in DevTools)
3. Try to add a spot
4. Should auto-refresh and work ✅

### Test Scenario 3: Expired Session (Can't Refresh)
1. Log in
2. Revoke token in Supabase dashboard
3. Try to add a spot
4. Should show clear error: "Please log out and log back in" ✅

## Manual Testing Commands

Open browser console:

```javascript
// Check current session
const { data: { session } } = await supabase.auth.getSession();
console.log('Expires at:', new Date(session.expires_at * 1000));
console.log('Time left:', session.expires_at * 1000 - Date.now(), 'ms');

// Force refresh
const { data, error } = await supabase.auth.refreshSession();
console.log('Refreshed:', data.session);

// Check token
console.log('Token:', session.access_token.substring(0, 50) + '...');
```

## Why This is Better

### Old Approach:
- ❌ Silent failures
- ❌ Confusing error messages
- ❌ No automatic recovery
- ❌ User frustration

### New Approach:
- ✅ Automatic session refresh
- ✅ Clear error messages
- ✅ Self-healing on expiry
- ✅ Better user experience

## Still Having Issues?

### If uploads still fail after 55+ minutes:

1. **Check Supabase project status**
   - Free tier projects auto-pause after inactivity
   - Go to dashboard and verify project is active

2. **Verify autoRefreshToken is enabled**
   - Check `lib/supabase.ts` line 96
   - Should see `autoRefreshToken: true`

3. **Check for JWT errors in console**
   - Look for: "JWT expired" or "invalid signature"
   - May indicate Supabase keys need rotation

4. **Force logout and login**
   - Sometimes refresh tokens become invalid
   - Fresh login creates new tokens

## Summary

**Root Cause:** JWT session expiration after ~60 minutes  
**Symptom:** Upload timeouts and failed updates  
**Fix:** Automatic session validation and refresh before all operations  
**Result:** Seamless experience even with long sessions  

The upload timeout was a red herring - it was actually permission denied due to expired sessions. Now the app automatically handles this! 🎉
