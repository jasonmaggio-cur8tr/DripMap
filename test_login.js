import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log("Attempting login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: "jason@dripmap.space",
    password: "Gratitude#1123",
  });

  if (error) {
    console.error("Login Error:", error);
  } else {
    console.log("Login Success! User ID:", data.user?.id);
  }
}

testLogin();
