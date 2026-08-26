import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: shop, error } = await supabase
    .from('shops')
    .select('id, name, is_claimed, claimed_by')
    .eq('id', '87b93380-2fde-4d9d-a893-9e024567e6ce')
    .single();
    
  console.log("Shop Data:", shop);
  console.log("Error:", error);
}

main().catch(console.error);
