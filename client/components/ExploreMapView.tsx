import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Destination } from '../lib/api';
import { calculateDistanceKm, formatDistance, getCurrentUserLocation } from '../lib/location';
import { colors, fonts, radius, shadow, spacing } from '../theme/tokens';

export type MapLayerMode = 'streets' | 'satellite' | 'topographic';

type Props = {
  destinations: Destination[];
  userLatitude?: number | null;
  userLongitude?: number | null;
  style?: StyleProp<ViewStyle>;
};

function generateMultiMarkerMapHtml(
  destinations: { id: string; name: string; region: string; latitude: number; longitude: number; unesco: boolean }[],
  userLat?: number | null,
  userLng?: number | null,
  initialLayer: MapLayerMode = 'streets'
) {
  const safeDestinations = JSON.stringify(destinations);
  const hasUserCoords = typeof userLat === 'number' && typeof userLng === 'number' && userLat !== 0;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; background: #07152B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; overflow: hidden; }
    .leaflet-control-attribution { display: none !important; }
    
    /* Custom Luxury Gold Marker */
    .custom-gold-marker {
      position: relative;
      width: 32px;
      height: 32px;
      background: #DFB76C;
      border: 2.5px solid #07152B;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 14px rgba(7, 21, 43, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }
    .custom-gold-marker:hover, .custom-gold-marker.active {
      background: #F3D38C;
      transform: rotate(-45deg) scale(1.15);
      z-index: 1000 !important;
    }
    .custom-gold-marker::after {
      content: '';
      width: 10px;
      height: 10px;
      background: #07152B;
      border-radius: 50%;
      transform: rotate(45deg);
    }

    /* User GPS Pulsing Dot */
    .user-location-marker {
      width: 18px;
      height: 18px;
      background: #2563EB;
      border: 3px solid #FFFFFF;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.35), 0 2px 8px rgba(0,0,0,0.3);
      animation: pulseUser 2s infinite ease-out;
    }
    @keyframes pulseUser {
      0% { box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.6), 0 0 0 6px rgba(37, 99, 235, 0.2); }
      70% { box-shadow: 0 0 0 8px rgba(37, 99, 235, 0), 0 0 0 16px rgba(37, 99, 235, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0), 0 0 0 0 rgba(37, 99, 235, 0); }
    }

    /* Tooltip / Popup */
    .leaflet-popup-content-wrapper {
      background: #07152B;
      color: #FFFFFF;
      border-radius: 10px;
      border: 1px solid #DFB76C;
      box-shadow: 0 6px 20px rgba(0,0,0,0.6);
      padding: 2px;
    }
    .leaflet-popup-tip {
      background: #07152B;
      border: 1px solid #DFB76C;
    }
    .popup-content {
      padding: 6px 8px;
      text-align: center;
      min-width: 110px;
    }
    .popup-title {
      font-size: 13px;
      font-weight: 700;
      color: #DFB76C;
      margin-bottom: 2px;
    }
    .popup-sub {
      font-size: 10.5px;
      color: #CBD5E1;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var destinations = ${safeDestinations};
    var userLat = ${hasUserCoords ? userLat : 'null'};
    var userLng = ${hasUserCoords ? userLng : 'null'};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      zoomSnap: 0.5
    }).setView([9.145, 40.4896], 6);

    // 1. Street Map: Esri World Street Map
    var streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    });

    // 2. Satellite View: Esri World Imagery + Hybrid Boundaries Overlay
    var satelliteImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    });
    var labelsOverlay = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.95
    });
    var satelliteLayer = L.layerGroup([satelliteImagery, labelsOverlay]);

    // 3. Topographic View: Esri World Topo Map
    var topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    });

    // Initial layer selection
    var currentLayer = streetLayer;
    var initialMode = '${initialLayer}';
    if (initialMode === 'satellite') {
      currentLayer = satelliteLayer;
    } else if (initialMode === 'topographic') {
      currentLayer = topoLayer;
    }
    currentLayer.addTo(map);

    function switchLayer(mode) {
      map.removeLayer(currentLayer);
      if (mode === 'satellite') {
        currentLayer = satelliteLayer;
      } else if (mode === 'topographic') {
        currentLayer = topoLayer;
      } else {
        currentLayer = streetLayer;
      }
      currentLayer.addTo(map);
    }

    var markersGroup = L.featureGroup();

    // Custom Marker Icon
    var goldIcon = L.divIcon({
      className: 'gold-icon-container',
      html: '<div class="custom-gold-marker"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    // Add Destination Pins
    destinations.forEach(function(d) {
      if (d.latitude && d.longitude) {
        var marker = L.marker([d.latitude, d.longitude], { icon: goldIcon });
        marker.bindPopup(
          '<div class="popup-content">' +
            '<div class="popup-title">' + d.name + '</div>' +
            '<div class="popup-sub">' + (d.region ? d.region + ' Region' : 'Heritage Site') + '</div>' +
          '</div>'
        );
        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SELECT_DESTINATION',
              id: d.id
            }));
          }
        });
        markersGroup.addLayer(marker);
      }
    });

    markersGroup.addTo(map);

    // User Location Pin
    if (userLat !== null && userLng !== null) {
      var userIcon = L.divIcon({
        className: 'user-icon-container',
        html: '<div class="user-location-marker"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      var userMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
      userMarker.bindPopup('<div class="popup-content"><div class="popup-title" style="color:#60A5FA;">Your Location</div></div>');
    }

    // Auto-fit to all destinations
    if (destinations.length > 0 && markersGroup.getLayers().length > 0) {
      map.fitBounds(markersGroup.getBounds(), { padding: [50, 50], maxZoom: 13 });
    }

    // Bridge commands from React Native
    window.addEventListener('message', function(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'SET_LAYER') {
          switchLayer(data.mode);
        } else if (data.type === 'FLY_TO') {
          map.flyTo([data.lat, data.lng], data.zoom || 14, { duration: 1.2 });
        } else if (data.type === 'FIT_ALL') {
          if (markersGroup.getLayers().length > 0) {
            map.fitBounds(markersGroup.getBounds(), { padding: [50, 50], maxZoom: 13 });
          } else {
            map.setView([9.145, 40.4896], 6);
          }
        }
      } catch (e) {}
    });
  </script>
