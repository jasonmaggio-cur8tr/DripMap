const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActivity() {
    const { data, error } = await supabase.rpc('get_active_queries');
    if (error) {
        // try to query directly via REST if RPC doesn't exist? RPC might not exist.
        console.error("RPC Error:", error);
    } else {
        console.log(data);
    }
}
checkActivity();
