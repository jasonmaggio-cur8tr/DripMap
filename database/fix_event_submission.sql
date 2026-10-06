-- Fix Event Submission & RLS
-- Add missing columns and enable authenticated users to suggest events

-- 1. Add missing columns
ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 2. Add index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON public.calendar_events(created_by);

-- 3. Fix RLS Policies

-- Allow authenticated users to insert events (Suggest Event feature)
-- This allows any logged-in user to submit an event
CREATE POLICY "Authenticated users can insert events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to view their own events (even if pending)
-- This ensures they don't get an error immediately after submission (when app tries to select the new row)
CREATE POLICY "Users can view their own events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);

-- Note: existing policies for Admins and Shop Owners should still hold valid.
-- "Admins can manage all events" covers everything.
-- "Shop owners can insert events" is now redundant but harmless.