</body>
</html>`;
}

export const ExploreMapView: React.FC<Props> = ({
  destinations,
  userLatitude: propUserLat,
  userLongitude: propUserLng,
  style,
}) => {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [layerMode, setLayerMode] = useState<MapLayerMode>('streets');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(
    propUserLat && propUserLng ? { latitude: propUserLat, longitude: propUserLng } : null
  );
  const [isMapLoading, setIsMapLoading] = useState(true);

  // Animation for the preview drawer
  const drawerAnim = useRef(new Animated.Value(0)).current;

  // Fetch user location if not provided
  useEffect(() => {
    if (!userCoords) {
      getCurrentUserLocation()
        .then((loc) => {
          if (loc.granted && loc.latitude !== 0) {
            setUserCoords({ latitude: loc.latitude, longitude: loc.longitude });
          }
        })
        .catch(() => {});
    }
  }, [userCoords]);

  // Valid destinations with coordinates
  const mappedDestinations = useMemo(() => {
    return destinations
      .filter((d) => typeof d.latitude === 'number' && typeof d.longitude === 'number')
      .map((d) => ({
        id: d.id,
        name: d.name,
        region: d.region || 'Ethiopia',
        latitude: d.latitude!,
        longitude: d.longitude!,
        unesco: Boolean(d.unescoStatus),
      }));
  }, [destinations]);

  // When selection changes, slide drawer up
  useEffect(() => {
    if (selectedDestination) {
      Animated.spring(drawerAnim, {
        toValue: 1,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedDestination, drawerAnim]);

  // Handle messages from Leaflet map WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_DESTINATION') {
        const found = destinations.find((d) => d.id === data.id);
        if (found) {
          setSelectedDestination(found);
        }
      }
    } catch {
      // Ignore parse error
    }
  };

  const handleSetLayer = (mode: MapLayerMode) => {
    setLayerMode(mode);
    webViewRef.current?.postMessage(JSON.stringify({ type: 'SET_LAYER', mode }));
  };

  const handleRecenterEthiopia = () => {
    webViewRef.current?.postMessage(JSON.stringify({ type: 'FIT_ALL' }));
  };

  const handleRecenterUser = () => {
    if (userCoords) {
      webViewRef.current?.postMessage(
        JSON.stringify({
          type: 'FLY_TO',
          lat: userCoords.latitude,
          lng: userCoords.longitude,
          zoom: 13,
        })
      );
    }
  };

  // Calculate distance to selected destination
  const distanceText = useMemo(() => {
    if (!selectedDestination || !userCoords || !selectedDestination.latitude || !selectedDestination.longitude) {
      return null;
    }
    const km = calculateDistanceKm(
      userCoords.latitude,
      userCoords.longitude,
      selectedDestination.latitude,
      selectedDestination.longitude
    );
    return formatDistance(km);
  }, [selectedDestination, userCoords]);

  const mapHtml = useMemo(() => {
    return generateMultiMarkerMapHtml(
      mappedDestinations,
      userCoords?.latitude,
      userCoords?.longitude,
      layerMode
    );
  }, [mappedDestinations, userCoords?.latitude, userCoords?.longitude, layerMode]);

  const translateY = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [220, 0],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Leaflet Webview */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.webView}
        onLoadEnd={() => setIsMapLoading(false)}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
      />

      {/* Loading overlay */}
      {isMapLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#DFB76C" />
          <Text style={styles.loadingText}>Rendering Heritage Map...</Text>
        </View>
      )}

      {/* Floating Map Controls Bar (Top Right) */}
      <View style={styles.controlsBar}>
        {/* Layer Switcher */}
        <View style={styles.layerSelector}>
          <TouchableOpacity
            style={[styles.layerBtn, layerMode === 'streets' && styles.layerBtnActive]}
            onPress={() => handleSetLayer('streets')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="map-outline"
              size={13}
              color={layerMode === 'streets' ? '#07152B' : '#64748B'}
            />
            <Text style={[styles.layerBtnText, layerMode === 'streets' && styles.layerBtnTextActive]}>
              Streets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.layerBtn, layerMode === 'satellite' && styles.layerBtnActive]}
            onPress={() => handleSetLayer('satellite')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="earth-outline"
              size={13}
              color={layerMode === 'satellite' ? '#07152B' : '#64748B'}
            />
            <Text style={[styles.layerBtnText, layerMode === 'satellite' && styles.layerBtnTextActive]}>
              Satellite
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.layerBtn, layerMode === 'topographic' && styles.layerBtnActive]}
            onPress={() => handleSetLayer('topographic')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trail-sign-outline"
              size={13}
              color={layerMode === 'topographic' ? '#07152B' : '#64748B'}
            />
            <Text style={[styles.layerBtnText, layerMode === 'topographic' && styles.layerBtnTextActive]}>
              Topo
            </Text>
          </TouchableOpacity>
        </View>

        {/* GPS & Focus Action Buttons */}
        <View style={styles.actionButtonsCol}>
          <TouchableOpacity
            style={styles.actionCircleBtn}
            onPress={handleRecenterEthiopia}
            activeOpacity={0.8}
          >
            <Ionicons name="expand-outline" size={17} color="#07152B" />
          </TouchableOpacity>

          {userCoords && (
            <TouchableOpacity
              style={styles.actionCircleBtn}
              onPress={handleRecenterUser}
              activeOpacity={0.8}
            >
              <Ionicons name="locate" size={17} color="#2563EB" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Proximity Explorer Site Count Pill (Top Left) */}
      <View style={styles.pinCountBadge}>
        <Ionicons name="location" size={13} color="#DFB76C" />
        <Text style={styles.pinCountText}>
          {mappedDestinations.length} Heritage Sites Pinned
        </Text>
      </View>

      {/* Bottom Floating Destination Preview Drawer */}
      {selectedDestination && (
        <Animated.View style={[styles.drawerCard, { transform: [{ translateY }] }]}>
          <View style={styles.drawerInner}>
            <Image
              source={{ uri: selectedDestination.image }}
              style={styles.drawerImage}
              resizeMode="cover"
            />

            <View style={styles.drawerMeta}>
              <View style={styles.drawerTitleRow}>
                <Text style={styles.drawerTitle} numberOfLines={1}>
                  {selectedDestination.name}
                </Text>
                <TouchableOpacity
                  style={styles.drawerCloseBtn}
                  onPress={() => setSelectedDestination(null)}
                >
                  <Ionicons name="close" size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.drawerRegion}>{selectedDestination.region} Region</Text>

              {/* Distance and UNESCO Strip */}
              <View style={styles.drawerPillsRow}>
                {distanceText && (
                  <View style={styles.distanceChip}>
                    <Ionicons name="navigate-outline" size={11} color="#07152B" />
                    <Text style={styles.distanceText}>{distanceText} away</Text>
                  </View>
                )}

                {selectedDestination.unescoStatus && (
                  <View style={styles.unescoChip}>
                    <Ionicons name="ribbon" size={11} color="#8C6A21" />
                    <Text style={styles.unescoText}>UNESCO</Text>
                  </View>
                )}

                {selectedDestination.rating ? (
                  <View style={styles.ratingChip}>
                    <Ionicons name="star" size={11} color="#DFB76C" />
                    <Text style={styles.ratingText}>{selectedDestination.rating.toFixed(1)}</Text>
                  </View>
                ) : null}
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.push(`/destination/${selectedDestination.id}` as any)}
                activeOpacity={0.88}
              >
                <Text style={styles.exploreBtnText}>Explore Heritage Site</Text>
                <Ionicons name="arrow-forward" size={14} color="#07152B" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07152B',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#07152B',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#07152B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 12,
  },
  loadingText: {
    color: '#DFB76C',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.bodyMedium,
  },
  controlsBar: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 20,
    alignItems: 'flex-end',
    gap: 10,
  },
  layerSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 9999,
    padding: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  layerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 9999,
  },
  layerBtnActive: {
    backgroundColor: '#DFB76C',
  },
  layerBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  layerBtnTextActive: {
    color: '#07152B',
  },
  actionButtonsCol: {
    flexDirection: 'column',
    gap: 8,
  },
  actionCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  pinCountBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(7, 21, 43, 0.92)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pinCountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: fonts.bodyMedium,
  },
  drawerCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    ...shadow.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawerInner: {
    flexDirection: 'row',
    gap: 14,
  },
  drawerImage: {
    width: 90,
    height: 105,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  drawerMeta: {
    flex: 1,
    justifyContent: 'space-between',
  },
  drawerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#07152B',
    fontFamily: fonts.heading,
    flex: 1,
    marginRight: 6,
  },
  drawerCloseBtn: {
    padding: 2,
  },
  drawerRegion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -2,
  },
  drawerPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
    flexWrap: 'wrap',
  },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 7,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  distanceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  unescoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 7,
    backgroundColor: '#FEF9EE',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F6E5B8',
  },
  unescoText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#8C6A21',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#07152B',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#DFB76C',
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 4,
  },
  exploreBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#07152B',
  },
});
