-- 1. DROP THE DANGEROUS TRIGGER
-- The trigger was causing an infinite loop/deadlock because updating auth.users triggers public.profiles, which triggers auth.users again!
DROP TRIGGER IF EXISTS trigger_update_password_from_profile ON public.profiles;

-- 2. KILL THE STUCK PROCESSES
-- This will automatically terminate any Postgres operations that are currently stuck or deadlocked
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' 
  AND pid <> pg_backend_pid()
  AND query ILIKE '%public.update_password_from_profile%';

-- 3. In case the above misses it, we will kill any queries that have been running for more than 5 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active' 
  AND pid <> pg_backend_pid()
  AND now() - query_start > interval '5 minutes';
