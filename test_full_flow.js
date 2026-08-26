import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFullFlow() {
    console.log("1. Starting login...");
    const { data, error } = await supabase.auth.signInWithPassword({
        email: "jason@dripmap.space",
        password: "Gratitude#1123",
    });

    if (error) {
        console.error("Login Error:", error);
        return;
    }

    const userId = data.user.id;
    console.log("2. Logged in successfully. user.id:", userId);

    console.log("3. Calling fetchUserProfile...");
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (profileError) {
        console.error("Profile Error:", profileError);
        return;
    }
    console.log("4. Profile loaded:", profile.username);

    console.log("5. Fetching social/saved data...");
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
    console.log("6. Social data loaded");

    console.log("7. Checking claim requests...");
    let requests = [];
    if (profile.is_admin || profile.is_business_owner) {
        console.log("Fetching ALL claim requests...");
        requests = await supabase.from("claim_requests").select("*").order("created_at", { ascending: false });
    } else {
        console.log("Fetching USER claim requests...");
        requests = await supabase.from("claim_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    }
    console.log("8. Claim requests loaded:", requests.data?.length);

    console.log("9. Login flow COMPLETED SUCCESSFULLY.");
}

testFullFlow();
