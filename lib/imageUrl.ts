/**
 * Rewrite a Supabase Storage public URL to the on-the-fly image transform
 * ("render") endpoint so we deliver appropriately-sized, re-compressed images
 * instead of full-resolution originals. Mirrors lib/imageUrl.ts in the iOS repo.
 *
 * Non-Supabase URLs, already-transformed URLs, or empty values pass through
 * unchanged, so this is safe to wrap around any image source.
 */
export function sizedImageUrl(
  url: string | null | undefined,
  opts: { width: number; quality?: number }
): string | undefined {
  if (!url) return undefined;
  const marker = '/storage/v1/object/public/';
  if (!url.includes(marker)) return url;
  const base = url.replace(marker, '/storage/v1/render/image/public/');
  return `${base}?width=${opts.width}&quality=${opts.quality ?? 70}`;
}
