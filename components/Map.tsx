import React, { useEffect, useMemo, useState } from 'react';
import MapboxMap, { Marker, Popup, Source, Layer, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox';
import { SearchBox } from '@mapbox/search-js-react';
import { Shop } from '../types';

// Mapbox CSS is required for proper rendering
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapProps {
  shops: Shop[];
  onShopClick: (shopId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const Map: React.FC<MapProps> = ({ shops, onShopClick, userLocation }) => {
  const accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
  if (!accessToken) {
    console.error("Mapbox token is missing! Tiles will not load.");
  }

  const mapRef = React.useRef<any>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [hoveredShopId, setHoveredShopId] = useState<string | null>(null);

  const activeShopId = selectedShopId || hoveredShopId;

  const activeShop = useMemo(() =>
    shops.find(s => s.id === activeShopId),
    [shops, activeShopId]);

  // If user location is passed, set the initial view there for a ~25 mile radius overview
  const initialViewState = useMemo(() => {
    // Default to US center if no location provided and shops array is empty/diverse
    const center = userLocation || (shops.length > 0 ? { lng: shops[0].location.lng, lat: shops[0].location.lat } : { lng: -98.5795, lat: 39.8283 });
    return {
      longitude: center.lng,
      latitude: center.lat,
      zoom: 11, // 10 mile radius initial zoom (tighter view)
      pitch: 60, // 3D tilt
      bearing: 15
    };
  }, [userLocation, shops]);

  // Removed fitBounds logic to maintain the desired 25-mile radius instead of zooming out to a global view

  // Fly to user location dynamically if it resolves after mount
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 12,
        duration: 2500, // Smooth swooping animation
        essential: true // This animation is considered essential with respect to prefers-reduced-motion
      });
    }
  }, [userLocation]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <MapboxMap
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        <div className="hidden md:block absolute top-4 left-4 z-10 w-72 md:w-80 shadow-xl rounded-xl overflow-hidden [&>form]:!rounded-xl [&>form>input]:!font-sans [&>form>input]:text-sm">
          <SearchBox
            accessToken={import.meta.env.VITE_MAPBOX_TOKEN}
            options={{
              language: 'en',
              types: 'country,region,postcode,district,place,locality,neighborhood'
            }}
            onRetrieve={(res) => {
              if (res.features && res.features.length > 0) {
                const feature = res.features[0];
                const [lng, lat] = feature.geometry.coordinates;
                mapRef.current?.flyTo({
                  center: [lng, lat],
                  zoom: 12,
                  pitch: 45,
                  duration: 2500
                });
              }
            }}
            placeholder="Fly to a city..."
          />
        </div>

        {/* 3D Buildings Layer (City View) */}
        <Layer
          id="3d-buildings"
          source="composite"
          source-layer="building"
          filter={['==', 'extrude', 'true']}
          type="fill-extrusion"
          minzoom={14}
          paint={{
            'fill-extrusion-color': '#5D4037', // Lighter coffee tint for buildings
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.8
          }}
        />


        <GeolocateControl position="bottom-right" />
        <NavigationControl position="bottom-right" />

        {/* User Location Marker */}
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg animate-pulse" />
          </Marker>
        )}

        {/* Shop Markers */}
        {shops.map(shop => {
          // Identify PRO+/PRO shops for custom styling and z-index ordering
          const isProPlus = shop.subscriptionTier === 'pro_plus';
          const isPro = shop.subscriptionTier === 'pro';
          const markerZIndex = isProPlus ? 50 : isPro ? 40 : 10;

          return (
            <Marker
              key={shop.id}
              longitude={shop.location.lng}
              latitude={shop.location.lat}
              anchor="bottom"
              style={{ zIndex: markerZIndex }}
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedShopId(shop.id);
                // Fly to shop slightly
                mapRef.current?.flyTo({
                  center: [shop.location.lng, shop.location.lat],
                  zoom: 15,
                  pitch: 45,
                  duration: 1000
                });
              }}
            >
              <div
                className="relative"
                onMouseEnter={() => setHoveredShopId(shop.id)}
                onMouseLeave={() => setHoveredShopId(null)}
              >
                {isProPlus ? (
                  // Volt Marker
                  <div className="flex flex-col items-center group cursor-pointer" style={{ transform: 'translateY(5px)' }}>
                    <div className="w-10 h-10 bg-[#2C1810] border-2 border-[#a3e635] shadow-xl flex justify-center items-center overflow-hidden z-10" style={{ borderRadius: '12px 12px 12px 2px' }}>
                      <i className="fas fa-bolt text-[#a3e635]"></i>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-black/30 blur-[2px] mt-1"></div>
                  </div>
                ) : (
                  // Standard Brand Marker
                  <div className="flex flex-col items-center group cursor-pointer" style={{ transform: 'translateY(5px)' }}>
                    <div
                      className="w-10 h-10 bg-[#FDFBF7] shadow-lg flex justify-center items-center overflow-hidden p-[2px] z-10 transition-transform hover:scale-110"
                      style={{ borderRadius: '50% 50% 50% 10%', transform: 'rotate(-45deg)', border: '2px solid #2C1810' }}
                    >
                      <div style={{ transform: 'rotate(45deg)' }} className="w-full h-full flex items-center justify-center bg-[#2C1810] rounded-full p-1">
                        <img src="/drip-logo.png" alt="Drip" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-black/30 blur-[2px] mt-1 -translate-y-2"></div>
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {/* Active Shop Popup (Hover or Click) */}
        {activeShop && (
          <Popup
            anchor="top"
            longitude={activeShop.location.lng}
            latitude={activeShop.location.lat}
            onClose={() => { setSelectedShopId(null); setHoveredShopId(null); }}
            closeButton={false}
            offset={14}
            className="rounded-xl overflow-hidden shadow-2xl z-[100] transition-opacity duration-200"
          >
            <div
              className="cursor-pointer max-w-xs -m-3 overflow-hidden"
              onMouseEnter={() => setHoveredShopId(activeShop.id)}
              onMouseLeave={() => setHoveredShopId(null)}
              onClick={() => {
                onShopClick(activeShop.id);
                window.location.hash = `#/shop/${activeShop.id}`;
              }}
            >
              <div className="h-28 w-full relative overflow-hidden bg-gray-100">
                <img src={activeShop.gallery[0]?.url} className="w-full h-full object-cover" loading="lazy" decoding="async" alt={activeShop.name} />
                {activeShop.dripScore ? (
                  <div className="absolute bottom-2 right-2 flex items-center text-volt-400 font-bold bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shadow-xl text-xs">
                    <i className="fas fa-tint mr-1"></i> {activeShop.dripScore.toFixed(0)}
                  </div>
                ) : (
                  <div className="absolute bottom-2 right-2 flex items-center text-white/80 font-bold bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-xl text-[10px] uppercase tracking-wide">
                    Score Pending
                  </div>
                )}
                {activeShop.subscriptionTier === 'pro_plus' && (
                  <div className="absolute top-2 left-2 bg-[#a3e635] text-[#2C1810] px-2 py-0.5 rounded shadow text-[10px] font-bold uppercase tracking-wide">
                    <i className="fas fa-bolt mr-1"></i> Pro+
                  </div>
                )}
              </div>
              <div className="p-3 bg-white">
                <h3 className="font-bold text-[#2C1810] text-sm mb-1 font-serif">{activeShop.name}</h3>
                <p className="text-xs text-gray-500">{activeShop.location.address}</p>
              </div>
            </div>
          </Popup>
        )}
      </MapboxMap>
    </div>
  );
};

export default Map;
