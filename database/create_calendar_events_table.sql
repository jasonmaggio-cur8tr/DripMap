-- Migration: Create calendar_events table
-- Run this in Supabase SQL Editor

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  event_type text NOT NULL,
  start_date_time timestamp with time zone NOT NULL,
  end_date_time timestamp with time zone NOT NULL,
  location text,
  ticket_link text,
  cover_image_url text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_shop_id ON public.calendar_events(shop_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON public.calendar_events(start_date_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_is_published ON public.calendar_events(is_published);

-- Enable Row Level Security
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can view published events
CREATE POLICY "Anyone can view published events"
ON public.calendar_events
FOR SELECT
USING (is_published = true);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Shop owners can view their own events
CREATE POLICY "Shop owners can view their events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
);

-- Shop owners can insert events for their shops
CREATE POLICY "Shop owners can insert events"
ON public.calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
);

-- Shop owners can update their own events
CREATE POLICY "Shop owners can update their events"
ON public.calendar_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
);

-- Shop owners can delete their own events
CREATE POLICY "Shop owners can delete their events"
ON public.calendar_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
);

-- Admins can do everything
CREATE POLICY "Admins can manage all events"
ON public.calendar_events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add comments for documentation
COMMENT ON TABLE public.calendar_events IS 'Calendar events for shops - tastings, workshops, community gatherings';
COMMENT ON COLUMN public.calendar_events.shop_id IS 'Shop hosting the event';
COMMENT ON COLUMN public.calendar_events.event_type IS 'Type of event: Tasting, Workshop, Pop-up, Community, Active, Music, Other';
COMMENT ON COLUMN public.calendar_events.is_published IS 'Whether event is visible to public';
