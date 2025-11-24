
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to safely access environment variables
const getEnv = (key: string) => {
  let val = '';
  
  // Try import.meta.env first (Vite Standard)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      val = import.meta.env[key];
    }
  } catch (e) {}

  // If not found, try process.env (Fallback)
  if (!val) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        val = process.env[key];
      }
    } catch (e) {}
  }
  
  return val || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Check if we have valid configuration (not empty and not the placeholder default)
const isConfigured = supabaseUrl && 
                     supabaseAnonKey && 
                     supabaseUrl !== 'your-supabase-url-here' &&
                     supabaseAnonKey !== 'your-supabase-anon-key-here' &&
                     supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn('Supabase Environment Variables missing or using placeholders. Using Mock Client for Demo.');
}

// Mock client to prevent "Failed to fetch" crashes in demo/preview environments
const mockClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => {
        console.warn("Mock signup: Please configure Supabase credentials in .env");
        return { 
          data: { user: null, session: null }, 
          error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file' } 
        };
    },
    signInWithPassword: async () => {
        console.warn("Mock login: Please configure Supabase credentials in .env");
        return { 
          data: { user: null, session: null }, 
          error: { message: 'Supabase not configured. Please add credentials to .env file' } 
        };
    },
    signInWithOtp: async () => {
        console.log("Mock Login: Check console for 'success'");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { data: {}, error: null };
    },
    signOut: async () => {
        return { error: null };
    },
  },
  from: (table: string) => ({
    select: () => ({
        eq: () => ({
            single: async () => ({ data: null, error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
        })
    }),
    insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }) }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: { message: 'Storage not configured' } }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: async () => ({ error: null })
    }),
    getBucket: async () => ({ data: null, error: { message: 'not found' } }),
    createBucket: async () => ({ error: { message: 'Storage not configured' } })
  }
};

// Export real client if configured, otherwise export mock cast as any to satisfy types
export const supabase = (isConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-client-info': 'dripmap-web'
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : mockClient) as any as SupabaseClient;
