-- ============================================================
-- 006: Gamified Monthly Leaderboards (MVP — Phase 1)
-- Per docs/gamified-leaderboards-proposal.md
--
-- Adds:
--   1. badge_definitions  (static catalog; MVP seeds 3 badges)
--   2. monthly_shop_stats / monthly_user_stats (computed monthly slices)
--   3. refresh_monthly_stats()  — idempotent, re-runnable
--   4. badge_awards        (one winner per badge per month)
--   5. award_monthly_badges() — manual month-end run (no cron in MVP)
--
-- To apply: paste into the Supabase SQL editor and run.
-- Month-end (1st of each month), run manually:
--   SELECT public.refresh_monthly_stats();      -- refresh live month any time
--   SELECT public.award_monthly_badges();       -- crown last month's winners
-- Both are idempotent and safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. badge_definitions (static catalog)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  slug        TEXT PRIMARY KEY,          -- 'matcha_monarch'
  name        TEXT NOT NULL,             -- 'Matcha Monarch'
  emoji       TEXT NOT NULL,             -- '🍵'
  description TEXT NOT NULL,             -- 'Visited the most matcha spots this month'
  scope       TEXT NOT NULL CHECK (scope IN ('user','shop')),
  min_value   INTEGER NOT NULL DEFAULT 1,
  is_active   BOOLEAN NOT NULL DEFAULT true
);
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view badge definitions" ON public.badge_definitions;
CREATE POLICY "Anyone can view badge definitions"
  ON public.badge_definitions FOR SELECT USING (true);

-- MVP seed: 3 badges (full ~10-badge set lands in Phase 2)
INSERT INTO public.badge_definitions (slug, name, emoji, description, scope, min_value) VALUES
  ('matcha_monarch',  'Matcha Monarch',  '🍵', 'Visited the most matcha spots this month',      'user', 3),
  ('certified_yapper','Certified Yapper','📝', 'Submitted the most experience logs this month', 'user', 4),
  ('most_logged',     'Most Logged',     '📓', 'The most-logged shop this month',               'shop', 1)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Monthly stats tables (computed from raw timestamped tables)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_shop_stats (
  shop_id      UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  month_start  DATE NOT NULL,            -- e.g. 2026-07-01
  logs_count   INTEGER NOT NULL DEFAULT 0,
  dates_count  INTEGER NOT NULL DEFAULT 0,
  saves_count  INTEGER NOT NULL DEFAULT 0,
  pourn_likes_count INTEGER NOT NULL DEFAULT 0,
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id, month_start)
);

CREATE TABLE IF NOT EXISTS public.monthly_user_stats (
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_start  DATE NOT NULL,
  logs_count   INTEGER NOT NULL DEFAULT 0,
  matcha_shops_count   INTEGER NOT NULL DEFAULT 0,
  drip_likes_received  INTEGER NOT NULL DEFAULT 0,
  dates_created        INTEGER NOT NULL DEFAULT 0,
  shops_visited        INTEGER NOT NULL DEFAULT 0,
  engagement_given     INTEGER NOT NULL DEFAULT 0,  -- likes+comments given
  month_points         INTEGER NOT NULL DEFAULT 0,  -- SUM(user_points) in month
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, month_start)
);

ALTER TABLE public.monthly_shop_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_user_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view monthly shop stats" ON public.monthly_shop_stats;
DROP POLICY IF EXISTS "Anyone can view monthly user stats" ON public.monthly_user_stats;
CREATE POLICY "Anyone can view monthly shop stats" ON public.monthly_shop_stats FOR SELECT USING (true);
CREATE POLICY "Anyone can view monthly user stats" ON public.monthly_user_stats FOR SELECT USING (true);
-- writes: SECURITY DEFINER functions only, no insert/update policies

-- ------------------------------------------------------------
-- 3. Refresh function (idempotent; defaults to the live month)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_monthly_stats(p_month DATE DEFAULT date_trunc('month', NOW())::date)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  m_start TIMESTAMPTZ := p_month;
  m_end   TIMESTAMPTZ := p_month + INTERVAL '1 month';
