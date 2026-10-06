import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfile() {
    const userId = "06ffe77a-0222-4cf1-98aa-a8b7ce3b4258"; // Extracted from test_login.js
    console.log("Checking profile for user:", userId);

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId);

    console.log("Profile Data:", data);
    console.log("Profile Error:", error);
}

checkProfile();
