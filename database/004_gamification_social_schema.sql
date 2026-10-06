-- ==============================================================================
-- DRIPMAP GAMIFICATION & SOCIAL SCHEMA
-- ==============================================================================

-- 1. User Points Table
CREATE TABLE IF NOT EXISTS public.user_points (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    points INTEGER NOT NULL,
    target_id UUID, -- Optional ID for the entity (e.g., shop_id, log_id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for user_points
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
-- Points should only be inserted by trusted backend/RPC functions to prevent tampering, but for MVP we might allow authenticated inserts:
CREATE POLICY "Users can insert points" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. User Relationships (Follower/Following)
CREATE TABLE IF NOT EXISTS public.user_follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- RLS for user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view relationships" ON public.user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage their follows" ON public.user_follows FOR ALL USING (auth.uid() = follower_id);

-- 3. Experience Log Likes
CREATE TABLE IF NOT EXISTS public.experience_log_likes (
    log_id UUID REFERENCES public.experience_logs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (log_id, user_id)
);

-- RLS for experience_log_likes
ALTER TABLE public.experience_log_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view likes" ON public.experience_log_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their likes" ON public.experience_log_likes FOR ALL USING (auth.uid() = user_id);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- receiver
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- sender
    type TEXT NOT NULL, -- 'like', 'follow', 'badge'
    entity_id UUID, -- reference to log_id or badge_id
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update their own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- 5. Leaderboard History
CREATE TABLE IF NOT EXISTS public.leaderboard_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    rank INTEGER NOT NULL,
    title TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for leaderboard_history
ALTER TABLE public.leaderboard_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leaderboard history" ON public.leaderboard_history FOR SELECT USING (true);
-- Only admin/system should insert into leaderboard_history

-- ==============================================================================
-- VIEWS & RPCs for GAMIFICATION
-- ==============================================================================

-- Create a View for User Total Points (Drip Score)
CREATE OR REPLACE VIEW public.user_drip_scores AS
SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    COALESCE(SUM(up.points), 0) as total_score
FROM 
    public.profiles p
LEFT JOIN 
    public.user_points up ON p.id = up.user_id
GROUP BY 
    p.id, p.username, p.avatar_url;
