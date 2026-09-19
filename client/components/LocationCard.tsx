import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import {
  calculateDistanceKm,
  formatDistance,
  getCurrentUserLocation,
  openDirectionsInMaps,
} from '../lib/location';

export type MapLayerMode = 'streets' | 'satellite' | 'topographic';

type Props = {
  title: string;
  address?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  userLatitude?: number | null;
  userLongitude?: number | null;
  initialLayer?: MapLayerMode;
  style?: StyleProp<ViewStyle>;
};

function generateMapHtml(
  lat: number,
  lng: number,
  title: string,
  address: string,
  zoom: number = 14,
  showZoomControl: boolean = false,
  initialLayer: MapLayerMode = 'streets'
) {
  const safeTitle = JSON.stringify(title);
  const safeAddress = JSON.stringify(address || '');

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
    .custom-marker {
      width: 32px;
      height: 32px;
      background: #DFB76C;
      border: 3px solid #07152B;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .custom-marker::after {
      content: '';
      width: 10px;
      height: 10px;
      background: #07152B;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .leaflet-popup-content-wrapper {
      background: #07152B;
      color: #FFFFFF;
      border-radius: 10px;
      border: 1px solid #DFB76C;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      padding: 2px;
    }
    .leaflet-popup-tip {
      background: #07152B;
      border: 1px solid #DFB76C;
    }
    .popup-title {
      font-size: 13px;
      font-weight: 700;
      color: #DFB76C;
      margin-bottom: 2px;
    }
    .popup-desc {
      font-size: 11px;
      color: #EAEFF8;
      line-height: 14px;
    }
    .leaflet-bar a {
      background-color: #07152B !important;
      color: #DFB76C !important;
      border-color: rgba(223, 183, 108, 0.3) !important;
    }
    .leaflet-bar a:hover {
      background-color: #13284F !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var lat = ${lat};
    var lng = ${lng};
    var title = ${safeTitle};
    var address = ${safeAddress};

    var map = L.map('map', {
      zoomControl: ${showZoomControl ? 'true' : 'false'},
      attributionControl: false,
      zoomSnap: 0.5
    }).setView([lat, lng], ${zoom});

    // 1. Street Map: Esri World Street Map (High resolution street level)
    var streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    });

    // 2. Satellite View: Esri World Imagery + Hybrid Boundaries & Places Overlay
    var satelliteImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    });
    var labelsOverlay = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      opacity: 0.95
    });
    var satelliteLayer = L.layerGroup([satelliteImagery, labelsOverlay]);

    // 3. Topographic View: Esri World Topo Map (Elevation contours & mountain terrain)
    var topoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Esri'
    });

    // Set initial layer
    var initialMode = '${initialLayer}';
    if (initialMode === 'satellite') {
      satelliteLayer.addTo(map);
    } else if (initialMode === 'topographic') {
      topoLayer.addTo(map);
    } else {
      streetLayer.addTo(map);
    }

    // Dynamic layer switcher called from React Native
    window.switchLayer = function(mode) {
      if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
      if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
      if (map.hasLayer(topoLayer)) map.removeLayer(topoLayer);

      if (mode === 'satellite') {
        satelliteLayer.addTo(map);
      } else if (mode === 'topographic') {
        topoLayer.addTo(map);
      } else {
        streetLayer.addTo(map);
      }
    };

    var markerIcon = L.divIcon({
      className: 'marker-wrap',
      html: '<div class="custom-marker"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    var marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
    marker.bindPopup('<div class="popup-title">' + title + '</div><div class="popup-desc">' + address + '</div>');
    setTimeout(function() { marker.openPopup(); }, 350);
  </script>
</body>
</html>`;
}

export function LocationCard({
  title,
  address,
  region,
  latitude,
  longitude,
  userLatitude,
  userLongitude,
  initialLayer = 'streets',
  style,
}: Props) {
  const [liveUserLat, setLiveUserLat] = useState<number | null>(userLatitude ?? null);
  const [liveUserLon, setLiveUserLon] = useState<number | null>(userLongitude ?? null);
  const [calculatingDist, setCalculatingDist] = useState<boolean>(false);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState<boolean>(false);
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  const [layerMode, setLayerMode] = useState<MapLayerMode>(initialLayer);

  const embeddedWebRef = useRef<WebView>(null);
  const fullscreenWebRef = useRef<WebView>(null);

  useEffect(() => {
    if (userLatitude && userLongitude) {
      setLiveUserLat(userLatitude);
      setLiveUserLon(userLongitude);
      return;
    }

    let isMounted = true;
    if (latitude && longitude) {
      setCalculatingDist(true);
      getCurrentUserLocation()
        .then((res) => {
          if (isMounted && res.granted && res.latitude && res.longitude) {
            setLiveUserLat(res.latitude);
            setLiveUserLon(res.longitude);
          }
        })
        .finally(() => {
          if (isMounted) setCalculatingDist(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, userLatitude, userLongitude]);

  const hasCoords = typeof latitude === 'number' && typeof longitude === 'number' && latitude !== 0;

  const distanceText =
    hasCoords && liveUserLat && liveUserLon
      ? formatDistance(calculateDistanceKm(liveUserLat, liveUserLon, latitude, longitude))
      : null;

  const displayAddress = address || region || 'Ethiopia';

  const embeddedMapHtml = useMemo(() => {
    if (!hasCoords) return '';
    return generateMapHtml(latitude, longitude, title, displayAddress, 13.5, false, layerMode);
  }, [hasCoords, latitude, longitude, title, displayAddress, layerMode]);

  const fullscreenMapHtml = useMemo(() => {
    if (!hasCoords) return '';
    return generateMapHtml(latitude, longitude, title, displayAddress, 15, true, layerMode);
  }, [hasCoords, latitude, longitude, title, displayAddress, layerMode]);

  const handleSwitchLayer = (mode: MapLayerMode) => {
    setLayerMode(mode);
    embeddedWebRef.current?.injectJavaScript(`window.switchLayer && window.switchLayer('${mode}'); true;`);
    fullscreenWebRef.current?.injectJavaScript(`window.switchLayer && window.switchLayer('${mode}'); true;`);
  };

  const handleOpenNativeDirections = () => {
    if (hasCoords) {
      openDirectionsInMaps(latitude, longitude, title);
    } else if (address || region) {
      const searchTarget = [title, address, region].filter(Boolean).join(', ');
      openDirectionsInMaps(9.0105, 38.7615, searchTarget);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Interactive Map Header */}
      <View style={styles.mapCanvasContainer}>
        {hasCoords ? (
          <>
            <WebView
              ref={embeddedWebRef}
              originWhitelist={['*']}
              source={{ html: embeddedMapHtml }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              onLoadEnd={() => setMapLoading(false)}
            />

            {mapLoading && (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="small" color={colors.gold} />
              </View>
            )}

            {/* Top Badges Row */}
            <View style={styles.topBadgesRow} pointerEvents="box-none">
              <View style={styles.coordBadge}>
                <Feather name="crosshair" size={11} color={colors.gold} />
                <Text style={styles.coordBadgeText}>
                  {latitude.toFixed(4)}N, {longitude.toFixed(4)}E
                </Text>
              </View>

              <TouchableOpacity
                style={styles.expandMapIconBtn}
                onPress={() => setIsFullscreenModalOpen(true)}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="maximize-2" size={12} color={colors.navy} />
                <Text style={styles.expandMapIconBtnText}>Expand</Text>
              </TouchableOpacity>
            </View>

            {/* Floating GIS Map Layer Switcher Dock on Embedded Card */}
            <View style={styles.floatingLayerDock} pointerEvents="box-none">
              <View style={styles.layerPillGroup}>
                <TouchableOpacity
                  style={[styles.layerChipBtn, layerMode === 'streets' && styles.layerChipBtnActive]}
                  onPress={() => handleSwitchLayer('streets')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="map-outline"
                    size={11}
                    color={layerMode === 'streets' ? colors.navy : '#CAD5E2'}
                  />
                  <Text
                    style={[
                      styles.layerChipBtnText,
                      layerMode === 'streets' && styles.layerChipBtnTextActive,
                    ]}
                  >
                    Streets
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.layerChipBtn, layerMode === 'satellite' && styles.layerChipBtnActive]}
                  onPress={() => handleSwitchLayer('satellite')}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="planet-outline"
                    size={11}
                    color={layerMode === 'satellite' ? colors.navy : '#CAD5E2'}
                  />
                  <Text
                    style={[
                      styles.layerChipBtnText,
                      layerMode === 'satellite' && styles.layerChipBtnTextActive,
                    ]}
                  >
                    Satellite
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.layerChipBtn, layerMode === 'topographic' && styles.layerChipBtnActive]}
                  onPress={() => handleSwitchLayer('topographic')}
                  activeOpacity={0.85}
                >
                  <Feather
                    name="triangle"
                    size={10}
                    color={layerMode === 'topographic' ? colors.navy : '#CAD5E2'}
                  />
                  <Text
                    style={[
                      styles.layerChipBtnText,
                      layerMode === 'topographic' && styles.layerChipBtnTextActive,
                    ]}
                  >
                    Topo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Distance & Region Pill */}
            <View style={styles.bottomBadgesRow} pointerEvents="box-none">
              <View style={styles.regionTag}>
                <Text style={styles.regionTagText} numberOfLines={1}>
                  {region || 'Ethiopia'}
                </Text>
              </View>

              {distanceText ? (
                <View style={styles.distanceBadge}>
                  <Feather name="navigation" size={10} color={colors.onNavy} />
                  <Text style={styles.distanceBadgeText}>{distanceText}</Text>
                </View>
              ) : calculatingDist ? (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceBadgeText}>Calculating distance...</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : (
          /* Fallback Decorative Canvas if coordinates are unavailable */
          <View style={styles.fallbackCanvas}>
            <View style={styles.markerCenter}>
              <Feather name="map-pin" size={20} color={colors.navy} />
            </View>
            <Text style={styles.fallbackText}>{region || 'Ethiopia'}</Text>
          </View>
        )}
      </View>

      {/* Info and Dual Action Buttons */}
      <View style={styles.infoContent}>
        <View style={styles.locationMeta}>
          <View style={styles.metaIconCircle}>
            <Feather name="map-pin" size={16} color={colors.goldRich} />
          </View>
          <View style={styles.metaDetails}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.locationAddress} numberOfLines={2}>
              {displayAddress}
            </Text>
          </View>
        </View>

        {/* Dual Actions: 1) In-App Interactive Map  2) Native GPS Directions */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.exploreMapButton}
            onPress={() => setIsFullscreenModalOpen(true)}
            activeOpacity={0.85}
          >
            <Feather name="compass" size={15} color={colors.navy} />
            <Text style={styles.exploreMapButtonText}>Explore Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.directionsButton}
            onPress={handleOpenNativeDirections}
            activeOpacity={0.85}
          >
            <Feather name="navigation-2" size={15} color={colors.navy} />
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full-Screen Interactive In-App Map Modal */}
      <Modal
        visible={isFullscreenModalOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsFullscreenModalOpen(false)}
      >
        <SafeAreaView style={styles.fullscreenModalContainer}>
          <StatusBar barStyle="light-content" backgroundColor={colors.navyDeep} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalBackBtn}
              onPress={() => setIsFullscreenModalOpen(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.modalHeaderTitleWrap}>
              <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.modalHeaderSubtitle} numberOfLines={1}>
                {hasCoords ? `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E` : displayAddress}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalDirectionsBtn}
              onPress={handleOpenNativeDirections}
              activeOpacity={0.85}
            >
              <Feather name="navigation" size={15} color={colors.navy} />
            </TouchableOpacity>
          </View>

          {/* Fullscreen Interactive WebView with Floating Segmented Dock */}
          <View style={styles.modalMapArea}>
            {hasCoords ? (
              <>
                <WebView
                  ref={fullscreenWebRef}
                  originWhitelist={['*']}
                  source={{ html: fullscreenMapHtml }}
                  style={styles.fullscreenWebView}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                />

                {/* Floating GIS Switcher Dock in Fullscreen Modal */}
                <View style={styles.modalFloatingDockWrap} pointerEvents="box-none">
                  <View style={styles.modalLayerDockPill}>
                    <TouchableOpacity
                      style={[
                        styles.modalLayerChipBtn,
                        layerMode === 'streets' && styles.modalLayerChipBtnActive,
                      ]}
                      onPress={() => handleSwitchLayer('streets')}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="map-outline"
                        size={13}
                        color={layerMode === 'streets' ? colors.navy : '#CAD5E2'}
                      />
                      <Text
                        style={[
                          styles.modalLayerChipBtnText,
                          layerMode === 'streets' && styles.modalLayerChipBtnTextActive,
                        ]}
                      >
                        Streets
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modalLayerChipBtn,
                        layerMode === 'satellite' && styles.modalLayerChipBtnActive,
                      ]}
                      onPress={() => handleSwitchLayer('satellite')}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="planet-outline"
                        size={13}
                        color={layerMode === 'satellite' ? colors.navy : '#CAD5E2'}
                      />
                      <Text
                        style={[
                          styles.modalLayerChipBtnText,
                          layerMode === 'satellite' && styles.modalLayerChipBtnTextActive,
                        ]}
                      >
                        Satellite
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modalLayerChipBtn,
                        layerMode === 'topographic' && styles.modalLayerChipBtnActive,
                      ]}
                      onPress={() => handleSwitchLayer('topographic')}
                      activeOpacity={0.85}
                    >
                      <Feather
                        name="triangle"
                        size={12}
                        color={layerMode === 'topographic' ? colors.navy : '#CAD5E2'}
                      />
                      <Text
                        style={[
                          styles.modalLayerChipBtnText,
                          layerMode === 'topographic' && styles.modalLayerChipBtnTextActive,
                        ]}
                      >
                        Topographic
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : null}

            {/* Bottom Floating Info Card inside Fullscreen Modal */}
            <View style={styles.modalFloatingCard}>
              <View style={styles.modalFloatingHeader}>
                <View style={styles.modalFloatingIconBox}>
                  <Feather name="map-pin" size={16} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFloatingTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.modalFloatingAddress} numberOfLines={2}>
                    {displayAddress}
                  </Text>
                </View>
                {distanceText ? (
                  <View style={styles.modalDistanceBadge}>
                    <Text style={styles.modalDistanceText}>{distanceText}</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.modalPrimaryDirectionsBtn}
                onPress={handleOpenNativeDirections}
                activeOpacity={0.88}
              >
                <Feather name="navigation-2" size={16} color={colors.navy} style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryDirectionsText}>
                  Start Navigation in Maps
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  mapCanvasContainer: {
    height: 210,
    backgroundColor: colors.navyDeep,
    position: 'relative',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.navyDeep,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBadgesRow: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7,21,43,0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(223,183,108,0.4)',
  },
  coordBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  expandMapIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    ...shadow.card,
  },
  expandMapIconBtnText: {
    color: colors.navy,
    fontSize: 10.5,
    fontWeight: '700',
  },
  floatingLayerDock: {
    position: 'absolute',
    top: 38,
    right: spacing.sm,
    zIndex: 11,
  },
  layerPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7,21,43,0.90)',
    borderRadius: radius.full,
    padding: 2.5,
    borderWidth: 1,
    borderColor: 'rgba(223,183,108,0.35)',
    ...shadow.card,
  },
  layerChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  layerChipBtnActive: {
    backgroundColor: colors.gold,
  },
  layerChipBtnText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#CAD5E2',
  },
  layerChipBtnTextActive: {
    color: colors.navy,
    fontWeight: '700',
  },
  bottomBadgesRow: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  regionTag: {
    backgroundColor: 'rgba(7,21,43,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  regionTagText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7,21,43,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  distanceBadgeText: {
    color: colors.onNavy,
    fontSize: 10,
    fontWeight: '600',
  },
  fallbackCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.navyDeep,
    gap: 8,
  },
  fallbackText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  markerCenter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaDetails: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.charcoal,
  },
  locationAddress: {
    fontSize: 12,
    color: colors.charcoalSub,
    marginTop: 2,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  exploreMapButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  exploreMapButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.2,
  },
  directionsButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.goldButton,
    paddingVertical: 10,
    borderRadius: radius.md,
    ...shadow.button,
  },
  directionsButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.2,
  },

  // Fullscreen Modal Styles
  fullscreenModalContainer: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.navyDeep,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitleWrap: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalHeaderSubtitle: {
    fontSize: 11,
    color: colors.gold,
    marginTop: 2,
  },
  modalDirectionsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.card,
  },
  modalMapArea: {
    flex: 1,
    position: 'relative',
  },
  fullscreenWebView: {
    flex: 1,
    backgroundColor: colors.navyDeep,
  },
  modalFloatingDockWrap: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    zIndex: 20,
  },
  modalLayerDockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7,21,43,0.92)',
    borderRadius: radius.full,
    padding: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(223,183,108,0.45)',
    ...shadow.modal,
  },
  modalLayerChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  modalLayerChipBtnActive: {
    backgroundColor: colors.gold,
  },
  modalLayerChipBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#CAD5E2',
  },
  modalLayerChipBtnTextActive: {
    color: colors.navy,
    fontWeight: '700',
  },
  modalFloatingCard: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.modal,
  },
  modalFloatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalFloatingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.goldSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFloatingTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.charcoal,
  },
  modalFloatingAddress: {
    fontSize: 12,
    color: colors.charcoalSub,
    marginTop: 2,
  },
  modalDistanceBadge: {
    backgroundColor: colors.navySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  modalDistanceText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.navy,
  },
  modalPrimaryDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldButton,
    paddingVertical: 12,
    borderRadius: radius.md,
    ...shadow.button,
  },
  modalPrimaryDirectionsText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.2,
  },
});
