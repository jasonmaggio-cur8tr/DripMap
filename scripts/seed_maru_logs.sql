
-- Seed Data for Maru (Williamsburg)
-- Shop ID: 608cc540-57a8-439e-b1be-f381a95274e5

DO $$
DECLARE
  v_shop_id uuid := '608cc540-57a8-439e-b1be-f381a95274e5';
  -- Real User IDs found in database
  v_user_1 uuid := '3a1669df-2e27-4a2a-8efd-8185868e944a'; -- berlinmaggio
  v_user_2 uuid := '04adafcb-e1ea-4901-b283-53dfa4fcf370'; -- cardobjj
  v_user_3 uuid := 'c734ae56-0f78-4f68-9651-bea35903ad46'; -- Sabrinasochill
  v_user_4 uuid := '140187c4-63fc-4ddd-8456-6b28305c7cff'; -- M1ahansen
  v_user_5 uuid := '9afff847-c502-43b1-baec-72ad97dc30d6'; -- Hasham
  v_user_6 uuid := 'd9306f34-a167-41cd-992b-2fa4ce91a2d6'; -- camp4440
BEGIN

  -- Log 1
  INSERT INTO public.experience_logs (
    shop_id, user_id, 
    overall_quality, bring_friend_score, 
    vibe_energy, coffee_style, specialty_drink, matcha_profile, pastry_craft, parking_ease, laptop_friendly,
    quick_take, created_at
  ) VALUES (
    v_shop_id, v_user_1,
    92, 9, 
    40, 95, null, null, 85, 10, 30,
    'Best espresso inside Williamsburg, hands down. Tiny space though.', 
    now() - interval '2 days'
  ) ON CONFLICT DO NOTHING;


  -- Log 2
  INSERT INTO public.experience_logs (
    shop_id, user_id, 
    overall_quality, bring_friend_score, 
    vibe_energy, coffee_style, specialty_drink, matcha_profile, pastry_craft, parking_ease, laptop_friendly,
    quick_take, created_at
  ) VALUES (
    v_shop_id, v_user_2,
    85, 7, 
    30, 88, null, 90, null, 15, 20,
    'Great matcha, but absolutely no laptops allowed on weekends. Come for the vibe, not to work.', 
    now() - interval '5 days'
  ) ON CONFLICT DO NOTHING;


  -- Log 3
  INSERT INTO public.experience_logs (
    shop_id, user_id, 
    overall_quality, bring_friend_score, 
    vibe_energy, coffee_style, specialty_drink, matcha_profile, pastry_craft, parking_ease, laptop_friendly,
    quick_take, created_at
  ) VALUES (
    v_shop_id, v_user_3,
    95, 10, 
    80, 90, 95, null, 92, 10, 10,
    'The cream top iced americano is life changing. Line is long but moves fast.', 
    now() - interval '10 days'
  ) ON CONFLICT DO NOTHING;


  -- Log 4
  INSERT INTO public.experience_logs (
    shop_id, user_id, 
    overall_quality, bring_friend_score, 
    vibe_energy, coffee_style, specialty_drink, matcha_profile, pastry_craft, parking_ease, laptop_friendly,
    quick_take, created_at
  ) VALUES (
    v_shop_id, v_user_4,
    88, 8, 
    50, 92, null, null, null, 0, 0,
    'Beautiful aesthetics. A bit pretentious but the coffee backs it up.', 
    now() - interval '15 days'
  ) ON CONFLICT DO NOTHING;


  -- Log 5
  INSERT INTO public.experience_logs (
    shop_id, user_id, 
    overall_quality, bring_friend_score, 
    vibe_energy, coffee_style, specialty_drink, matcha_profile, pastry_craft, parking_ease, laptop_friendly,
    quick_take, created_at
  ) VALUES (
    v_shop_id, v_user_5,
    90, 9, 
    45, 89, null, 92, 88, 20, 15,
    'Consistently excellent. Pricey but worth it as a treat.', 
    now() - interval '20 days'
  ) ON CONFLICT DO NOTHING;


  -- Log 6
  INSERT INTO public.experience_logs (
    shop_id, user_id, 
    overall_quality, bring_friend_score, 
    vibe_energy, coffee_style, specialty_drink, matcha_profile, pastry_craft, parking_ease, laptop_friendly,
    quick_take, created_at
  ) VALUES (
    v_shop_id, v_user_6,
    78, 6, 
    60, 82, null, null, 70, 5, 5,
    'Good coffee, but nowhere to sit. Strictly grab and go.', 
    now() - interval '25 days'
  ) ON CONFLICT DO NOTHING;

  -- Force recompute
  PERFORM public.recompute_shop_aggregates(v_shop_id);

END $$;
