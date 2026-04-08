import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetchProfile() {
    const userId = "06ffe77a-0222-4cf1-98aa-a8b7ce3b4258"; // Extracted from test_login.js
    console.log("Fetching profile for user:", userId);

    try {
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (error) throw error;
        if (!profile) return null;

        // Fetch saved shops, visited shops, followers, and following
        const [savedResult, visitedResult, followersResult, followingResult] =
            await Promise.all([
                supabase.from("saved_shops").select("shop_id").eq("user_id", userId),
                supabase.from("visited_shops").select("shop_id").eq("user_id", userId),
                supabase
                    .from("user_follows")
                    .select("follower_id")
                    .eq("following_id", userId)
                    .then(r => (r.error ? { data: [] } : r)),
                supabase
                    .from("user_follows")
                    .select("following_id")
                    .eq("follower_id", userId)
                    .then(r => (r.error ? { data: [] } : r)),
            ]);

        console.log("Profile data fully fetched!");
        console.log("Saved:", savedResult);
        console.log("Visited:", visitedResult);

    } catch (error) {
        console.error("Error fetching user profile:", error);
    }
}

testFetchProfile();
