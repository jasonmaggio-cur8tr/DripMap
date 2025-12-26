-- Fix RLS policies for calendar_events to allow admin inserts
-- Run this in Supabase SQL Editor

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view published events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can view all events" ON calendar_events;
DROP POLICY IF EXISTS "Shop owners can view their events" ON calendar_events;
DROP POLICY IF EXISTS "Shop owners can insert events" ON calendar_events;
DROP POLICY IF EXISTS "Shop owners can update their events" ON calendar_events;
DROP POLICY IF EXISTS "Shop owners can delete their events" ON calendar_events;
DROP POLICY IF EXISTS "Admins can manage all events" ON calendar_events;

-- SELECT Policies
CREATE POLICY "Anyone can view published events"
ON calendar_events FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can view all events"
ON calendar_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Shop owners can view their events"
ON calendar_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
);

-- INSERT Policies
CREATE POLICY "Admins can insert events"
ON calendar_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Shop owners can insert events"
ON calendar_events FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
);

-- UPDATE Policies
CREATE POLICY "Admins can update events"
ON calendar_events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Shop owners can update their events"
ON calendar_events FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
);

-- DELETE Policies
CREATE POLICY "Admins can delete events"
ON calendar_events FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Shop owners can delete their events"
ON calendar_events FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM shops
    WHERE shops.id = calendar_events.shop_id
    AND shops.claimed_by = auth.uid()
  )
);
