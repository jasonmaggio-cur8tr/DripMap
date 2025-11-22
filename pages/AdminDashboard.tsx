
import React from 'react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';

const AdminDashboard: React.FC = () => {
  const { claimRequests, approveClaimRequest, shops } = useApp();

  const pendingRequests = claimRequests.filter(r => r.status === 'pending');
  const approvedRequests = claimRequests.filter(r => r.status === 'approved');

  return (
    <div className="min-h-screen bg-coffee-50 pt-24 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-serif font-bold text-coffee-900">Admin Dashboard</h1>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm text-sm font-bold border border-coffee-200">
                Admin Mode
            </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white rounded-3xl shadow-lg border border-coffee-100 overflow-hidden mb-10">
            <div className="bg-coffee-900 p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-volt-400">Pending Claims ({pendingRequests.length})</h2>
            </div>
            
            {pendingRequests.length === 0 ? (
                <div className="p-10 text-center text-coffee-400">
                    <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                    <p>No pending verification requests.</p>
                </div>
            ) : (
                <div className="divide-y divide-coffee-100">
                    {pendingRequests.map(request => {
                        const shop = shops.find(s => s.id === request.shopId);
                        return (
                            <div key={request.id} className="p-6 flex flex-col md:flex-row gap-6 md:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-bold text-lg text-coffee-900">{shop?.name || 'Unknown Shop'}</h3>
                                        <span className="text-xs bg-coffee-100 px-2 py-0.5 rounded text-coffee-600 font-medium uppercase">{request.role}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center text-sm text-coffee-700 bg-coffee-50 p-2 rounded-lg border border-coffee-100">
                                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-coffee-400 mr-3 shadow-sm">
                                                <i className="fas fa-envelope"></i>
                                            </div>
                                            <div className="overflow-hidden text-ellipsis">
                                                <p className="text-[10px] uppercase font-bold text-coffee-400">Contact Email</p>
                                                <p className="font-medium">{request.businessEmail}</p>
                                            </div>
                                        </div>
                                        
                                        <a 
                                            href={request.socialLink} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center text-sm text-coffee-700 bg-coffee-50 p-2 rounded-lg border border-coffee-100 hover:border-volt-400 hover:bg-white transition-all group"
                                        >
                                            <div className="w-8 h-8 bg-white group-hover:bg-volt-400 rounded-full flex items-center justify-center text-coffee-400 group-hover:text-coffee-900 mr-3 shadow-sm transition-colors">
                                                <i className="fas fa-external-link-alt"></i>
                                            </div>
                                            <div className="overflow-hidden text-ellipsis">
                                                 <p className="text-[10px] uppercase font-bold text-coffee-400">Verification Source</p>
                                                 <p className="font-medium text-blue-600 underline truncate">{request.socialLink}</p>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                                <div className="flex gap-3 flex-col sm:flex-row">
                                    <Button variant="secondary" onClick={() => approveClaimRequest(request.id)}>
                                        <i className="fas fa-check mr-2"></i> Approve
                                    </Button>
                                    <Button variant="outline">
                                        <i className="fas fa-times mr-2"></i> Reject
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Approved History */}
        <div className="bg-white rounded-3xl shadow-sm border border-coffee-100 overflow-hidden opacity-80">
            <div className="p-6 border-b border-coffee-100">
                <h2 className="text-lg font-bold text-coffee-900">Approved History</h2>
            </div>
            <div className="divide-y divide-coffee-100">
                {approvedRequests.map(request => {
                     const shop = shops.find(s => s.id === request.shopId);
                     return (
                        <div key={request.id} className="p-4 flex items-center justify-between">
                            <div>
                                <span className="font-bold text-coffee-900">{shop?.name}</span>
                                <span className="text-coffee-500 text-sm mx-2">via</span>
                                <a href={request.socialLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm">
                                    Social Link
                                </a>
                            </div>
                            <span className="text-green-600 font-bold text-sm flex items-center">
                                <i className="fas fa-check-circle mr-1"></i> Verified
                            </span>
                        </div>
                     );
                })}
                {approvedRequests.length === 0 && <div className="p-4 text-coffee-400 text-sm">No history yet.</div>}
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
