-- Migration: Adjust Drip Score Formula (Leans Good, Steep Recency)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.recompute_shop_aggregates(p_shop_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_log_count int;
  v_promoters numeric;
  v_detractors numeric;
  v_total numeric;

  v_nps numeric;
  v_nps_norm numeric;

  v_avg_overall numeric;
  v_conf numeric;
  v_base numeric;
  v_drip numeric;

  -- Weighted averages for optional dims
  v_vibe numeric;
  v_coffee numeric;
  v_specialty numeric;
  v_matcha numeric;
  v_pastry numeric;
  v_parking numeric;
  v_laptop numeric;

BEGIN
  -- Count logs
  SELECT count(*) INTO v_log_count
  FROM public.experience_logs
  WHERE shop_id = p_shop_id;

  -- If no logs, clear aggregates row
  IF v_log_count = 0 THEN
    INSERT INTO public.shop_aggregates(shop_id, log_count, updated_at)
    VALUES (p_shop_id, 0, now())
    ON CONFLICT (shop_id) DO UPDATE
      SET log_count = 0,
          avg_overall_quality = null,
          nps_score = null,
          nps_normalized = null,
          drip_score = null,
          avg_vibe_energy = null,
          avg_coffee_style = null,
          avg_specialty_drink = null,
          avg_matcha_profile = null,
          avg_pastry_craft = null,
          avg_parking_ease = null,
          avg_laptop_friendly = null,
          trait_1 = null,
          trait_2 = null,
          updated_at = now();
    RETURN;
  END IF;

  -- Weighted overall_quality average (Exponential Time Decay: 30 days emphasize recent scores)
  WITH w AS (
    SELECT
      overall_quality::numeric AS val,
      exp(-(EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 30.0) AS wt
    FROM public.experience_logs
    WHERE shop_id = p_shop_id
  )
  SELECT sum(val * wt) / nullif(sum(wt),0) INTO v_avg_overall
  FROM w;

  -- NPS components from bring_friend_score (unweighted counts)
  SELECT
    sum(CASE WHEN bring_friend_score >= 9 THEN 1 ELSE 0 END)::numeric,
    sum(CASE WHEN bring_friend_score <= 6 THEN 1 ELSE 0 END)::numeric,
    count(*)::numeric
  INTO v_promoters, v_detractors, v_total
  FROM public.experience_logs
  WHERE shop_id = p_shop_id;

  v_nps := ((v_promoters / nullif(v_total,0)) * 100.0) - ((v_detractors / nullif(v_total,0)) * 100.0);
  v_nps_norm := (v_nps + 100.0) / 2.0;

  -- Confidence factor (Reaches ~80% confidence at 6 logs)
  v_conf := 1.0 - exp(-(v_log_count::numeric) / 4.0);

  -- Base score calculation (Raw 0-100)
  v_base := (coalesce(v_avg_overall, 80) * 0.6) + (coalesce(v_nps_norm, 80) * 0.4);
  
  -- NEW FORMULA: Map 0-100 to 70-100 range so scores lean mostly positive.
  -- Drip Score = 70 + (Base * 0.3)
  v_drip := 70.0 + (v_base * 0.3);
  
  v_drip := greatest(50.0, least(100.0, v_drip));

  -- Helper query for weighted averages of optional dims
  WITH w AS (
    SELECT vibe_energy::numeric AS val, exp(-(EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 30.0) AS wt
    FROM public.experience_logs WHERE shop_id = p_shop_id AND vibe_energy IS NOT NULL
  ) SELECT CASE WHEN sum(wt) IS NULL OR sum(wt)=0 THEN NULL ELSE sum(val * wt)/sum(wt) END INTO v_vibe FROM w;

  WITH w AS (
    SELECT coffee_style::numeric AS val, exp(-(EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 30.0) AS wt
    FROM public.experience_logs WHERE shop_id = p_shop_id AND coffee_style IS NOT NULL
  ) SELECT CASE WHEN sum(wt) IS NULL OR sum(wt)=0 THEN NULL ELSE sum(val * wt)/sum(wt) END INTO v_coffee FROM w;

  WITH w AS (
    SELECT specialty_drink::numeric AS val, exp(-(EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 30.0) AS wt
    FROM public.experience_logs WHERE shop_id = p_shop_id AND specialty_drink IS NOT NULL
  ) SELECT CASE WHEN sum(wt) IS NULL OR sum(wt)=0 THEN NULL ELSE sum(val * wt)/sum(wt) END INTO v_specialty FROM w;

  WITH w AS (
    SELECT matcha_profile::numeric AS val, exp(-(EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 30.0) AS wt
    FROM public.experience_logs WHERE shop_id = p_shop_id AND matcha_profile IS NOT NULL
  ) SELECT CASE WHEN sum(wt) IS NULL OR sum(wt)=0 THEN NULL ELSE sum(val * wt)/sum(wt) END INTO v_matcha FROM w;

  WITH w AS (
    SELECT pastry_craft::numeric AS val, exp(-(EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 30.0) AS wt
    FROM public.experience_logs WHERE shop_id = p_shop_id AND pastry_craft IS NOT NULL
  ) SELECT CASE WHEN sum(wt) IS NULL OR sum(wt)=0 THEN NULL ELSE sum(val * wt)/sum(wt) END INTO v_pastry FROM w;

  WITH w AS (
    SELECT parking_ease::numeric AS val, exp(-(EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 30.0) AS wt
    FROM public.experience_logs WHERE shop_id = p_shop_id AND parking_ease IS NOT NULL
  ) SELECT CASE WHEN sum(wt) IS NULL OR sum(wt)=0 THEN NULL ELSE sum(val * wt)/sum(wt) END INTO v_parking FROM w;

  WITH w AS (
    SELECT laptop_friendly::numeric AS val, exp(-(EXTRACT(EPOCH FROM (now() - created_at)) / 86400.0) / 30.0) AS wt
    FROM public.experience_logs WHERE shop_id = p_shop_id AND laptop_friendly IS NOT NULL
  ) SELECT CASE WHEN sum(wt) IS NULL OR sum(wt)=0 THEN NULL ELSE sum(val * wt)/sum(wt) END INTO v_laptop FROM w;

  -- Upsert into shop_aggregates
  INSERT INTO public.shop_aggregates (
    shop_id, log_count,
    avg_overall_quality, nps_score, nps_normalized, drip_score,
    avg_vibe_energy, avg_coffee_style, avg_specialty_drink, avg_matcha_profile, avg_pastry_craft,
    avg_parking_ease, avg_laptop_friendly,
    updated_at
  ) VALUES (
    p_shop_id, v_log_count,
    round(v_avg_overall, 2), round(v_nps, 2), round(v_nps_norm, 2), round(v_drip, 2),
    round(v_vibe, 2), round(v_coffee, 2), round(v_specialty, 2), round(v_matcha, 2), round(v_pastry, 2),
    round(v_parking, 2), round(v_laptop, 2),
    now()
  )
  ON CONFLICT (shop_id) DO UPDATE SET
    log_count = excluded.log_count,
    avg_overall_quality = excluded.avg_overall_quality,
    nps_score = excluded.nps_score,
    nps_normalized = excluded.nps_normalized,
    drip_score = excluded.drip_score,
    avg_vibe_energy = excluded.avg_vibe_energy,
    avg_coffee_style = excluded.avg_coffee_style,
    avg_specialty_drink = excluded.avg_specialty_drink,
    avg_matcha_profile = excluded.avg_matcha_profile,
    avg_pastry_craft = excluded.avg_pastry_craft,
    avg_parking_ease = excluded.avg_parking_ease,
    avg_laptop_friendly = excluded.avg_laptop_friendly,
    updated_at = now();

END;
$$;
