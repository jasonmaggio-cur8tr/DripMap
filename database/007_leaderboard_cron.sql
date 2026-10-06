-- ============================================================
-- 007: Automate the monthly leaderboard (Phase 2 — pg_cron)
-- Applied live 2026-07-12. Documents the scheduled jobs added
-- on top of 006_monthly_leaderboards.sql.
--
-- Times are UTC (pg_cron default). "Month" is UTC-defined by
-- refresh_monthly_stats() / award_monthly_badges(). award fires
-- at 09:00 UTC on the 1st (~1-2am Pacific), safely past month end.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Keep the current month's live standings fresh (every 6 hours).
SELECT cron.schedule(
  'refresh-monthly-stats',
  '17 */6 * * *',
  'select public.refresh_monthly_stats();'
);

-- Crown last month's winners on the 1st of each month.
-- (Internally re-freezes last month, awards one winner per badge,
--  and inserts winner notifications. Idempotent — safe to re-run.)
SELECT cron.schedule(
  'award-monthly-badges',
  '0 9 1 * *',
  'select public.award_monthly_badges();'
);

-- To inspect:  SELECT jobname, schedule, active FROM cron.job;
-- To remove :  SELECT cron.unschedule('refresh-monthly-stats');
