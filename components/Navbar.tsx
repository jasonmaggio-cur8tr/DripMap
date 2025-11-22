
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from './Button';

const Navbar: React.FC = () => {
  const { user, logout } = useApp();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-coffee-50/90 backdrop-blur-md border-b border-coffee-200 h-16">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
            {/* Logo Icon: Brown Cube with Volt Drip */}
            <div className="w-9 h-9 bg-coffee-900 rounded-xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform duration-300">
                <i className="fas fa-droplet text-volt-400 text-lg filter drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]"></i>
            </div>
            {/* Wordmark: Fraunces font, tight tracking */}
            <span className="text-2xl font-serif font-black text-coffee-900 tracking-tighter" style={{ fontVariationSettings: '"SOFT" 100, "WONK" 1' }}>
              DripMap
            </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
             <>
                <Link to="/admin" className="hidden lg:block text-xs font-bold text-coffee-400 hover:text-coffee-900 uppercase tracking-wider">
                    Admin Demo
                </Link>
                <Link to="/add" className="hidden md:block">
                    <Button variant="outline" size="sm">
                        <i className="fas fa-plus mr-2"></i> Add Spot
                    </Button>
                </Link>
                <div className="flex items-center gap-3">
                    <Link to="/profile" className="w-8 h-8 rounded-full overflow-hidden border-2 border-coffee-200 hover:border-volt-400 transition-colors">
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
