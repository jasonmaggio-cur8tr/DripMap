-- ==============================================================================
-- AUTOMATED MONTHLY LEADERBOARD PROCESSING
-- ==============================================================================

-- This function should be called by a pg_cron job or an external trigger
-- (like a Supabase Edge Function) on the 1st of every month.

CREATE OR REPLACE FUNCTION process_monthly_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_month INTEGER;
    target_year INTEGER;
    start_date TIMESTAMP WITH TIME ZONE;
    end_date TIMESTAMP WITH TIME ZONE;
    winner RECORD;
    current_rank INTEGER := 1;
    badge_title TEXT;
BEGIN
    -- Determine the PREVIOUS month to process
    -- If it's currently March 1st, we want to process February's leaderboard.
    target_month := EXTRACT(MONTH FROM (NOW() - INTERVAL '1 month'));
    target_year := EXTRACT(YEAR FROM (NOW() - INTERVAL '1 month'));

    start_date := DATE_TRUNC('month', NOW() - INTERVAL '1 month');
    end_date := DATE_TRUNC('month', NOW());

    -- Find the Top 3 users for the target month based on points earned THAT month
    FOR winner IN
        SELECT 
            user_id,
            SUM(points) as month_score
        FROM user_points
        WHERE created_at >= start_date AND created_at < end_date
        GROUP BY user_id
        HAVING SUM(points) > 0
        ORDER BY month_score DESC
        LIMIT 3
    LOOP
        -- Determine the badge title based on rank
        IF current_rank = 1 THEN
            badge_title := 'Final Drip Boss';
        ELSIF current_rank = 2 THEN
            badge_title := 'Third Wave Wizard';
        ELSIF current_rank = 3 THEN
            badge_title := 'Crema Commander';
        END IF;

        -- Insert into leaderboard history so the user gets the badge on their profile
        INSERT INTO leaderboard_history (user_id, month, year, rank, title, total_score)
        VALUES (winner.user_id, target_month, target_year, current_rank, badge_title, winner.month_score);

        -- Create a notification for the user telling them they won a leaderboard badge!
        INSERT INTO notifications (user_id, type, is_read)
        VALUES (winner.user_id, 'badge', false);

        current_rank := current_rank + 1;
    END LOOP;

    -- Optional: If DripMap wants points to reset completely every month,
    -- we could delete or archive the `user_points` here.
    -- However, the user's instructions implied keeping a cumulative "Drip Score"
    -- and a separate monthly leaderboard cadence. Leaving the points intact
    -- allows the cumulative Drip Score to grow forever while this function
    -- securely captures the monthly slice.
END;
$$;

-- NOTE: To fully automate this inside Supabase Postgres, you would enable pg_cron:
-- select cron.schedule('process-leaderboard', '0 0 1 * *', 'SELECT process_monthly_leaderboard()');
