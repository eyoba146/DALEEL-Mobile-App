import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Crosshair, Navigation, X, Check, Loader2, Map, Globe, Mountain } from 'lucide-react';

export type MapLayerMode = 'streets' | 'satellite' | 'topographic';

interface LayerConfig {
  name: string;
  url: string;
  labelsUrl?: string;
  attribution: string;
  maxZoom: number;
}

const TILE_LAYERS: Record<MapLayerMode, LayerConfig> = {
  streets: {
    name: 'Streets',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Street Map',
    maxZoom: 19,
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Imagery & Labels',
    maxZoom: 19,
  },
  topographic: {
    name: 'Topographic',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Topo Map',
    maxZoom: 19,
  },
};

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  address?: string;
  title?: string;
  onCoordinatesChange: (lat: number, lng: number, address?: string) => void;
}

interface SearchResultItem {
  lat: number;
  lng: number;
  displayName: string;
}

const ETHIOPIAN_HUBS = [
  { name: 'Addis Ababa (Bole)', lat: 9.0105, lng: 38.7615 },
  { name: 'Addis Ababa (Piazza)', lat: 9.0350, lng: 38.7520 },
  { name: 'Lalibela', lat: 12.0322, lng: 39.0416 },
  { name: 'Gondar (Fasil Ghebbi)', lat: 12.6075, lng: 37.4667 },
  { name: 'Simien Mountains', lat: 13.1833, lng: 38.0667 },
  { name: 'Hawassa', lat: 7.0504, lng: 38.4763 },
  { name: 'Harar (Jugol)', lat: 9.3139, lng: 42.1278 },
  { name: 'Bahir Dar (Lake Tana)', lat: 11.5936, lng: 37.3908 },
  { name: 'Axum', lat: 14.1264, lng: 38.7217 },
  { name: 'Arba Minch', lat: 6.0333, lng: 37.5500 },
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
  const [currentAddress, setCurrentAddress] = useState<string>(address || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchNotice, setSearchNotice] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const [activeLayer, setActiveLayer] = useState<MapLayerMode>(() => {
    return (localStorage.getItem('daleel_admin_map_layer') as MapLayerMode) || 'streets';
  });
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const currentLabelsLayerRef = useRef<L.TileLayer | null>(null);

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

    // Initialize active layer (Streets, Satellite, or Topographic)
    const initialConfig = TILE_LAYERS[activeLayer] || TILE_LAYERS.streets;
    const baseTileLayer = L.tileLayer(initialConfig.url, {
      maxZoom: initialConfig.maxZoom,
    }).addTo(map);
    currentTileLayerRef.current = baseTileLayer;

    if (activeLayer === 'satellite' && initialConfig.labelsUrl) {
      const labelsLayer = L.tileLayer(initialConfig.labelsUrl, {
        maxZoom: initialConfig.maxZoom,
        opacity: 0.9,
      }).addTo(map);
      currentLabelsLayerRef.current = labelsLayer;
    }

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
      setShowDropdown(false);
      onCoordinatesChange(lat, lng);
    });

    // Handle marker drag
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setCurrentLat(pos.lat);
      setCurrentLng(pos.lng);
      setShowDropdown(false);
      onCoordinatesChange(pos.lat, pos.lng);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      currentTileLayerRef.current = null;
      currentLabelsLayerRef.current = null;
    };
  }, []);

  // Switch Layer Handler (Streets | Satellite | Topographic)
  const handleLayerSwitch = (mode: MapLayerMode) => {
    if (!mapInstanceRef.current || mode === activeLayer) return;
    setActiveLayer(mode);
    localStorage.setItem('daleel_admin_map_layer', mode);

    if (currentTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
      currentTileLayerRef.current = null;
    }
    if (currentLabelsLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentLabelsLayerRef.current);
      currentLabelsLayerRef.current = null;
    }

    const cfg = TILE_LAYERS[mode];
    const newTileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
    }).addTo(mapInstanceRef.current);
    currentTileLayerRef.current = newTileLayer;

    if (mode === 'satellite' && cfg.labelsUrl) {
      const labelsLayer = L.tileLayer(cfg.labelsUrl, {
        maxZoom: cfg.maxZoom,
        opacity: 0.9,
      }).addTo(mapInstanceRef.current);
      currentLabelsLayerRef.current = labelsLayer;
    }

    if (markerRef.current) {
      markerRef.current.setZIndexOffset(1000);
    }
  };

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
    if (address) {
      setCurrentAddress(address);
    }
  }, [latitude, longitude, address]);

  // Robust Search Handler (NO FORM, NEVER RESETS PAGE OR TAB)
  const executeSearch = async () => {
    const term = searchQuery.trim();
    if (!term || !mapInstanceRef.current || !markerRef.current) return;

    setIsSearching(true);
    setSearchNotice('');
    setSearchResults([]);

    try {
      // 1. First attempt: Search within Ethiopia
      let endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        term + ', Ethiopia'
      )}&limit=5`;
      let res = await fetch(endpoint, {
        headers: { 'Accept-Language': 'en' },
      });
      let data = await res.json();

      // 2. Second attempt: Fallback to exact search query if no results
      if (!data || data.length === 0) {
        endpoint = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          term
        )}&limit=5`;
        res = await fetch(endpoint, {
          headers: { 'Accept-Language': 'en' },
        });
        data = await res.json();
      }

      if (data && data.length > 0) {
        const results: SearchResultItem[] = data.map((item: any) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          displayName: item.display_name,
        }));

        setSearchResults(results);
        setShowDropdown(true);

        // Instantly fly to the best result
        const best = results[0];
        mapInstanceRef.current.flyTo([best.lat, best.lng], 15, { duration: 1.2 });
        markerRef.current.setLatLng([best.lat, best.lng]);
        setCurrentLat(best.lat);
        setCurrentLng(best.lng);
        setCurrentAddress(best.displayName);
        onCoordinatesChange(best.lat, best.lng, best.displayName);
      } else {
        setSearchNotice(
          `No coordinates found for "${term}". Try searching for a known city, landmark, or district (e.g. Bole, Lalibela, Meskel Square), or click the map directly.`
        );
        setShowDropdown(false);
      }
    } catch (err: any) {
      console.error('Failed to geocode location:', err);
      setSearchNotice('Location search is temporarily unavailable. Please click anywhere on the map to set coordinates.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: SearchResultItem) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    mapInstanceRef.current.flyTo([result.lat, result.lng], 15, { duration: 1.0 });
    markerRef.current.setLatLng([result.lat, result.lng]);
    setCurrentLat(result.lat);
    setCurrentLng(result.lng);
    setCurrentAddress(result.displayName);
    setShowDropdown(false);
    onCoordinatesChange(result.lat, result.lng, result.displayName);
  };

  const handleHubSelect = (hubLat: number, hubLng: number, hubName: string) => {
    if (!mapInstanceRef.current || !markerRef.current) return;
    mapInstanceRef.current.flyTo([hubLat, hubLng], 14, { duration: 1.0 });
    markerRef.current.setLatLng([hubLat, hubLng]);
    setCurrentLat(hubLat);
    setCurrentLng(hubLng);
    const addr = `${hubName}, Ethiopia`;
    setCurrentAddress(addr);
    setShowDropdown(false);
    onCoordinatesChange(hubLat, hubLng, addr);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchNotice('');
    setShowDropdown(false);
  };

  return (
    <div style={styles.container}>
      {/* Top Search & Presets Toolbar (NON-FORM TO PREVENT ANY TAB RESET) */}
      <div style={styles.toolbar}>
        <div style={styles.searchRow}>
          <div style={styles.searchWrapper}>
            <Search size={16} color="#8A9AA8" style={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  executeSearch();
                }
              }}
              placeholder="Search landmark, avenue, or city in Ethiopia..."
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                style={styles.clearSearchBtn}
                onClick={clearSearch}
                title="Clear search"
              >
                <X size={14} color="#5A687A" />
              </button>
            )}
          </div>

          <button
            type="button"
            disabled={isSearching}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              executeSearch();
            }}
            style={styles.searchBtn}
          >
            {isSearching ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Search size={14} />
                <span>Search Location</span>
              </>
            )}
          </button>
        </div>

        {/* Location Suggestions Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div style={styles.resultsDropdown}>
            <div style={styles.dropdownHeader}>
              <span>Matching Locations ({searchResults.length})</span>
              <button
                type="button"
                style={styles.closeDropdownBtn}
                onClick={() => setShowDropdown(false)}
              >
                <X size={13} />
              </button>
            </div>
            {searchResults.map((res, idx) => (
              <div
                key={idx}
                style={styles.resultItem}
                onClick={() => handleSelectResult(res)}
              >
                <MapPin size={14} color="#DFB76C" style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.resultName}>{res.displayName.split(',')[0]}</div>
                  <div style={styles.resultFullAddress}>{res.displayName}</div>
                </div>
                <div style={styles.resultCoordTag}>
                  {res.lat.toFixed(3)}N, {res.lng.toFixed(3)}E
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Notice / Guidance */}
        {searchNotice && (
          <div style={styles.noticeBanner}>
            <span>{searchNotice}</span>
          </div>
        )}

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

        {/* Floating Map Layer Switcher Dock */}
        <div style={styles.layerSwitcherDock}>
          <button
            type="button"
            style={{
              ...styles.layerBtn,
              ...(activeLayer === 'streets' ? styles.layerBtnActive : {}),
            }}
            onClick={() => handleLayerSwitch('streets')}
            title="Standard High-Res Street Map"
          >
            <Map size={12} />
            <span>Streets</span>
          </button>
          <button
            type="button"
            style={{
              ...styles.layerBtn,
              ...(activeLayer === 'satellite' ? styles.layerBtnActive : {}),
            }}
            onClick={() => handleLayerSwitch('satellite')}
            title="High-Resolution Satellite Imagery"
          >
            <Globe size={12} />
            <span>Satellite</span>
          </button>
          <button
            type="button"
            style={{
              ...styles.layerBtn,
              ...(activeLayer === 'topographic' ? styles.layerBtnActive : {}),
            }}
            onClick={() => handleLayerSwitch('topographic')}
            title="Topographic Terrain & Elevation Relief"
          >
            <Mountain size={12} />
            <span>Topographic</span>
          </button>
        </div>

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
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.previewName}>{title || 'Location Title'}</div>
            <div style={styles.previewAddress}>
              {currentAddress || `${currentLat.toFixed(4)}° N, ${currentLng.toFixed(4)}° E, Ethiopia`}
            </div>
          </div>
          <div style={styles.previewBadge}>
            <Check size={11} color="#16803C" style={{ marginRight: '3px' }} />
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
  searchRow: {
    display: 'flex',
    gap: '8px',
    position: 'relative',
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
    padding: '9px 36px 9px 36px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#07152B',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px',
  },
  searchBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    backgroundColor: '#07152B',
    color: '#FFFFFF',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  resultsDropdown: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #DFB76C',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(7, 21, 43, 0.12)',
    overflow: 'hidden',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  dropdownHeader: {
    padding: '8px 12px',
    backgroundColor: '#FAFCFE',
    borderBottom: '1px solid #E4E9F0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    fontWeight: 700,
    color: '#8C6A21',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  closeDropdownBtn: {
    background: 'none',
    border: 'none',
    color: '#8A9AA8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 14px',
    borderBottom: '1px solid #F0F3F8',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
  },
  resultName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#07152B',
  },
  resultFullAddress: {
    fontSize: '11px',
    color: '#5A687A',
    marginTop: '2px',
    lineHeight: 1.35,
  },
  resultCoordTag: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#8C6A21',
    backgroundColor: '#F8F4EC',
    padding: '3px 7px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  noticeBanner: {
    backgroundColor: '#F8F4EC',
    border: '1px solid #E0C582',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#8C6A21',
    lineHeight: 1.4,
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
    height: '310px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #E4E9F0',
  },
  layerSwitcherDock: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 21, 43, 0.88)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(223, 183, 108, 0.4)',
    borderRadius: '8px',
    padding: '3px',
    gap: '2px',
    boxShadow: '0 4px 14px rgba(7, 21, 43, 0.35)',
  },
  layerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#E2E8F0',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.16s ease',
  },
  layerBtnActive: {
    backgroundColor: '#DFB76C',
    color: '#07152B',
    fontWeight: 750,
    boxShadow: '0 1px 6px rgba(223, 183, 108, 0.4)',
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
