const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('shops').select(`
    *,
    shop_images(*),
    reviews(*, profiles(username, avatar_url)),
    experience_logs(*, profiles(username, avatar_url)),
    shop_aggregates(drip_score)
  `).eq('id', '87b93380-2fde-4d9d-a893-9e024567e6ce').single();
  
  if (error) {
    console.error(error);
  } else {
    console.log("Found shop:", data.name);
    console.log("Images:", data.shop_images?.length);
    console.log("Reviews:", data.reviews?.length);
    console.log("Logs:", data.experience_logs?.length);
    console.log("Aggregates:", data.shop_aggregates);
    console.log("Vibes:", data.vibes);
    console.log("Current Menu:", data.current_menu);
    console.log("Baristas:", data.baristas);
    console.log("Specialty Drinks:", data.specialty_drinks);
    console.log("Plant Milks:", data.plant_milks);
  }
}
run();
