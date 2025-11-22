
import React, { useEffect, useRef, useState } from 'react';
import Button from './Button';
import { useToast } from '../context/ToastContext';

// Declare Leaflet types globally
declare global {
  interface Window {
    L: any;
  }
}

interface LocationValue {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationPickerProps {
  value?: LocationValue;
  onLocationSelect: (location: LocationValue) => void;
  searchAddress: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onLocationSelect, searchAddress }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) return;

    // Default to SF or user's current location if possible (omitted for simplicity)
    const defaultLat = 37.7749;
    const defaultLng = -122.4194;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Click handler
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      updateMarker(lat, lng);
      
      // Simple reverse geocode attempt (optional, can skip to save API calls)
      onLocationSelect({ lat, lng });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker when value changes externally (e.g. via search)
  useEffect(() => {
    if (value && value.lat && value.lng) {
        updateMarker(value.lat, value.lng, false); // Don't trigger callback to avoid loop
    }
  }, [value]);

  const updateMarker = (lat: number, lng: number, triggerCallback = true) => {
    const L = window.L;
    if (!mapInstanceRef.current || !L) return;

    if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
    } else {
        const customIcon = L.divIcon({
            className: 'custom-picker-icon',
            html: `<div class="w-8 h-8 bg-coffee-900 rounded-full border-4 border-volt-400 shadow-xl flex items-center justify-center"><i class="fas fa-map-pin text-volt-400 text-[10px]"></i></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current);
    }

    mapInstanceRef.current.setView([lat, lng], 15);
  };

  const handleSearch = async () => {
    if (!searchAddress.trim()) {
        toast.error("Please enter a city or address first.");
        return;
    }

    setIsSearching(true);
    try {
        // Add limit=1 to be polite to the API
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`);
        
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            
            updateMarker(lat, lng);
            onLocationSelect({ 
                lat, 
                lng, 
                address: result.display_name // Update with full formatted address
            });
            toast.success("Location found!");
        } else {
            toast.error("Location not found. Try a different address.");
        }
    } catch (error) {
        console.error("Geocoding error:", error);
        toast.error("Could not find location. Please click on the map manually.");
    } finally {
        setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
        <div className="flex gap-2">
            <Button 
                type="button" 
                onClick={handleSearch} 
                variant="secondary" 
                size="sm"
                isLoading={isSearching}
                className="w-full"
            >
                <i className="fas fa-search-location mr-2"></i> 
                Find "{searchAddress || '...'}" on Map
            </Button>
        </div>
        <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-coffee-100 shadow-inner bg-coffee-50">
            <div ref={mapContainerRef} className="w-full h-full" />
            {!value?.lat && (
                <div className="absolute inset-0 flex items-center justify-center bg-coffee-50/50 pointer-events-none z-[400]">
                    <span className="bg-white/90 px-3 py-1 rounded text-xs font-bold text-coffee-800 shadow">
                        Search or click map to pin location
                    </span>
                </div>
            )}
        </div>
    </div>
  );
};

export default LocationPicker;
