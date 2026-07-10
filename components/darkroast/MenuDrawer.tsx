import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

// Dark Roast hamburger menu drawer (design_handoff_dark_roast/README.md →
// Global Navigation B). Left slide-in panel over a dimmed backdrop.

interface MenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

const NavRow: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  trailing?: React.ReactNode;
}> = ({ icon, label, onClick, highlight, trailing }) => (
  <button
    onClick={onClick}
    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-volt-400"
    style={{
      background: highlight ? 'rgba(204,255,0,0.10)' : 'transparent',
      borderRadius: highlight ? 14 : 11,
    }}
  >
    <span
      className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]"
      style={{ background: highlight ? '#ccff00' : '#2f251d' }}
    >
      <i className={`fas ${icon} text-[15px]`} style={{ color: highlight ? '#231b15' : '#e4ddce' }}></i>
    </span>
    <span className="flex-1 text-[15px] font-semibold" style={{ color: '#f3efe0' }}>
      {label}
    </span>
    {trailing ?? <i className="fas fa-chevron-right text-xs" style={{ color: 'rgba(243,239,224,0.3)' }}></i>}
  </button>
);

const MenuDrawer: React.FC<MenuDrawerProps> = ({ open, onClose }) => {
  const { user, logout } = useApp();
  const navigate = useNavigate();

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
    navigate('/');
  };

  return (
    <div
      className={`fixed inset-0 z-40 transition-opacity duration-250 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(13,10,8,0.68)' }} onClick={onClose}></div>

      {/* Panel */}
      <div
        className="absolute bottom-0 left-0 top-0 flex w-[330px] max-w-[85vw] flex-col border-r border-white/[0.08] transition-transform duration-250 ease-in-out"
        style={{
          background: '#221a14',
          boxShadow: '24px 0 70px rgba(0,0,0,0.55)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div className="border-b border-white/[0.07] p-[22px]">
          <div className="flex items-start justify-between">
            {user ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="h-[54px] w-[54px] rounded-full object-cover"
                style={{ border: '2px solid #ccff00' }}
              />
            ) : (
              <span
                className="flex h-[54px] w-[54px] items-center justify-center rounded-full"
                style={{ background: '#2f251d', border: '2px solid #ccff00' }}
              >
                <i className="fas fa-user" style={{ color: '#e4ddce' }}></i>
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-volt-400"
              style={{ background: '#2f251d' }}
            >
              <i className="fas fa-xmark" style={{ color: '#f3efe0' }}></i>
            </button>
          </div>
          {user ? (
            <>
              <p className="mt-3 font-serif text-[21px] font-black" style={{ color: '#f3efe0' }}>
                {user.username}
              </p>
              <span
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider"
                style={{ background: 'rgba(204,255,0,0.14)', color: '#ccff00' }}
              >
                <i className="fas fa-mug-hot"></i>
                {(user.dripScore ?? 0)} Drip Score
              </span>
            </>
          ) : (
            <>
              <p className="mt-3 font-serif text-[21px] font-black" style={{ color: '#f3efe0' }}>
                Welcome
              </p>
              <button
                onClick={() => go('/auth')}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-volt-400"
                style={{ background: '#ccff00', color: '#231b15' }}
              >
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Nav rows */}
        <div className="flex-1 space-y-1 overflow-y-auto p-3">
          <NavRow icon="fa-map" label="Map" onClick={() => go('/')} />
          <NavRow icon="fa-calendar-alt" label="Events" onClick={() => go('/events')} />
          <NavRow icon="fa-mug-hot" label="Leaders" onClick={() => go('/leaderboard')} />
          <NavRow icon="fa-users" label="Community" onClick={() => go('/community')} />
          <NavRow
            icon="fa-crown"
            label="DripClub"
            onClick={() => go('/dripclub')}
            highlight
            trailing={
              <span className="rounded-full px-2 py-0.5 text-[9px] font-black" style={{ background: '#ccff00', color: '#231b15' }}>
                10% OFF
              </span>
            }
          />
          <NavRow
            icon="fa-dollar-sign"
            label="Scout Bounty"
            onClick={() => go('/scout-bounty')}
            trailing={
              <span className="text-[11px] font-extrabold" style={{ color: '#ccff00' }}>
                $10 / spot
              </span>
            }
          />
          <NavRow icon="fa-plus" label="Add a Shop" onClick={() => go('/add')} />
          <NavRow icon="fa-droplet" label="Your Drips" onClick={() => go(user ? `/profile/${user.id}` : '/auth')} />
          {user && (user.isAdmin || user.isBusinessOwner) && (
            <NavRow icon="fa-gear" label="Admin" onClick={() => go('/admin')} />
          )}
        </div>

        {/* Footer */}
        {user && (
          <div className="border-t border-white/[0.07] p-4">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-volt-400 rounded-lg px-1"
              style={{ color: 'rgba(243,239,224,0.6)' }}
            >
              <i className="fas fa-arrow-right-from-bracket"></i>
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuDrawer;
