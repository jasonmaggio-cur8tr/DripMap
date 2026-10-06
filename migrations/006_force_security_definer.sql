-- Force the function to be SECURITY DEFINER
ALTER FUNCTION public.recompute_shop_aggregates(uuid) SECURITY DEFINER;

-- Ensure the function is owned by postgres (superuser) to bypass RLS
-- (Note: In some Supabase setups, you might need to run this as the dashboard user)
ALTER FUNCTION public.recompute_shop_aggregates(uuid) OWNER TO postgres;

-- Explicitly grant execute usage just in case
GRANT EXECUTE ON FUNCTION public.recompute_shop_aggregates(uuid) TO postgres;
GRANT EXECUTE ON FUNCTION public.recompute_shop_aggregates(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.recompute_shop_aggregates(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_shop_aggregates(uuid) TO service_role;

-- DIAGNOSTIC: Check if it worked
-- Verify prosecdef is true (t)
select proname, prosecdef, proowner::regrole from pg_proc where proname = 'recompute_shop_aggregates';
