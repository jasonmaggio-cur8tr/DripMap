-- 009: schedule the agent-uploads cleanup to run automatically (weekly)
--
-- This turns the manual "Clean Up Orphaned Uploads" admin button into a real
-- scheduled job. pg_cron fires an HTTP POST to the cleanup-agent-uploads edge
-- function, authenticating with the x-cron-secret header (the function accepts
-- this as an alternative to an admin JWT).
--
-- Secrets are read from Supabase Vault so nothing sensitive lives in git.
-- Before/after running this migration, create the two Vault secrets ONCE
-- (run in the SQL editor, substituting the real values — do NOT commit them):
--
--   select vault.create_secret(
--     'https://zxetnactllyzslievgxj.supabase.co/functions/v1/cleanup-agent-uploads',
--     'cleanup_cron_url');
--   select vault.create_secret('<the CRON_SECRET value>', 'cleanup_cron_secret');
--
-- The CRON_SECRET value must match the edge function secret set via:
--   supabase secrets set CRON_SECRET=<value>

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Replace any prior definition so this migration is re-runnable.
select cron.unschedule('cleanup-agent-uploads-weekly')
where exists (
  select 1 from cron.job where jobname = 'cleanup-agent-uploads-weekly'
);

select cron.schedule(
  'cleanup-agent-uploads-weekly',
  '0 8 * * 0', -- Sundays at 08:00 UTC
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'cleanup_cron_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cleanup_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