BEGIN
  -- SHOPS ---------------------------------------------------------------
  INSERT INTO public.monthly_shop_stats
    (shop_id, month_start, logs_count, dates_count, saves_count, pourn_likes_count, computed_at)
  SELECT s.id, p_month,
    COALESCE(el.c,0), COALESCE(cd.c,0), COALESCE(sv.c,0), COALESCE(pl.c,0), NOW()
  FROM public.shops s
  LEFT JOIN (SELECT shop_id, COUNT(*) c FROM public.experience_logs
             WHERE created_at >= m_start AND created_at < m_end GROUP BY shop_id) el ON el.shop_id = s.id
  LEFT JOIN (SELECT shop_id, COUNT(*) c FROM public.coffee_dates
             WHERE created_at >= m_start AND created_at < m_end GROUP BY shop_id) cd ON cd.shop_id = s.id
  LEFT JOIN (SELECT shop_id, COUNT(*) c FROM public.saved_shops
             WHERE created_at >= m_start AND created_at < m_end GROUP BY shop_id) sv ON sv.shop_id = s.id
  LEFT JOIN (SELECT p.shop_id, COUNT(*) c FROM public.pourn_likes l
             JOIN public.pourns p ON p.id = l.pourn_id
             WHERE l.created_at >= m_start AND l.created_at < m_end AND p.shop_id IS NOT NULL
             GROUP BY p.shop_id) pl ON pl.shop_id = s.id
  WHERE COALESCE(el.c,0)+COALESCE(cd.c,0)+COALESCE(sv.c,0)+COALESCE(pl.c,0) > 0
  ON CONFLICT (shop_id, month_start) DO UPDATE SET
    logs_count = EXCLUDED.logs_count, dates_count = EXCLUDED.dates_count,
    saves_count = EXCLUDED.saves_count, pourn_likes_count = EXCLUDED.pourn_likes_count,
    computed_at = NOW();

  -- USERS ---------------------------------------------------------------
  INSERT INTO public.monthly_user_stats
    (user_id, month_start, logs_count, matcha_shops_count, drip_likes_received,
     dates_created, shops_visited, engagement_given, month_points, computed_at)
  SELECT pr.id, p_month,
    COALESCE(el.c,0), COALESCE(ma.c,0), COALESCE(lr.c,0),
    COALESCE(dc.c,0), COALESCE(vs.c,0), COALESCE(eg.c,0), COALESCE(pt.c,0), NOW()
  FROM public.profiles pr
  LEFT JOIN (SELECT user_id, COUNT(*) c FROM public.experience_logs
             WHERE created_at >= m_start AND created_at < m_end GROUP BY user_id) el ON el.user_id = pr.id
  LEFT JOIN (SELECT v.user_id, COUNT(DISTINCT v.shop_id) c FROM public.visited_shops v
             JOIN public.shops s ON s.id = v.shop_id
             WHERE v.visited_at >= m_start AND v.visited_at < m_end
               AND EXISTS (SELECT 1 FROM unnest(s.vibes) vb WHERE vb ILIKE '%matcha%')
             GROUP BY v.user_id) ma ON ma.user_id = pr.id
  LEFT JOIN (SELECT p.user_id, COUNT(*) c FROM public.pourn_likes l
             JOIN public.pourns p ON p.id = l.pourn_id
             WHERE l.created_at >= m_start AND l.created_at < m_end GROUP BY p.user_id) lr ON lr.user_id = pr.id
  LEFT JOIN (SELECT created_by, COUNT(*) c FROM public.coffee_dates
             WHERE created_at >= m_start AND created_at < m_end GROUP BY created_by) dc ON dc.created_by = pr.id
  LEFT JOIN (SELECT user_id, COUNT(DISTINCT shop_id) c FROM public.visited_shops
             WHERE visited_at >= m_start AND visited_at < m_end GROUP BY user_id) vs ON vs.user_id = pr.id
  LEFT JOIN (SELECT user_id, COUNT(*) c FROM (
               SELECT user_id, created_at FROM public.pourn_likes
               UNION ALL
               SELECT user_id, created_at FROM public.pourn_comments
             ) x WHERE created_at >= m_start AND created_at < m_end GROUP BY user_id) eg ON eg.user_id = pr.id
  LEFT JOIN (SELECT user_id, SUM(points) c FROM public.user_points
             WHERE created_at >= m_start AND created_at < m_end GROUP BY user_id) pt ON pt.user_id = pr.id
  WHERE COALESCE(el.c,0)+COALESCE(ma.c,0)+COALESCE(lr.c,0)+COALESCE(dc.c,0)
       +COALESCE(vs.c,0)+COALESCE(eg.c,0)+COALESCE(pt.c,0) > 0
  ON CONFLICT (user_id, month_start) DO UPDATE SET
    logs_count = EXCLUDED.logs_count, matcha_shops_count = EXCLUDED.matcha_shops_count,
    drip_likes_received = EXCLUDED.drip_likes_received, dates_created = EXCLUDED.dates_created,
    shops_visited = EXCLUDED.shops_visited, engagement_given = EXCLUDED.engagement_given,
    month_points = EXCLUDED.month_points, computed_at = NOW();
