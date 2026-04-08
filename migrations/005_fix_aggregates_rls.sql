-- Fix RLS issue where users cannot update aggregates via trigger
-- We need to make the function SECURITY DEFINER so it runs with creator privileges
-- independent of the calling user's RLS restrictions on shop_aggregates

create or replace function public.recompute_shop_aggregates(p_shop_id uuid)
returns void
language plpgsql
security definer -- <--- THIS IS THE FIX
as $$
declare
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

begin
  -- Count logs
  select count(*) into v_log_count
  from public.experience_logs
  where shop_id = p_shop_id;

  -- If no logs, clear aggregates row
  if v_log_count = 0 then
    insert into public.shop_aggregates(shop_id, log_count, updated_at)
    values (p_shop_id, 0, now())
    on conflict (shop_id) do update
      set log_count = 0,
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
    return;
  end if;

  -- Weighted overall_quality average (Time Decay: 90 days)
  with w as (
    select
      overall_quality::numeric as val,
      1.0 / (1.0 + (extract(epoch from (now() - created_at)) / 86400.0) / 90.0) as wt
    from public.experience_logs
    where shop_id = p_shop_id
  )
  select sum(val * wt) / nullif(sum(wt),0) into v_avg_overall
  from w;

  -- NPS components from bring_friend_score (unweighted counts)
  select
    sum(case when bring_friend_score >= 9 then 1 else 0 end)::numeric,
    sum(case when bring_friend_score <= 6 then 1 else 0 end)::numeric,
    count(*)::numeric
  into v_promoters, v_detractors, v_total
  from public.experience_logs
  where shop_id = p_shop_id;

  v_nps := ((v_promoters / nullif(v_total,0)) * 100.0) - ((v_detractors / nullif(v_total,0)) * 100.0);
  v_nps_norm := (v_nps + 100.0) / 2.0;

  -- Confidence factor
  v_conf := 1.0 - exp(-(v_log_count::numeric) / 15.0);

  -- Base score + drip score
  v_base := (coalesce(v_avg_overall, 0) * 0.5) + (coalesce(v_nps_norm, 0) * 0.5);
  v_drip := greatest(0, least(100, v_base * v_conf));

  -- Helper query for weighted averages of optional dims
  -- Vibe Energy
  with w as (
    select vibe_energy::numeric as val, 1.0 / (1.0 + (extract(epoch from (now() - created_at)) / 86400.0) / 90.0) as wt
    from public.experience_logs where shop_id = p_shop_id and vibe_energy is not null
  ) select case when sum(wt) is null or sum(wt)=0 then null else sum(val * wt)/sum(wt) end into v_vibe from w;

  -- Coffee Style
  with w as (
    select coffee_style::numeric as val, 1.0 / (1.0 + (extract(epoch from (now() - created_at)) / 86400.0) / 90.0) as wt
    from public.experience_logs where shop_id = p_shop_id and coffee_style is not null
  ) select case when sum(wt) is null or sum(wt)=0 then null else sum(val * wt)/sum(wt) end into v_coffee from w;

  -- Specialty Drink
  with w as (
    select specialty_drink::numeric as val, 1.0 / (1.0 + (extract(epoch from (now() - created_at)) / 86400.0) / 90.0) as wt
    from public.experience_logs where shop_id = p_shop_id and specialty_drink is not null
  ) select case when sum(wt) is null or sum(wt)=0 then null else sum(val * wt)/sum(wt) end into v_specialty from w;

  -- Matcha Profile
  with w as (
    select matcha_profile::numeric as val, 1.0 / (1.0 + (extract(epoch from (now() - created_at)) / 86400.0) / 90.0) as wt
    from public.experience_logs where shop_id = p_shop_id and matcha_profile is not null
  ) select case when sum(wt) is null or sum(wt)=0 then null else sum(val * wt)/sum(wt) end into v_matcha from w;

  -- Pastry Craft
  with w as (
    select pastry_craft::numeric as val, 1.0 / (1.0 + (extract(epoch from (now() - created_at)) / 86400.0) / 90.0) as wt
    from public.experience_logs where shop_id = p_shop_id and pastry_craft is not null
  ) select case when sum(wt) is null or sum(wt)=0 then null else sum(val * wt)/sum(wt) end into v_pastry from w;

  -- Parking Ease
  with w as (
    select parking_ease::numeric as val, 1.0 / (1.0 + (extract(epoch from (now() - created_at)) / 86400.0) / 90.0) as wt
    from public.experience_logs where shop_id = p_shop_id and parking_ease is not null
  ) select case when sum(wt) is null or sum(wt)=0 then null else sum(val * wt)/sum(wt) end into v_parking from w;

  -- Laptop Friendly
  with w as (
    select laptop_friendly::numeric as val, 1.0 / (1.0 + (extract(epoch from (now() - created_at)) / 86400.0) / 90.0) as wt
    from public.experience_logs where shop_id = p_shop_id and laptop_friendly is not null
  ) select case when sum(wt) is null or sum(wt)=0 then null else sum(val * wt)/sum(wt) end into v_laptop from w;

  -- Upsert into shop_aggregates
  insert into public.shop_aggregates (
    shop_id, log_count,
    avg_overall_quality, nps_score, nps_normalized, drip_score,
    avg_vibe_energy, avg_coffee_style, avg_specialty_drink, avg_matcha_profile, avg_pastry_craft,
    avg_parking_ease, avg_laptop_friendly,
    updated_at
  ) values (
    p_shop_id, v_log_count,
    round(v_avg_overall, 2), round(v_nps, 2), round(v_nps_norm, 2), round(v_drip, 2),
    round(v_vibe, 2), round(v_coffee, 2), round(v_specialty, 2), round(v_matcha, 2), round(v_pastry, 2),
    round(v_parking, 2), round(v_laptop, 2),
    now()
  )
  on conflict (shop_id) do update set
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

end;
$$;
