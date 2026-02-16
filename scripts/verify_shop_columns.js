import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Error loading .env file:', e.message);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY; // or SERVICE_ROLE_KEY if available

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumns() {
    console.log('🔍 Verifying "shops" table schema...');

    // Try to select the new columns. If they don't exist, Supabase will return an error.
    const columnsToCheck = ['brand_id', 'location_name', 'open_hours', 'country'];

    const { data, error } = await supabase
        .from('shops')
        .select(columnsToCheck.join(','))
        .limit(1);

    if (error) {
        if (error.code === 'PGRST204' || error.message.includes('column') || error.message.includes('relations')) {
            console.error('❌ Schema mismatch detected!');
            console.error('Error:', error.message);
            console.log('\nIt seems one or more columns are missing from the "shops" table.');
            console.log(`Checked columns: ${columnsToCheck.join(', ')}`);
            console.log('This confirms why "Add Shop" is failing.');
        } else {
            console.error('❌ Unexpected error:', error);
        }
    } else {
        console.log('✅ All columns exist. The schema seems correct.');
    }
}

verifyColumns().catch(console.error);
