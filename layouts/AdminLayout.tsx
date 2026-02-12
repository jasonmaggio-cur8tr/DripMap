import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const AdminLayout: React.FC = () => {
    const { user } = useApp();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    if (!user?.isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-sand-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-coffee-900 mb-2">Access Denied</h1>
                    <p className="text-coffee-600 mb-4">You do not have permission to view this area.</p>
                    <Link to="/" className="text-volt-600 hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: 'fa-chart-line' },
        { label: 'Curator', path: '/admin/curator', icon: 'fa-robot' },
        { label: 'Shop Drafts', path: '/admin/drafts', icon: 'fa-file-alt' },
        { label: 'Events', path: '/admin/events', icon: 'fa-calendar-alt' },
        { label: 'Users', path: '/admin/users', icon: 'fa-users' },
    ];

    return (
        <div className="flex h-screen bg-sand-50">
            {/* Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-coffee-900 text-white transition-all duration-300 flex flex-col`}>
                <div className="p-4 flex items-center justify-between">
                    {isSidebarOpen && <span className="font-serif font-bold text-xl tracking-tight text-volt-400">DripMap Admin</span>}
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-coffee-300 hover:text-white">
                        <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-bars'}`}></i>
                    </button>
                </div>

                <nav className="flex-1 py-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 hover:bg-coffee-800 transition-colors ${location.pathname === item.path ? 'bg-coffee-800 text-volt-400 border-r-4 border-volt-400' : 'text-coffee-200'}`}
                        >
                            <i className={`fas ${item.icon} w-6 text-center`}></i>
                            {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-coffee-800">
                    <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" />
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold truncate">{user.username}</p>
                                <p className="text-xs text-coffee-400 truncate">Admin</p>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="bg-white border-b border-coffee-100 p-4 sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-coffee-900">
                        {navItems.find(i => i.path === location.pathname)?.label || 'Admin'}
                    </h2>
                </header>
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
