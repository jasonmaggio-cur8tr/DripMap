
import React, { useEffect, useRef, useState } from 'react';
import { Shop } from '../types';

// Declare Leaflet types globally
declare global {
  interface Window {
    L: any;
  }
}

interface MapProps {
  shops: Shop[];
  onShopClick: (shopId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

const Map: React.FC<MapProps> = ({ shops, onShopClick, userLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  
  // Store previous shop IDs to prevent re-zooming if data hasn't meaningfully changed
  const prevShopIdsRef = useRef<string>('');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([39.8283, -98.5795], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const L = window.L;
    if (!mapInstanceRef.current || !L) return;

    const map = mapInstanceRef.current;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const markerGroup = L.featureGroup();

    const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div class='custom-marker-pin'></div>",
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });

    shops.forEach(shop => {
      const marker = L.marker([shop.location.lat, shop.location.lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => onShopClick(shop.id));

      const popupContent = `
        <div class="cursor-pointer" onclick="window.location.hash = '#/shop/${shop.id}'">
            <div class="h-24 w-full relative overflow-hidden bg-gray-100">
                <img src="${shop.gallery[0]?.url}" class="w-full h-full object-cover" />
                <div class="absolute bottom-2 right-2 bg-white px-1.5 rounded shadow text-[10px] font-bold">
                    ★ ${shop.rating}
                </div>
            </div>
            <div class="p-3">
                <h3 class="font-bold text-coffee-900 text-sm mb-1 font-serif">${shop.name}</h3>
                <p class="text-xs text-coffee-500">${shop.location.city}</p>
            </div>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
      markerGroup.addLayer(marker);
    });

    // Calculate simple hash of current shops to see if the set changed
    const currentShopIds = shops.map(s => s.id).sort().join(',');
    const shouldFitBounds = shops.length > 0 && currentShopIds !== prevShopIdsRef.current && !locating;

    // Fit bounds to show all markers if the list has changed (e.g. filtering)
    if (shouldFitBounds) {
       try {
         const bounds = markerGroup.getBounds();
         if (bounds.isValid()) {
             map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
             prevShopIdsRef.current = currentShopIds;
         }
       } catch (e) {
         console.log("Bounds error", e);
       }
    }

  }, [shops, onShopClick, locating]);

  // Show user location marker when provided from parent (Near Me feature)
  useEffect(() => {
    const L = window.L;
    if (!mapInstanceRef.current || !L || !userLocation) return;

    // Remove existing user marker if any
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Add user location marker
    userMarkerRef.current = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 10,
      fillColor: '#3b82f6',
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 1
    }).addTo(mapInstanceRef.current);

    userMarkerRef.current.bindPopup('<div class="text-center font-bold">You are here</div>');
  }, [userLocation]);

  const handleLocateMe = () => {
    if (!mapInstanceRef.current) return;
    setLocating(true);
    
    mapInstanceRef.current.locate({ setView: true, maxZoom: 14 });

    mapInstanceRef.current.once('locationfound', (e: any) => {
        setLocating(false);
        const L = window.L;
        // Add a blue dot for user location
        L.circleMarker(e.latlng, {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
        }).addTo(mapInstanceRef.current);
    });

    mapInstanceRef.current.once('locationerror', () => {
        setLocating(false);
        // toast error handled via parent usually, but simple alert fallback here if isolated
        console.error("Could not access location");
    });
  };

  return (
    <div className="relative w-full h-full z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
        <button 
            onClick={handleLocateMe}
            disabled={locating}
            className="absolute top-4 right-4 z-[1000] bg-white text-coffee-900 p-3 rounded-xl shadow-lg hover:bg-coffee-50 transition-colors disabled:opacity-50"
            title="Find my location"
        >
            {locating ? (
                <i className="fas fa-spinner fa-spin text-volt-500"></i>
            ) : (
                <i className="fas fa-location-arrow text-coffee-900"></i>
            )}
        </button>
    </div>
  );
};

export default Map;
