-- Run this in your Supabase SQL Editor to fix the RLS policies for experience logs

-- 1. Enable RLS on specific tables (just in case they aren't)
ALTER TABLE public.experience_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_shop_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visited_shops ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies to replace them cleanly
DROP POLICY IF EXISTS "Anyone can insert experience logs" ON public.experience_logs;
DROP POLICY IF EXISTS "Users can insert their own experience logs" ON public.experience_logs;
DROP POLICY IF EXISTS "Users can update their own experience logs" ON public.experience_logs;
DROP POLICY IF EXISTS "Anyone can read experience logs" ON public.experience_logs;

DROP POLICY IF EXISTS "Users can insert their own private feedback" ON public.private_shop_feedback;
DROP POLICY IF EXISTS "Shop owners can read private feedback" ON public.private_shop_feedback;

DROP POLICY IF EXISTS "Users can insert their own visited shops" ON public.visited_shops;
DROP POLICY IF EXISTS "Users can read their own visited shops" ON public.visited_shops;

-- 3. Create policies for experience_logs
-- Allow anyone to read all experience logs (they are public)
CREATE POLICY "Anyone can read experience logs"
  ON public.experience_logs FOR SELECT
  USING (true);

-- Allow authenticated users to insert their *own* logs
CREATE POLICY "Users can insert their own experience logs"
  ON public.experience_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their *own* logs
CREATE POLICY "Users can update their own experience logs"
  ON public.experience_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Create policies for private_shop_feedback
-- Allow authenticated users to insert their *own* private feedback
CREATE POLICY "Users can insert their own private feedback"
  ON public.private_shop_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow business owners to read feedback for their claimed shops
CREATE POLICY "Shop owners can read private feedback"
  ON public.private_shop_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shops 
      WHERE shops.id = private_shop_feedback.shop_id 
      AND shops.claimed_by = auth.uid()
    )
  );

-- 5. Create policies for visited_shops
-- Allow authenticated users to insert their *own* visited shops
CREATE POLICY "Users can insert their own visited shops"
  ON public.visited_shops FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their *own* visited shops
CREATE POLICY "Users can read their own visited shops"
  ON public.visited_shops FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anyone to update their own visited shops (due to upsert conflict clause in DB service)
CREATE POLICY "Users can update their own visited shops"
  ON public.visited_shops FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

RAISE NOTICE 'Successfully updated RLS policies for experience_logs, private_shop_feedback, and visited_shops';
