import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Dark Roast persistent bottom tab bar (design_handoff_dark_roast/README.md →
// Global Navigation A). Five slots: Map, Events, Add (volt FAB), Leaders, Drips.
const TABS = [
  { key: 'map', label: 'Map', icon: 'fa-map', to: '/' },
  { key: 'events', label: 'Events', icon: 'fa-calendar-alt', to: '/events' },
  { key: 'add', label: '', icon: 'fa-plus', to: '/add' },
  { key: 'leaders', label: 'Leaders', icon: 'fa-mug-hot', to: '/leaderboard' },
  { key: 'drips', label: 'Drips', icon: 'fa-droplet', to: '/profile' },
] as const;

const BottomTabBar: React.FC = () => {
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 h-[82px] border-t border-white/[0.07] lg:bottom-5 lg:left-1/2 lg:right-auto lg:h-[68px] lg:w-[400px] lg:-translate-x-1/2 lg:rounded-full lg:border lg:border-white/[0.07] lg:shadow-2xl"
      style={{ background: 'rgba(23,18,14,0.9)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
    >
      <div className="mx-auto flex h-full max-w-md items-start justify-around pt-[11px] lg:items-center lg:pt-0">
        {TABS.map(tab =>
          tab.key === 'add' ? (
            <Link
              key={tab.key}
              to={tab.to}
              aria-label="Add a shop"
              className="-mt-2 flex h-[46px] w-[46px] items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-volt-400"
              style={{ background: '#a3e635', boxShadow: '0 8px 24px -4px rgba(163,230,53,0.45)' }}
            >
              <i className="fas fa-plus text-[18px]" style={{ color: '#231b15' }}></i>
            </Link>
          ) : (
            <Link
              key={tab.key}
              to={tab.to}
              className="flex flex-col items-center gap-1 px-3 focus:outline-none focus:ring-2 focus:ring-volt-400 rounded-lg"
            >
              <i
                className={`fas ${tab.icon} text-[18px]`}
                style={{ color: isActive(tab.to) ? '#a3e635' : 'rgba(243,239,224,0.45)' }}
              ></i>
              <span
                className="text-[10px]"
                style={{
                  color: isActive(tab.to) ? '#a3e635' : 'rgba(243,239,224,0.45)',
                  fontWeight: isActive(tab.to) ? 700 : 600,
                }}
              >
                {tab.label}
              </span>
            </Link>
          )
        )}
      </div>
    </nav>
  );
};

export default BottomTabBar;
