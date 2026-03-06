import React, { useState, useCallback, useRef, useEffect } from 'react';
import MapboxMap, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import { SearchBox } from '@mapbox/search-js-react';
import { useToast } from '../context/ToastContext';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const mapRef = useRef<any>(null);
  const { toast } = useToast();

  const [viewState, setViewState] = useState({
    longitude: value?.lng || -122.4194,
    latitude: value?.lat || 37.7749,
    zoom: value ? 14 : 10
  });

  useEffect(() => {
    if (value && value.lat && value.lng) {
      setViewState({
        longitude: value.lng,
        latitude: value.lat,
        zoom: 15
      });
      mapRef.current?.flyTo({ center: [value.lng, value.lat], zoom: 15 });
    }
  }, [value, value?.lat, value?.lng]);

  useEffect(() => {
    // If the user hasn't typed enough, or if we already have a precise pin for this exact address, skip.
    if (!searchAddress || searchAddress.length < 8) return;

    const timeoutId = setTimeout(async () => {
      try {
        const token = import.meta.env.VITE_MAPBOX_TOKEN;
        if (!token) return;

        const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(searchAddress)}&access_token=${token}&limit=1`);
        const data = await res.json();
        const feature = data.features?.[0];
        if (feature) {
          const [lng, lat] = feature.geometry.coordinates;
          // Only auto-pin if it's a significant move or we haven't pinned yet
          if (!value || (Math.abs(value.lat - lat) > 0.001 || Math.abs(value.lng - lng) > 0.001)) {
            setViewState({ longitude: lng, latitude: lat, zoom: 15 });
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 });
            onLocationSelect({ lat, lng });
          }
        }
      } catch (err) {
        console.error("Geocoding failed", err);
      }
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timeoutId);
  }, [searchAddress]);

  const handleRetrieve = useCallback(
    (res: any) => {
      const feature = res.features[0];
      if (feature) {
        const [lng, lat] = feature.geometry.coordinates;
        setViewState({ longitude: lng, latitude: lat, zoom: 15 });
        onLocationSelect({
          lat,
          lng,
          address: feature.properties.full_address || feature.properties.place_formatted || feature.properties.name
        });
        toast.success("Location found!");
      }
    },
    [onLocationSelect, toast]
  );

  return (
    <div className="space-y-3">
      <div className="w-full relative z-50">
        <SearchBox
          accessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          options={{
            language: 'en'
          }}
          onRetrieve={handleRetrieve}
          value={searchAddress}
          theme={{
            variables: {
              fontFamily: 'inherit',
              unit: '16px',
              colorText: '#2C1810',
              colorPrimary: '#3b82f6', // Focus color
              colorBackground: '#ffffff',
              colorBackgroundHover: '#f9fafb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }
          }}
        />
      </div>

      <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-coffee-100 shadow-inner bg-coffee-50 z-0">
        <MapboxMap
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
          projection="mercator"
          style={{ width: '100%', height: '100%' }}
          onClick={(e) => {
            const { lng, lat } = e.lngLat;
            onLocationSelect({ lat, lng });
          }}
        >
          <NavigationControl position="bottom-right" />

          {value?.lat && value?.lng && (
            <Marker longitude={value.lng} latitude={value.lat} anchor="center">
              <div className="w-8 h-8 bg-[#2C1810] rounded-full border-4 border-[#a3e635] shadow-xl flex items-center justify-center">
                <i className="fas fa-map-pin text-[#a3e635] text-[10px]"></i>
              </div>
            </Marker>
          )}
        </MapboxMap>

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
