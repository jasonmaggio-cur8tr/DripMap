-- 1. Experience Logs Table
create table if not exists public.experience_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,

  -- Required
  overall_quality int not null check (overall_quality between 0 and 100),
  bring_friend_score int not null check (bring_friend_score between 0 and 10),

  -- Optional sliders (NULL means "not provided")
  vibe_energy int null check (vibe_energy between 0 and 100),
  coffee_style int null check (coffee_style between 0 and 100),
  specialty_drink int null check (specialty_drink between 0 and 100),
  matcha_profile int null check (matcha_profile between 0 and 100),
  pastry_craft int null check (pastry_craft between 0 and 100),
  parking_ease int null check (parking_ease between 0 and 100),
  laptop_friendly int null check (laptop_friendly between 0 and 100),

  -- Text
  quick_take varchar(140) null,
  -- private_feedback moved to separate table per spec

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One log per user per shop (editable)
  constraint experience_logs_shop_user_unique unique (shop_id, user_id)
);

-- Indexes
create index if not exists experience_logs_shop_id_idx on public.experience_logs(shop_id);
create index if not exists experience_logs_user_id_idx on public.experience_logs(user_id);
create index if not exists experience_logs_created_at_idx on public.experience_logs(created_at);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_experience_logs_updated_at on public.experience_logs;
create trigger set_experience_logs_updated_at
before update on public.experience_logs
for each row execute function public.set_updated_at();


-- 2. Shop Aggregates Table
create table if not exists public.shop_aggregates (
  shop_id uuid primary key references public.shops(id) on delete cascade,
  
  log_count int not null default 0,
  
  -- Weighted averages (0-100); NULL if insufficient data
  avg_overall_quality numeric(6,2) null,
  nps_score numeric(6,2) null,              -- raw NPS in [-100, 100]
  nps_normalized numeric(6,2) null,         -- 0..100
  drip_score numeric(6,2) null,             -- 0..100
  
  avg_vibe_energy numeric(6,2) null,
  avg_coffee_style numeric(6,2) null,
  avg_specialty_drink numeric(6,2) null,
  avg_matcha_profile numeric(6,2) null,
  avg_pastry_craft numeric(6,2) null,
  avg_parking_ease numeric(6,2) null,
  avg_laptop_friendly numeric(6,2) null,

  -- Dominant trait helpers
  trait_1 text null,
  trait_2 text null,
  
  updated_at timestamptz not null default now()
);

create index if not exists shop_aggregates_drip_score_idx on public.shop_aggregates(drip_score desc);


-- 3. Recompute Aggregates Function (Time Decay + Confidence)
create or replace function public.recompute_shop_aggregates(p_shop_id uuid)
returns void language plpgsql as $$
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


-- 4. Trigger for Auto-Update
create or replace function public.trigger_recompute_shop_aggregates()
returns trigger language plpgsql as $$
declare
  v_shop_id uuid;
begin
  v_shop_id := coalesce(new.shop_id, old.shop_id);
  perform public.recompute_shop_aggregates(v_shop_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists experience_logs_recompute_ins on public.experience_logs;
drop trigger if exists experience_logs_recompute_upd on public.experience_logs;
drop trigger if exists experience_logs_recompute_del on public.experience_logs;

create trigger experience_logs_recompute_ins
after insert on public.experience_logs
for each row execute function public.trigger_recompute_shop_aggregates();

create trigger experience_logs_recompute_upd
after update on public.experience_logs
for each row execute function public.trigger_recompute_shop_aggregates();

create trigger experience_logs_recompute_del
after delete on public.experience_logs
for each row execute function public.trigger_recompute_shop_aggregates();


-- 5. RLS Policies
alter table public.experience_logs enable row level security;
alter table public.shop_aggregates enable row level security;

-- Everyone can read aggregates
create policy "Allow public read access on aggregates"
  on public.shop_aggregates for select using (true);

-- Everyone can read stats/logs (public metadata)
create policy "Allow public read access on logs"
  on public.experience_logs for select using (true);

-- Authenticated users can insert their own logs
create policy "Allow auth users to insert logs"
  on public.experience_logs for insert
  with check (auth.uid() = user_id);

-- Users can update their own logs
create policy "Allow users to update own logs"
  on public.experience_logs for update
  using (auth.uid() = user_id);

-- Users can delete their own logs
create policy "Allow users to delete own logs"
  on public.experience_logs for delete
  using (auth.uid() = user_id);


-- 6. Private Feedback Table (Separate)
create table if not exists public.private_shop_feedback (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  experience_log_id uuid null references public.experience_logs(id) on delete set null,
  feedback text not null,
  created_at timestamptz not null default now()
);

alter table public.private_shop_feedback enable row level security;

-- Users can insert their own private feedback
create policy "insert own private feedback"
  on public.private_shop_feedback for insert
  with check (auth.uid() = user_id);

-- Users can read only their own private feedback (not public)
create policy "read own private feedback"
  on public.private_shop_feedback for select
  using (auth.uid() = user_id);

-- Shop owners/Admins policy would be added here in future (e.g. read if shop_id in my_shops)
