-- Run this in your Supabase SQL Editor to make chloe.caphe the owner of Chloé Cà Phê

DO $$ 
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
BEGIN
  -- 1. Find the user ID
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE username ILIKE 'chloe.caphe'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User chloe.caphe not found';
  END IF;

  -- 2. Find the shop ID
  SELECT id INTO v_shop_id
  FROM public.shops
  WHERE name ILIKE 'Chloé Cà Phê'
  LIMIT 1;

  IF v_shop_id IS NULL THEN
    RAISE EXCEPTION 'Shop Chloé Cà Phê not found';
  END IF;

  -- 3. Update the shop to set is_claimed and claimed_by
  UPDATE public.shops
  SET is_claimed = true,
      claimed_by = v_user_id
  WHERE id = v_shop_id;

  -- 4. Update the user profile to be a business owner
  UPDATE public.profiles
  SET is_business_owner = true
  WHERE id = v_user_id;

  -- 5. Optional: delete pending claim requests to clean up
  DELETE FROM public.claim_requests
  WHERE shop_id = v_shop_id;

  RAISE NOTICE 'Successfully updated Chloé Cà Phê to be owned by chloe.caphe';
END $$;
