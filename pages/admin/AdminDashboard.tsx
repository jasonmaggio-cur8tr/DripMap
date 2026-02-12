import React from 'react';

const AdminDashboard: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-coffee-100 shadow-sm">
                <h3 className="text-sm font-bold text-coffee-500 uppercase mb-2">Pending Drafts</h3>
                <p className="text-3xl font-black text-coffee-900">0</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-coffee-100 shadow-sm">
                <h3 className="text-sm font-bold text-coffee-500 uppercase mb-2">Curator Runs (Today)</h3>
                <p className="text-3xl font-black text-coffee-900">0</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-coffee-100 shadow-sm">
                <h3 className="text-sm font-bold text-coffee-500 uppercase mb-2">Approved Shops</h3>
                <p className="text-3xl font-black text-coffee-900">--</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
