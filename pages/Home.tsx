
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Map from '../components/Map';
import TagChip from '../components/TagChip';
import { ALL_VIBES } from '../constants';

const Home: React.FC = () => {
  const { shops, searchQuery, setSearchQuery, selectedVibes, toggleVibe } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Mobile view toggle

  const handleShopClick = (id: string) => {
    navigate(`/shop/${id}`);
  };

  return (
    <div className="h-[calc(100vh-4rem)] mt-16 flex flex-col md:flex-row overflow-hidden">
      {/* Filters & List Section */}
      <div className={`
        flex-col bg-coffee-50 w-full md:w-[450px] flex-shrink-0 border-r border-coffee-200 h-full
        ${viewMode === 'map' ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Search & Filter Header */}
        <div className="p-4 border-b border-coffee-200 space-y-4 bg-white z-10 shadow-sm">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-coffee-800/50"></i>
            <input
              type="text"
              placeholder="Search city (e.g. London), shop, or matcha..."
              className="w-full pl-10 pr-4 py-3 bg-coffee-50 border-none rounded-xl focus:ring-2 focus:ring-volt-400 text-coffee-900 placeholder-coffee-800/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
             {ALL_VIBES.map(vibe => (
                <TagChip 
                    key={vibe} 
                    label={vibe} 
                    isSelected={selectedVibes.includes(vibe)}
                    onClick={() => toggleVibe(vibe)}
                />
             ))}
          </div>
        </div>

        {/* Shop List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           {shops.length === 0 ? (
               <div className="text-center py-10 text-coffee-800/60">
                   <i className="fas fa-globe-americas text-4xl mb-4"></i>
                   <p>No spots found in this area.</p>
                   <button onClick={() => setSearchQuery('')} className="mt-2 text-volt-500 font-bold text-sm hover:underline">Clear Search</button>
               </div>
           ) : (
               shops.map(shop => (
                   <Link 
                     key={shop.id} 
                     to={`/shop/${shop.id}`}
                     className="block group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-coffee-100 hover:border-volt-400/50"
                   >
                      <div className="relative h-40 overflow-hidden">
                          <img 
                            src={shop.gallery[0]?.url} 
                            alt={shop.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {shop.isClaimed && (
                              <div className="absolute top-3 right-3 bg-volt-400 text-coffee-900 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                  <i className="fas fa-check-circle"></i> CLAIMED
                              </div>
                          )}
                          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center">
                              <i className="fas fa-star text-volt-400 mr-1"></i> {shop.rating}
                          </div>
                      </div>
                      <div className="p-4">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold font-serif text-coffee-900 mb-1 group-hover:text-coffee-800">{shop.name}</h3>
                            <span className="text-[10px] font-bold bg-coffee-100 text-coffee-600 px-2 py-1 rounded uppercase tracking-wider">{shop.location.city}</span>
                          </div>
                          <p className="text-xs text-coffee-800/70 mb-3 flex items-center">
                             <i className="fas fa-map-marker-alt mr-1.5"></i> {shop.location.address}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                              {shop.vibes.slice(0, 3).map(v => (
                                  <span key={v} className="text-[10px] bg-coffee-50 text-coffee-800 px-2 py-0.5 rounded-md border border-coffee-200">
                                      {v}
                                  </span>
                              ))}
                          </div>
                      </div>
                   </Link>
               ))
           )}
        </div>
      </div>

      {/* Map Section */}
      <div className={`
        flex-1 relative bg-coffee-100
        ${viewMode === 'list' ? 'hidden md:block' : 'block'}
      `}>
         {/* Floating Search Bar (Mobile Only) */}
         <div className="absolute top-4 left-4 right-16 z-[500] md:hidden pointer-events-auto">
            <div className="relative shadow-lg rounded-xl">
                <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-coffee-800/50"></i>
                <input
                  type="text"
                  placeholder="Search map..."
                  className="w-full pl-11 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-coffee-100 rounded-xl focus:ring-2 focus:ring-volt-400 outline-none text-coffee-900 text-sm font-bold"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
         </div>

         <Map shops={shops} onShopClick={handleShopClick} />
      </div>

      {/* Mobile View Toggle */}
      <div className="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-coffee-900 text-volt-400 rounded-full shadow-xl z-[1000] p-1 flex">
         <button 
            onClick={() => setViewMode('list')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-volt-400 text-coffee-900' : 'text-volt-400'}`}
         >
            List
         </button>
         <button 
            onClick={() => setViewMode('map')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-volt-400 text-coffee-900' : 'text-volt-400'}`}
         >
            Map
         </button>
      </div>
    </div>
  );
};

export default Home;