END; $$;

-- If matcha detection via shops.vibes proves too sparse, fall back to
-- experience_logs.matcha_profile IS NOT NULL — one-line swap in the `ma` subquery.

-- ------------------------------------------------------------
-- 4. badge_awards (one winner per badge per month)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.badge_awards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_slug  TEXT NOT NULL REFERENCES public.badge_definitions(slug),
  month_start DATE NOT NULL,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,  -- user badges
  shop_id     UUID REFERENCES public.shops(id) ON DELETE CASCADE,     -- shop badges
  value       INTEGER NOT NULL,          -- the winning number (e.g. 7 matcha shops)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (badge_slug, month_start),      -- one winner per badge per month
  CHECK (user_id IS NOT NULL OR shop_id IS NOT NULL)
);
ALTER TABLE public.badge_awards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view badge awards" ON public.badge_awards;
CREATE POLICY "Anyone can view badge awards" ON public.badge_awards FOR SELECT USING (true);

-- Keep leaderboard_history untouched (profiles already read it);
-- badge_awards is the new system.

-- ------------------------------------------------------------
-- 5. Month-end awarding (MVP: run manually on the 1st; idempotent)
--    Phase 2 adds the remaining user/shop badge branches + pg_cron.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_monthly_badges()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  prev_month DATE := date_trunc('month', NOW() - INTERVAL '1 month')::date;
BEGIN
  PERFORM public.refresh_monthly_stats(prev_month);  -- final freeze

  -- USER BADGES: one row per badge = winner-take-the-crown
  INSERT INTO public.badge_awards (badge_slug, month_start, user_id, value)
  SELECT w.slug, prev_month, w.user_id, w.val FROM (
    SELECT 'matcha_monarch' AS slug, user_id, matcha_shops_count AS val,
           ROW_NUMBER() OVER (ORDER BY matcha_shops_count DESC, computed_at ASC) rn
      FROM public.monthly_user_stats
      WHERE month_start = prev_month AND matcha_shops_count >= 3
    UNION ALL
    SELECT 'certified_yapper', user_id, logs_count,
           ROW_NUMBER() OVER (ORDER BY logs_count DESC, computed_at ASC)
      FROM public.monthly_user_stats
      WHERE month_start = prev_month AND logs_count >= 4
  ) w WHERE w.rn = 1
  ON CONFLICT (badge_slug, month_start) DO NOTHING;   -- safe to re-run

  -- SHOP BADGES
  INSERT INTO public.badge_awards (badge_slug, month_start, shop_id, value)
  SELECT w.slug, prev_month, w.shop_id, w.val FROM (
    SELECT 'most_logged' AS slug, shop_id, logs_count AS val,
           ROW_NUMBER() OVER (ORDER BY logs_count DESC, computed_at ASC) rn
      FROM public.monthly_shop_stats WHERE month_start = prev_month AND logs_count >= 1
  ) w WHERE w.rn = 1
  ON CONFLICT (badge_slug, month_start) DO NOTHING;

  -- Notify user winners (existing notifications pipeline handles push)
  INSERT INTO public.notifications (user_id, type, entity_id, is_read)
  SELECT ba.user_id, 'badge', ba.id, false
  FROM public.badge_awards ba
  WHERE ba.month_start = prev_month AND ba.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.type = 'badge' AND n.entity_id = ba.id AND n.user_id = ba.user_id
    );
END; $$;
