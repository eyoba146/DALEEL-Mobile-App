import React, { useEffect, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import {
  calculateDistanceKm,
  formatDistance,
  getCurrentUserLocation,
  openDirectionsInMaps,
} from '../lib/location';

type Props = {
  title: string;
  address?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  userLatitude?: number | null;
  userLongitude?: number | null;
  style?: StyleProp<ViewStyle>;
};

export function LocationCard({
  title,
  address,
  region,
  latitude,
  longitude,
  userLatitude,
  userLongitude,
  style,
}: Props) {
  const [liveUserLat, setLiveUserLat] = useState<number | null>(userLatitude ?? null);
  const [liveUserLon, setLiveUserLon] = useState<number | null>(userLongitude ?? null);
  const [calculatingDist, setCalculatingDist] = useState<boolean>(false);

  useEffect(() => {
    if (userLatitude && userLongitude) {
      setLiveUserLat(userLatitude);
      setLiveUserLon(userLongitude);
      return;
    }

    let isMounted = true;
    // Auto-detect user distance if not already provided
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

  const handleOpenNavigation = () => {
    if (hasCoords) {
      openDirectionsInMaps(latitude, longitude, title);
    } else if (address || region) {
      const searchTarget = [title, address, region].filter(Boolean).join(', ');
      openDirectionsInMaps(9.0105, 38.7615, searchTarget);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Visual Map Header Canvas */}
      <View style={styles.mapCanvas}>
        {/* Subtle decorative grid lines */}
        <View style={styles.gridLineH1} />
        <View style={styles.gridLineH2} />
        <View style={styles.gridLineV1} />
        <View style={styles.gridLineV2} />
        <View style={styles.mapRoadCurve} />

        {/* Central Map Marker with animated aura */}
        <View style={styles.markerContainer}>
          <View style={styles.markerPulseRing} />
          <View style={styles.markerCenter}>
            <Feather name="map-pin" size={18} color={colors.navy} />
          </View>
        </View>

        {/* Top Badges */}
        <View style={styles.topBadgesRow}>
          {hasCoords && (
            <View style={styles.coordBadge}>
              <Feather name="crosshair" size={11} color={colors.gold} />
              <Text style={styles.coordBadgeText}>
                {latitude.toFixed(4)}N, {longitude.toFixed(4)}E
              </Text>
            </View>
          )}

          {distanceText ? (
            <View style={styles.distanceBadge}>
              <Feather name="navigation" size={11} color={colors.onNavy} />
              <Text style={styles.distanceBadgeText}>{distanceText}</Text>
            </View>
          ) : calculatingDist ? (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>Calculating distance...</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Label overlay on canvas */}
        <View style={styles.canvasBottomOverlay}>
          <Text style={styles.canvasRegionText} numberOfLines={1}>
            {region || 'Ethiopia'}
          </Text>
        </View>
      </View>

      {/* Info and Navigation Actions */}
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
              {address || region || 'Coordinates mapped in Ethiopia'}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={handleOpenNavigation}
          activeOpacity={0.85}
        >
          <Feather name="navigation-2" size={16} color={colors.navy} />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
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
  mapCanvas: {
    height: 140,
    backgroundColor: colors.navyDeep,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 40,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridLineH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 95,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridLineV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '30%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  gridLineV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '32%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  mapRoadCurve: {
    position: 'absolute',
    top: -20,
    left: -40,
    width: 320,
    height: 180,
    borderWidth: 2,
    borderColor: 'rgba(223,183,108,0.18)',
    borderRadius: 160,
    transform: [{ rotate: '-25deg' }],
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerPulseRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(223,183,108,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(223,183,108,0.45)',
  },
  markerCenter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.card,
  },
  topBadgesRow: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7,21,43,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(223,183,108,0.35)',
  },
  coordBadgeText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7,21,43,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  distanceBadgeText: {
    color: colors.onNavy,
    fontSize: 10,
    fontWeight: '600',
  },
  canvasBottomOverlay: {
    position: 'absolute',
    bottom: spacing.xs,
    left: spacing.sm,
    backgroundColor: 'rgba(7,21,43,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  canvasRegionText: {
    color: colors.charcoalLight,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.goldButton,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 4,
    ...shadow.button,
  },
  directionsButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: 0.2,
  },
});
