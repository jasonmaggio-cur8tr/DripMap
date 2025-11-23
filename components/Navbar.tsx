
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from './Button';

const Navbar: React.FC = () => {
  const { user, logout } = useApp();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-coffee-50/90 backdrop-blur-md border-b border-coffee-200 h-14 sm:h-16">
      <div className="container mx-auto h-full px-3 sm:px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
            {/* Logo Icon: Brown Cube with Volt Drip */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-coffee-900 rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform duration-300">
                <i className="fas fa-droplet text-volt-400 text-base sm:text-lg filter drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]"></i>
            </div>
            {/* Wordmark: Fraunces font, tight tracking */}
            <span className="text-xl sm:text-2xl font-serif font-black text-coffee-900 tracking-tighter" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>
              DripMap
            </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
             <>
                {(user.isAdmin || user.isBusinessOwner) && (
                  <Link to="/admin" className="hidden sm:block text-xs font-bold text-coffee-400 hover:text-coffee-900 uppercase tracking-wider">
                      Admin
                  </Link>
                )}
                <Link to="/add" className="hidden sm:inline-flex">
                    <Button variant="outline" size="sm">
                        <i className="fas fa-plus mr-0 sm:mr-2"></i> <span className="hidden sm:inline">Add Spot</span>
                    </Button>
                </Link>
                <Link to="/add" className="sm:hidden">
                    <button className="w-8 h-8 rounded-lg bg-volt-400 text-coffee-900 flex items-center justify-center hover:bg-volt-500 transition-colors">
                        <i className="fas fa-plus text-sm"></i>
                    </button>
                </Link>
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link to="/profile" className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-coffee-200 hover:border-volt-400 transition-colors">
                        <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    </Link>
                </div>
             </>
          ) : (
            <Link to="/auth">
                <Button variant="primary" size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
