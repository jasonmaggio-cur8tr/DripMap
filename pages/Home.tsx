import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Map from '../components/Map';
import DiscoverCard from '../components/darkroast/DiscoverCard';
import MenuDrawer from '../components/darkroast/MenuDrawer';
import BottomTabBar from '../components/darkroast/BottomTabBar';
import NotificationBell from '../components/NotificationBell';
import { ALL_VIBES } from '../constants';
import { Vibe } from '../types';

// Dark Roast Discover feed (design_handoff_dark_roast/README.md → Screens 1–3).
// "Just Added" big-card feed + vibe filter + hamburger drawer + bottom tab bar.

// Calculate distance between two points in miles (Haversine formula)
const getDistanceMiles = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Home: React.FC = () => {
  const { shops, shopsLoading, searchQuery, setSearchQuery, selectedVibes, toggleVibe, user, toggleSaveShop } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Silent geolocation for distances + map centering
  useEffect(() => {
    if (navigator.geolocation && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.warn('Silent geolocation fetch failed:', error),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Single-vibe filter on top of the context's multi-select
  const activeVibe: Vibe | null = selectedVibes[0] ?? null;
  const selectVibe = (vibe: Vibe) => {
    if (activeVibe === vibe) {
      toggleVibe(vibe); // clear
      return;
    }
    selectedVibes.forEach(v => toggleVibe(v));
    toggleVibe(vibe);
  };
  const clearVibe = () => {
    selectedVibes.forEach(v => toggleVibe(v));
  };

  // Context `shops` is already filtered by searchQuery + selectedVibes and
  // ordered created_at DESC — exactly the "Just Added" feed order.
  const feedShops = shops;

  // Infinite scroll: only mount a page of big cards at a time (each card is
  // 548px with backdrop-filter layers — rendering the full catalog at once
  // wrecks scroll performance). Spec: "feed is paginated/infinite-scroll".
  const PAGE_SIZE = 8;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeVibe, searchQuery]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount(c => Math.min(c + PAGE_SIZE, feedShops.length));
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [feedShops.length, viewMode]);
  const visibleShops = feedShops.slice(0, visibleCount);

  const distanceFor = (lat?: number, lng?: number): number | null => {
    if (!userLocation || lat == null || lng == null) return null;
    return getDistanceMiles(userLocation.lat, userLocation.lng, lat, lng);
  };

  const handleToggleSave = (shopId: string, shopName: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    const wasSaved = user.savedShops.includes(shopId);
    toggleSaveShop(shopId);
    toast.success(wasSaved ? `Removed ${shopName} from saved` : 'Saved for later');
  };

  const isFiltered = activeVibe !== null;

  return (
    <div className="min-h-dvh" style={{ background: '#1e1712' }}>
      {/* ── Sticky glass header ─────────────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-white/[0.07]"
        style={{ background: 'rgba(23,18,14,0.82)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      >
        <div className="mx-auto max-w-md px-5 pb-3 pt-2">
          {/* Row 1 */}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-3">
              {isFiltered ? (
                <button
                  onClick={clearVibe}
                  aria-label="Back to full feed"
                  className="flex h-8 w-8 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
                  style={{ background: '#2b221b' }}
                >
                  <i className="fas fa-arrow-left text-sm" style={{ color: '#f3efe0' }}></i>
                </button>
              ) : (
                <button
                  onClick={() => setDrawerOpen(true)}
                  aria-label="Open menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
                  style={{ background: '#2b221b' }}
                >
                  <i className="fas fa-bars" style={{ color: '#f3efe0' }}></i>
                </button>
              )}
              {isFiltered ? (
                <p className="font-serif text-[19px] font-black" style={{ color: '#f3efe0', letterSpacing: '-0.02em' }}>
                  {activeVibe}
                  <span className="ml-1.5 font-sans text-[13px] font-medium" style={{ color: 'rgba(243,239,224,0.5)' }}>
                    · {feedShops.length} spot{feedShops.length !== 1 ? 's' : ''}
                  </span>
                </p>
              ) : (
                <img src="/logo-dark.jpg" alt="DripMap" className="h-[22px] w-auto rounded" />
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSearchOpen(o => !o)}
                aria-label="Search"
                className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
                style={{ background: '#2b221b' }}
              >
                <i className="fas fa-search text-sm" style={{ color: '#f3efe0' }}></i>
              </button>
              {user && <NotificationBell />}
              {user ? (
                <Link
                  to={`/profile/${user.id}`}
                  className="block h-9 w-9 overflow-hidden rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
                  style={{ border: '2px solid #ccff00' }}
                >
                  <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="rounded-full px-3.5 py-2 text-[11px] font-extrabold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-volt-400"
                  style={{ background: '#ccff00', color: '#231b15' }}
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>

          {/* Search input (toggled) */}
          {searchOpen && (
            <div className="relative py-1.5">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'rgba(243,239,224,0.45)' }}></i>
              <input
                autoFocus
                type="text"
                placeholder="Search shop, city, or matcha…"
                className="w-full rounded-xl border-none py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-volt-400"
                style={{ background: '#2b221b', color: '#f3efe0' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Row 2: vibe filter chips */}
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pt-1.5">
            <button
              onClick={() => setViewMode(m => (m === 'map' ? 'feed' : 'map'))}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-volt-400"
              style={
                viewMode === 'map'
                  ? { background: '#ccff00', color: '#231b15' }
                  : { background: '#2b221b', color: '#e4ddce', border: '1px solid rgba(255,255,255,0.09)' }
              }
            >
              <i className="fas fa-map"></i>
              Map
            </button>
            <button
              onClick={() => { if (isFiltered) clearVibe(); setViewMode('feed'); }}
              className="shrink-0 rounded-full px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-volt-400"
              style={
                !isFiltered && viewMode === 'feed'
                  ? { background: '#ccff00', color: '#231b15' }
                  : { background: '#2b221b', color: '#e4ddce', border: '1px solid rgba(255,255,255,0.09)' }
              }
            >
              Just Added
            </button>
            {ALL_VIBES.map(vibe => (
              <button
                key={vibe}
                onClick={() => { selectVibe(vibe); setViewMode('feed'); }}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-volt-400"
                style={
                  activeVibe === vibe
                    ? { background: '#ccff00', color: '#231b15' }
                    : { background: '#2b221b', color: '#e4ddce', border: '1px solid rgba(255,255,255,0.09)' }
                }
              >
                {vibe}
                {activeVibe === vibe && <i className="fas fa-xmark"></i>}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Map view (preserved from the previous Home) ─────────────────── */}
      {viewMode === 'map' ? (
        <div className="fixed inset-x-0 bottom-[82px] top-[118px]">
          <Map shops={feedShops} onShopClick={(id) => navigate(`/shop/${id}`)} userLocation={userLocation} />
        </div>
      ) : (
        /* ── "Just Added" big-card feed ─────────────────────────────────── */
        <main className="mx-auto max-w-md px-4 pb-[100px] pt-[130px]">
          {shopsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-[548px] animate-pulse rounded-3xl" style={{ background: '#2b221b' }}></div>
              ))}
            </div>
          ) : feedShops.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <i className="fas fa-mug-hot text-4xl" style={{ color: 'rgba(243,239,224,0.25)' }}></i>
              <p className="text-[15px] font-medium" style={{ color: '#e4ddce' }}>
                No spots here yet. Be the first to map one.
              </p>
              <Link
                to="/add"
                className="rounded-full px-5 py-3 text-sm font-extrabold focus:outline-none focus:ring-2 focus:ring-volt-400"
                style={{ background: '#2b221b', color: '#ccff00', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <i className="fas fa-plus mr-2"></i>
                Add a Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleShops.map((shop, i) => (
                <DiscoverCard
                  key={shop.id}
                  shop={shop}
                  isSaved={!!user?.savedShops.includes(shop.id)}
                  onToggleSave={() => handleToggleSave(shop.id, shop.name)}
                  distanceMi={distanceFor(shop.location?.lat, shop.location?.lng)}
                  categoryBadge={isFiltered ? String(activeVibe) : null}
                  eager={i < 2}
                />
              ))}
              {visibleCount < feedShops.length && (
                <div ref={sentinelRef} className="flex justify-center py-6">
                  <i className="fas fa-spinner fa-spin text-xl" style={{ color: 'rgba(243,239,224,0.45)' }}></i>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      <MenuDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <BottomTabBar />
    </div>
  );
};

export default Home;
