import React from 'react';
import { Link } from 'react-router-dom';
import { Shop } from '../../types';
import { sizedImageUrl } from '../../lib/imageUrl';
import { countryFlag } from '../../lib/countryFlag';

// Glass capsule background opacity (Jason's pick 2026-07-11; spec was 0.72).
const CAPSULE_ALPHA = 0.4;

// Dark Roast big shop card (design_handoff_dark_roast/README.md → Screen 1).
// Full-bleed photo, top badge + save heart, bottom glass detail capsule.

const MS_PER_HOUR = 3600_000;

/** "2H" / "5H" / "YESTERDAY" / "3D" — null once older than 7 days. */
export function justAddedLabel(createdAt?: string): string | null {
  if (!createdAt) return null;
  const ageMs = Date.now() - new Date(createdAt).getTime();
  if (Number.isNaN(ageMs) || ageMs < 0) return null;
  const hours = ageMs / MS_PER_HOUR;
  if (hours < 24) return `${Math.max(1, Math.round(hours))}H`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'YESTERDAY';
  if (days < 7) return `${days}D`;
  return null;
}

// Semantic vibe tints (README → Design Tokens). Non-mapped vibes fall back to volt.
const CATEGORY_TINTS: Record<string, { bg: string; text: string }> = {
  Matcha: { bg: 'rgba(220,252,231,0.92)', text: '#166534' },
};

interface DiscoverCardProps {
  shop: Shop;
  isSaved: boolean;
  onToggleSave: () => void;
  distanceMi?: number | null;
  /** When set (filtered feed), show this category badge instead of "Just Added". */
  categoryBadge?: string | null;
  /** Eagerly load the first cards (above the fold); rest lazy-load. */
  eager?: boolean;
  /** Users who saved ("like") this shop — shown as a facepile in the capsule. */
  savers?: { id: string; username: string; avatarUrl?: string }[];
}

const DiscoverCard: React.FC<DiscoverCardProps> = ({ shop, isSaved, onToggleSave, distanceMi, categoryBadge, eager, savers }) => {
  const photo = shop.gallery?.[0]?.url;
  const addedLabel = categoryBadge ? null : justAddedLabel(shop.createdAt);
  const tint = categoryBadge ? CATEGORY_TINTS[categoryBadge] ?? { bg: 'rgba(163,230,53,0.92)', text: '#231b15' } : null;

  const metaParts: string[] = [];
  if (shop.location?.address) metaParts.push(shop.location.address);
  else if (shop.location?.city) metaParts.push(shop.location.city);
  if (distanceMi != null) metaParts.push(`${distanceMi < 10 ? distanceMi.toFixed(1) : Math.round(distanceMi)} mi`);
  else if (shop.location?.address && shop.location?.city) metaParts.push(shop.location.city);

  const vibes = [...(shop.customVibes || []), ...(shop.vibes || [])].slice(0, 3);

  return (
    <Link
      to={`/shop/${shop.slug || shop.id}`}
      className="relative block h-[548px] overflow-hidden rounded-3xl focus:outline-none focus:ring-2 focus:ring-volt-400"
      style={{ background: '#2b221b' }}
    >
      {photo ? (
        <img
          /* width 1080 matches the size pre-warmed on Supabase's CDN (same as iOS) */
          src={sizedImageUrl(photo, { width: 1080, quality: 70 })}
          alt={shop.name}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : undefined}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#2b221b' }}>
          <i className="fas fa-mug-hot text-5xl" style={{ color: 'rgba(243,239,224,0.2)' }}></i>
        </div>
      )}

      {/* Legibility gradient (top + bottom) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(35,27,21,0.55) 0%, rgba(35,27,21,0) 22%, rgba(35,27,21,0) 45%, rgba(35,27,21,0.55) 100%)',
        }}
      ></div>

      {/* Top-left badge */}
      {categoryBadge && tint ? (
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase"
          style={{ background: tint.bg, color: tint.text, letterSpacing: '0.07em' }}
        >
          {categoryBadge}
        </span>
      ) : addedLabel ? (
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase"
          style={{ background: '#a3e635', color: '#231b15', letterSpacing: '0.07em' }}
        >
          <i className="fas fa-bolt"></i>
          Just Added · {addedLabel}
        </span>
      ) : null}

      {/* Save heart */}
      <button
        aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSave();
        }}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-volt-400"
        style={{ background: 'rgba(35,27,21,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <i className={`${isSaved ? 'fas' : 'far'} fa-heart text-lg`} style={{ color: isSaved ? '#a3e635' : '#fff' }}></i>
      </button>

      {/* Glass detail capsule */}
      <div
        className="absolute inset-x-3.5 bottom-3.5 rounded-[20px] border border-white/10 px-[18px] py-4"
        style={{ background: `rgba(35,27,21,${CAPSULE_ALPHA})`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
        data-capsule
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-2xl font-black leading-tight text-white" style={{ letterSpacing: '-0.02em' }}>
            {shop.name}
          </h3>
          {shop.dripScore ? (
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[15px] font-black"
              style={{ background: 'rgba(163,230,53,0.16)', borderColor: 'rgba(163,230,53,0.5)', color: '#a3e635' }}
            >
              <i className="fas fa-tint text-xs"></i>
              {Math.round(shop.dripScore)}
            </span>
          ) : null}
        </div>
        {(metaParts.length > 0 || (savers && savers.length > 0)) && (
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
              <i className="fas fa-map-marker-alt mr-1.5"></i>
              {countryFlag(shop.location?.country) && (
                <span className="mr-1.5">{countryFlag(shop.location?.country)}</span>
              )}
              {metaParts.join(' · ')}
            </p>
            {savers && savers.length > 0 && (
              <span className="flex shrink-0 items-center">
                <span className="flex -space-x-2">
                  {savers.slice(0, 3).map(s =>
                    s.avatarUrl ? (
                      <img
                        key={s.id}
                        src={sizedImageUrl(s.avatarUrl, { width: 48 })}
                        alt={s.username}
                        title={s.username}
                        className="h-5 w-5 rounded-full object-cover"
                        style={{ border: '1.5px solid rgba(35,27,21,0.9)' }}
                      />
                    ) : (
                      <span
                        key={s.id}
                        title={s.username}
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black uppercase"
                        style={{ background: '#a3e635', color: '#231b15', border: '1.5px solid rgba(35,27,21,0.9)' }}
                      >
                        {s.username?.[0] ?? '?'}
                      </span>
                    )
                  )}
                </span>
                <span className="ml-1.5 text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  {savers.length}
                </span>
              </span>
            )}
          </div>
        )}
        {vibes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {vibes.map(v => (
              <span
                key={String(v)}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#e4ddce' }}
              >
                {String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default DiscoverCard;
