-- Agent-submitted events: provenance + dedupe
-- Run once in the Supabase SQL Editor.
--
-- The Instagram events agent submits one calendar_events row per saved post.
-- source_instagram_url records which post it came from and makes re-runs idempotent:
-- if the agent's local state file is ever lost, the unique index stops it from
-- creating a second copy of an event it already submitted.

ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS source_instagram_url text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_events_source_instagram_url
ON public.calendar_events (source_instagram_url)
WHERE source_instagram_url IS NOT NULL;
