import * as Location from 'expo-location';
import { Linking, Platform } from 'react-native';

export type UserCoordinates = {
  latitude: number;
  longitude: number;
  address?: string;
  granted: boolean;
  error?: string;
};

/**
 * Requests device location permission and returns current GPS coordinates with reverse geocoded address.
 */
export async function getCurrentUserLocation(): Promise<UserCoordinates> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        latitude: 0,
        longitude: 0,
        granted: false,
        error: 'Location permission was denied by user',
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;
    let formattedAddress = '';

    try {
      const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverse && reverse.length > 0) {
        const place = reverse[0];
        const parts = [
          place.streetNumber,
          place.street,
          place.district || place.subregion,
          place.city,
          place.region,
          place.country,
        ].filter((p): p is string => Boolean(p && p.trim().length > 0));

        // Deduplicate adjacent identical parts
        const cleanParts = parts.filter((part, idx) => parts.indexOf(part) === idx);
        formattedAddress = cleanParts.join(', ');
      }
    } catch {
      // Reverse geocoding optional fallback
      formattedAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    return {
      latitude,
      longitude,
      address: formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      granted: true,
    };
  } catch (err: any) {
    return {
      latitude: 0,
      longitude: 0,
      granted: false,
      error: err?.message || 'Failed to determine device location',
    };
  }
}

/**
 * Calculates straight-line distance in kilometers using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

/**
 * Formats a kilometer distance into a readable string (e.g., '850 m' or '12.4 km').
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

/**
 * Opens navigation directions in native Apple Maps (iOS) or Google Maps (Android/Web).
 */
export async function openDirectionsInMaps(
  latitude: number,
  longitude: number,
  label: string
): Promise<void> {
  const encodedLabel = encodeURIComponent(label);
  const webMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  if (Platform.OS === 'ios') {
    const appleMapsUrl = `maps:0,0?q=${encodedLabel}&ll=${latitude},${longitude}`;
    const canOpen = await Linking.canOpenURL(appleMapsUrl);
    if (canOpen) {
      await Linking.openURL(appleMapsUrl);
      return;
    }
  } else if (Platform.OS === 'android') {
    const geoUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`;
    const canOpen = await Linking.canOpenURL(geoUrl);
    if (canOpen) {
      await Linking.openURL(geoUrl);
      return;
    }
  }

  // Universal browser fallback
  await Linking.openURL(webMapsUrl);
}
