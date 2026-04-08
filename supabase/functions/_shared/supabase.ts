// Shared Supabase client for Edge Functions
// Using JSR (official Deno registry) for better compatibility
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Create Supabase client with service role key (for admin operations)
export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create Supabase client with anon key (for user-context operations)
export const createSupabaseClient = (authHeader: string) => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  );
};
