---
name: loops-integration
description: Integration patterns for Loops.so email marketing platform. Includes transactional emails, events, contacts, and Supabase Edge Function CORS bypass workaround.
---

# Loops.so Integration Guide

When working with Loops.so for transactional emails, adding contacts, or sending events, you must follow these specific patterns.

## 🚨 CRITICAL CORS CONSTRAINT

**NEVER make raw `fetch()` calls to `https://app.loops.so/api/v1/*` directly from the browser (React frontend).**

Loops.so strictly blocks all API requests originating from web browsers to protect the secret API key from being leaked. If you attempt a direct browser fetch, you will receive a silent `Failed to fetch` CORS error, and native JavaScript `Error` objects will serialize into an empty `{}` object, completely masking the root cause.

### The Solution: Supabase Edge Function Proxy

All requests from the frontend client to the Loops API must be routed securely through our custom Supabase Edge Function named `loops-proxy`.

The Edge Function handles injecting the `Bearer <LOOPS_API_KEY>` secret so that it never touches the frontend browser client.

## Frontend Usage Pattern

Instead of using `fetch`, invoke the edge function via the Supabase Javascript client (`@supabase/supabase-js`).

### Imports
```typescript
import { supabase } from '../lib/supabase'; // Or wherever your initialized client lives
```

### Sending a Transactional Email
```typescript
// Define the payload exactly as Loops expects it. 
// Do not nest it inside another 'body' object other than the payload var.
const payload = {
    email: "user@example.com",
    transactionalId: "cmlpuhcf700pw0i1nqtlyw75w", // The literal ID string from Loops dashboard
    dataVariables: {
        firstName: "Jason",
        link: "https://example.com"
    },
    addToAudience: true
};

const { data, error } = await supabase.functions.invoke('loops-proxy', {
    body: { 
        endpoint: '/transactional', // Explicitly declare the loops endpoint
        payload: payload            // Pass the literal loops payload
    }
});

if (error) {
    // Note: Use error.message because JSON.stringify(error) will result in {}
    console.error("Loops Error:", error.message || String(error));
}
```

### Adding a Contact
```typescript
const payload = {
    email: "newuser@example.com",
    firstName: "Jason",
    userGroup: "user",
    userId: "uuid-from-supabase",
    source: "DripMap Web App"
};

const { data, error } = await supabase.functions.invoke('loops-proxy', {
    body: { endpoint: '/contacts/create', payload }
});
```

### Sending a Custom Event
```typescript
const payload = {
    email: "user@example.com",
    eventName: "Signed_Up",
    // custom event properties...
    planTier: "Pro"
};

const { data, error } = await supabase.functions.invoke('loops-proxy', {
    body: { endpoint: '/events/send', payload }
});
```

## Dashboard Requirements

### Transactional Emails

When telling the user to create a Transactional Email in the Loops.so dashboard:
1. Explain that variables on the document canvas are injected by typing `/` and selecting **Variable**.
2. Explain that Button Links or Sidebar Fields are injected using merge tags (e.g. `{{link}}`).
3. Explicitly remind the user that the email *must* be set to **Published**. If it is left in **Draft** mode, the Loops API will return a 200 OK success response, but silently swallow the email and never dispatch it to the inbox.

### Onboarding / Automated Loops

If building onboarding funnel emails, the code implementation is simply to ensure `createContact` is triggered upon signup. The rest of the "Loop" logic (Time Delays, sequences, triggers) is built graphically in the Loops Automation Dashboard, not in code.
