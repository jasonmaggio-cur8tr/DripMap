-- Add sort_order column to shop_images table
ALTER TABLE public.shop_images 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Optional: Update existing images to have a default sort order based on creation time
-- This ensures a stable initial order
WITH ordered_images AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY shop_id ORDER BY created_at ASC) as rn
  FROM public.shop_images
)
UPDATE public.shop_images
SET sort_order = ordered_images.rn
FROM ordered_images
WHERE public.shop_images.id = ordered_images.id;
