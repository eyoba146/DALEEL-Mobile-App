import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Crosshair, Navigation } from 'lucide-react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  title?: string;
  onCoordinatesChange: (lat: number, lng: number, address?: string) => void;
}

const ETHIOPIAN_HUBS = [
  { name: 'Addis Ababa (Bole)', lat: 9.0105, lng: 38.7615 },
  { name: 'Lalibela', lat: 12.0322, lng: 39.0416 },
  { name: 'Gondar', lat: 12.6075, lng: 37.4667 },
  { name: 'Simien Mountains', lat: 13.1833, lng: 38.0667 },
  { name: 'Hawassa', lat: 7.0504, lng: 38.4763 },
  { name: 'Harar', lat: 9.3139, lng: 42.1278 },
];

export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  address,
  title,
  onCoordinatesChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(latitude || 9.0105);
  const [currentLng, setCurrentLng] = useState<number>(longitude || 38.7615);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = latitude || 9.0105;
    const initialLng = longitude || 38.7615;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: latitude && longitude ? 14 : 12,
      attributionControl: false,
    });

    // High resolution Esri World Street Map matching mobile app
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    ).addTo(map);

    // Custom Luxury Gold Pin Icon matching DALEEL mobile marker
    const goldPinHtml = `
      <div style="
        width: 34px;
        height: 34px;
        background: #DFB76C;
        border: 3px solid #07152B;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 6px 16px rgba(7,21,43,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: #07152B;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `;

    const markerIcon = L.divIcon({
      className: 'daleel-map-pin',
      html: goldPinHtml,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34],
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: markerIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Handle map click
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCurrentLat(lat);
      setCurrentLng(lng);
      onCoordinatesChange(lat, lng);
    });

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setCurrentLat(pos.lat);
      setCurrentLng(pos.lng);
      onCoordinatesChange(pos.lat, pos.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position if props change externally
  useEffect(() => {
    if (latitude && longitude && markerRef.current && mapInstanceRef.current) {
      if (latitude !== currentLat || longitude !== currentLng) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude], 14);
        setCurrentLat(latitude);
        setCurrentLng(longitude);
      }
    }
  }, [latitude, longitude]);

  // Search Address via OpenStreetMap Nominatim
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current || !markerRef.current) return;

    setIsSearching(true);
    try {
      const endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery + ', Ethiopia'
      )}&limit=1`;
      const res = await fetch(endpoint, {
        headers: { 'Accept-Language': 'en' },
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const resultLat = parseFloat(data[0].lat);
        const resultLng = parseFloat(data[0].lon);
        const displayName = data[0].display_name;

        mapInstanceRef.current.setView([resultLat, resultLng], 15);
        markerRef.current.setLatLng([resultLat, resultLng]);
        setCurrentLat(resultLat);
        setCurrentLng(resultLng);
        onCoordinatesChange(resultLat, resultLng, displayName);
      }
    } catch (err) {
      console.error('Failed to geocode search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHubSelect = (hubLat: number, hubLng: number, hubName: string) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    mapInstanceRef.current.setView([hubLat, hubLng], 14);
    markerRef.current.setLatLng([hubLat, hubLng]);
    setCurrentLat(hubLat);
    setCurrentLng(hubLng);
    onCoordinatesChange(hubLat, hubLng, `${hubName}, Ethiopia`);
  };

  return (
    <div style={styles.container}>
      {/* Top Search & Presets Toolbar */}
      <div style={styles.toolbar}>
        <form onSubmit={handleSearch} style={styles.searchForm}>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#8A9AA8" style={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search landmark, avenue, or city in Ethiopia..."
              style={styles.searchInput}
            />
          </div>
          <button type="submit" disabled={isSearching} style={styles.searchBtn}>
            {isSearching ? 'Locating...' : 'Search'}
          </button>
        </form>

        {/* Quick Regional Presets */}
        <div style={styles.presetsRow}>
          <span style={styles.presetLabel}>Quick Presets:</span>
          {ETHIOPIAN_HUBS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              style={styles.presetBtn}
              onClick={() => handleHubSelect(hub.lat, hub.lng, hub.name)}
            >
              {hub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas */}
      <div style={styles.mapWrap}>
        <div ref={mapContainerRef} style={styles.mapCanvas} />

        {/* Floating Coordinates Tag */}
        <div style={styles.floatingTag}>
          <Crosshair size={13} color="#07152B" />
          <span style={styles.floatingCoords}>
            {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
          </span>
        </div>
      </div>

      {/* Live Mobile App Preview Card */}
      <div style={styles.previewBox}>
        <div style={styles.previewHeader}>
          <Navigation size={14} color="#DFB76C" />
          <span style={styles.previewTitle}>LIVE MOBILE APP PREVIEW</span>
        </div>
        <div style={styles.previewCard}>
          <div style={styles.previewPinBox}>
            <MapPin size={18} color="#07152B" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={styles.previewName}>{title || 'Location Title'}</div>
            <div style={styles.previewAddress}>
              {address || `${currentLat.toFixed(4)}° N, ${currentLng.toFixed(4)}° E, Ethiopia`}
            </div>
          </div>
          <div style={styles.previewBadge}>
            <span>{currentLat.toFixed(3)}N, {currentLng.toFixed(3)}E</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    backgroundColor: '#FAFCFE',
    border: '1px solid #E4E9F0',
    borderRadius: '12px',
    padding: '16px',
  },
  toolbar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  searchForm: {
    display: 'flex',
    gap: '8px',
  },
  searchWrapper: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: '9px 12px 9px 36px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#07152B',
  },
  searchBtn: {
    padding: '9px 16px',
    backgroundColor: '#07152B',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
  },
  presetsRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '6px',
  },
  presetLabel: {
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#5A687A',
  },
  presetBtn: {
    padding: '4px 10px',
    backgroundColor: '#F0F3F8',
    border: '1px solid #E4E9F0',
    borderRadius: '9999px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#07152B',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  mapWrap: {
    position: 'relative',
    width: '100%',
    height: '280px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #E4E9F0',
  },
  mapCanvas: {
    width: '100%',
    height: '100%',
    backgroundColor: '#07152B',
  },
  floatingTag: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    zIndex: 400,
    backgroundColor: '#DFB76C',
    padding: '5px 12px',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 4px 12px rgba(7, 21, 43, 0.25)',
  },
  floatingCoords: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#07152B',
    letterSpacing: '0.03em',
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    padding: '12px',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '8px',
  },
  previewTitle: {
    fontSize: '10.5px',
    fontWeight: 800,
    color: '#8C6A21',
    letterSpacing: '0.05em',
  },
  previewCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  previewPinBox: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#DFB76C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#07152B',
  },
  previewAddress: {
    fontSize: '11.5px',
    color: '#5A687A',
    marginTop: '2px',
  },
  previewBadge: {
    backgroundColor: '#EAEFF8',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '10.5px',
    fontWeight: 700,
    color: '#07152B',
  },
};
