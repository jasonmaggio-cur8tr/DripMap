-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.claim_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  shop_id uuid NOT NULL,
  user_id uuid NOT NULL,
  business_email text NOT NULL,
  role text NOT NULL,
  social_link text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT claim_requests_pkey PRIMARY KEY (id),
  CONSTRAINT claim_requests_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id),
  CONSTRAINT claim_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL,
  email text NOT NULL,
  avatar_url text,
  bio text,
  instagram text,
  x text,
  is_business_owner boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_admin boolean DEFAULT false,
  is_pro boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  shop_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.saved_shops (
  user_id uuid NOT NULL,
  shop_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_shops_pkey PRIMARY KEY (user_id, shop_id),
  CONSTRAINT saved_shops_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT saved_shops_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);
CREATE TABLE public.shop_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  shop_id uuid NOT NULL,
  url text NOT NULL,
  type text DEFAULT 'community'::text CHECK (type = ANY (ARRAY['owner'::text, 'community'::text])),
  caption text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shop_images_pkey PRIMARY KEY (id),
  CONSTRAINT shop_images_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id),
  CONSTRAINT shop_images_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.shops (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  vibes ARRAY DEFAULT '{}'::text[],
  cheeky_vibes ARRAY DEFAULT '{}'::text[],
  rating numeric DEFAULT 0.0,
  review_count integer DEFAULT 0,
  is_claimed boolean DEFAULT false,
  claimed_by uuid,
  stamp_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subscription_tier text DEFAULT 'free'::text,
  CONSTRAINT shops_pkey PRIMARY KEY (id),
  CONSTRAINT shops_claimed_by_fkey FOREIGN KEY (claimed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_follows (
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id),
  CONSTRAINT user_follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.visited_shops (
  user_id uuid NOT NULL,
  shop_id uuid NOT NULL,
  visited_at timestamp with time zone DEFAULT now(),
  CONSTRAINT visited_shops_pkey PRIMARY KEY (user_id, shop_id),
  CONSTRAINT visited_shops_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT visited_shops_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id)
);