
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Map from '../components/Map';
import TagChip from '../components/TagChip';
import LoadingSpinner from '../components/LoadingSpinner';
import { ALL_VIBES } from '../constants';

// Calculate distance between two points in miles (Haversine formula)
const getDistanceMiles = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const Home: React.FC = () => {
  const { shops, searchQuery, setSearchQuery, selectedVibes, toggleVibe, loading } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Mobile view toggle
  const [nearMeActive, setNearMeActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleNearMe = () => {
    if (nearMeActive) {
      // Turn off near me filter
      setNearMeActive(false);
      return;
    }

    if (userLocation) {
      // Already have location, just activate filter
      setNearMeActive(true);
      return;
    }

    // Request location
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationLoading(false);
      return;
    }

    // Try with high accuracy first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setNearMeActive(true);
        setLocationLoading(false);
      },
      (error) => {
        // If high accuracy fails, try again with lower accuracy
        if (error.code === error.TIMEOUT) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              setNearMeActive(true);
              setLocationLoading(false);
            },
            (fallbackError) => {
              let errorMessage = 'Unable to get location';

              switch(fallbackError.code) {
                case fallbackError.PERMISSION_DENIED:
                  errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
                  break;
                case fallbackError.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable. Please try again.';
                  break;
                case fallbackError.TIMEOUT:
                  errorMessage = 'Location request timed out. Check your GPS signal and try again.';
                  break;
                default:
                  errorMessage = 'Unable to get your location. Please try again.';
              }

              setLocationError(errorMessage);
              setLocationLoading(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
          );
          return;
        }

        // Handle other errors
        let errorMessage = 'Unable to get location';

        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please try again.';
            break;
          default:
            errorMessage = 'Unable to get your location. Please try again.';
        }

        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Filter shops by distance if nearMe is active
  const filteredShops = nearMeActive && userLocation
    ? shops.filter(shop => {
        const distance = getDistanceMiles(
          userLocation.lat, userLocation.lng,
          shop.location.lat, shop.location.lng
        );
        return distance <= 100; // 100 mile radius
      })
    : shops;

  const handleShopClick = (id: string) => {
    navigate(`/shop/${id}`);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-coffee-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-coffee-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
            <i className="fas fa-droplet text-volt-400 text-4xl"></i>
          </div>
          <LoadingSpinner size="lg" />
          <p className="text-coffee-600 mt-4 font-medium">Loading spots...</p>
        </div>
      </div>
    );
  }

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
             {/* Near Me Button */}
             <button
               onClick={handleNearMe}
               disabled={locationLoading}
               className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                 nearMeActive
                   ? 'bg-volt-400 text-coffee-900'
                   : 'bg-coffee-100 text-coffee-700 hover:bg-coffee-200'
               } ${locationLoading ? 'opacity-50 cursor-wait' : ''}`}
             >
               <i className={`fas ${locationLoading ? 'fa-spinner fa-spin' : 'fa-location-crosshairs'}`}></i>
               Near Me
             </button>
             {ALL_VIBES.map(vibe => (
                <TagChip
                    key={vibe}
                    label={vibe}
                    isSelected={selectedVibes.includes(vibe)}
                    onClick={() => toggleVibe(vibe)}
                />
             ))}
          </div>
          {locationError && (
            <p className="text-xs text-red-500 mt-1">{locationError}</p>
          )}
          {nearMeActive && (
            <p className="text-xs text-volt-600 mt-1">
              <i className="fas fa-check-circle mr-1"></i>
              Showing spots within 100 miles
            </p>
          )}
        </div>

        {/* Shop List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
           {filteredShops.length === 0 ? (
               <div className="text-center py-10 text-coffee-800/60">
                   <i className="fas fa-globe-americas text-4xl mb-4"></i>
                   <p>{nearMeActive ? 'No spots found within 100 miles.' : 'No spots found in this area.'}</p>
                   <button onClick={() => { setSearchQuery(''); setNearMeActive(false); }} className="mt-2 text-volt-500 font-bold text-sm hover:underline">Clear Filters</button>
               </div>
           ) : (
               filteredShops.map(shop => (
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
                              <i className="fas fa-star text-volt-400 mr-1"></i> {shop.rating.toFixed(1)}
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

         <Map shops={filteredShops} onShopClick={handleShopClick} userLocation={userLocation} />
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
