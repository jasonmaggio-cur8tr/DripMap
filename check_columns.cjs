const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    const { data, error } = await supabase
        .from('shops')
        .select('current_menu, specialty_drinks, sourcing_info, espresso_machine, grinder_details, brewing_methods')
        .limit(1);

    if (error) {
        console.error("Schema error:", error);
    } else {
        console.log("Columns exist! Data:", JSON.stringify(data, null, 2));
    }
}

checkSchema();
