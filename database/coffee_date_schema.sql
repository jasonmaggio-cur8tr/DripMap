-- Coffee Date MVP Schema

-- 1. Coffee Dates Table
CREATE TABLE IF NOT EXISTS public.coffee_dates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  shop_id uuid NOT NULL REFERENCES public.shops(id),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  starts_at timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 60,
  timezone text,
  tone_preset text, -- 'talk_shop', 'study', 'meet_up', 'custom'
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'canceled')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coffee_dates_pkey PRIMARY KEY (id)
);

-- 2. Coffee Date Invites Table
CREATE TABLE IF NOT EXISTS public.coffee_date_invites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  coffee_date_id uuid NOT NULL REFERENCES public.coffee_dates(id) ON DELETE CASCADE,
  invite_type text NOT NULL CHECK (invite_type IN ('user', 'email', 'phone')),
  invitee_user_id uuid REFERENCES auth.users(id), -- Nullable if email/phone invite
  invitee_email text,
  invitee_phone text,
  invite_status text DEFAULT 'sent' CHECK (invite_status IN ('sent', 'accepted', 'declined', 'bounced')),
  invite_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'), -- Simple token for link
  responded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coffee_date_invites_pkey PRIMARY KEY (id)
);

-- 3. RLS Policies

-- Enable RLS
ALTER TABLE public.coffee_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_date_invites ENABLE ROW LEVEL SECURITY;

-- Coffee Dates Policies
-- View: Creator can view own.
CREATE POLICY "Creators can view their own coffee dates"
ON public.coffee_dates FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Insert: Authenticated users can create.
CREATE POLICY "Authenticated users can create coffee dates"
ON public.coffee_dates FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Update: Creator can update.
CREATE POLICY "Creators can update their own coffee dates"
ON public.coffee_dates FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- Delete: Creator can cancel/delete.
CREATE POLICY "Creators can delete their own coffee dates"
ON public.coffee_dates FOR DELETE
TO authenticated
USING (created_by = auth.uid());


-- Coffee Date Invites Policies
-- View: Creator of the DATE can view invites.
CREATE POLICY "Creators can view invites for their dates"
ON public.coffee_date_invites FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coffee_dates
    WHERE coffee_dates.id = coffee_date_invites.coffee_date_id
    AND coffee_dates.created_by = auth.uid()
  )
);

-- View: Invitee (if user_id matches) can view.
CREATE POLICY "Invitees can view their own invites"
ON public.coffee_date_invites FOR SELECT
TO authenticated
USING (invitee_user_id = auth.uid());

-- Insert: Creator of the DATE can insert invites.
CREATE POLICY "Creators can insert invites"
ON public.coffee_date_invites FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.coffee_dates
    WHERE coffee_dates.id = coffee_date_invites.coffee_date_id
    AND coffee_dates.created_by = auth.uid()
  )
);

-- Update: Invitee can update status (accept/decline).
-- This is tricky if they are accepting via public token link (unauthenticated).
-- For MVP, maybe we assume they log in OR we use a separate function for public acceptance.
-- If logged in:
CREATE POLICY "Invitees can update their own invite status"
ON public.coffee_date_invites FOR UPDATE
TO authenticated
USING (invitee_user_id = auth.uid())
WITH CHECK (invitee_user_id = auth.uid());

-- Note: Public acceptance via token will likely need a Database Function with `SECURITY DEFINER` to bypass RLS,
-- or we rely on the user being logged in for the MVP as per "Simpler" path.
-- Let's add a policy for the "public" token access if we go that route, but typically RLS relies on auth.uid().
-- We will stick to `SECURITY DEFINER` function for the token acceptance flow if needed.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coffee_dates_created_by ON public.coffee_dates(created_by);
CREATE INDEX IF NOT EXISTS idx_coffee_dates_shop_id ON public.coffee_dates(shop_id);
CREATE INDEX IF NOT EXISTS idx_coffee_date_invites_coffee_date_id ON public.coffee_date_invites(coffee_date_id);
CREATE INDEX IF NOT EXISTS idx_coffee_date_invites_invitee_user_id ON public.coffee_date_invites(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_coffee_date_invites_invite_token ON public.coffee_date_invites(invite_token);
