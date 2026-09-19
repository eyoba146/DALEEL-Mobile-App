import {
  DMSerifDisplay_400Regular,
  useFonts as useDMSerifDisplay,
} from '@expo-google-fonts/dm-serif-display';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInter,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { AuthProvider } from '../lib/auth-context';
import { CartProvider } from '../lib/cart-context';
import { FavoritesProvider } from '../lib/favorites-context';
import { LanguageProvider } from '../lib/language-context';
import { NotificationsProvider } from '../lib/notifications-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [dmLoaded] = useDMSerifDisplay({ DMSerifDisplay_400Regular });
  const [interLoaded] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fontsLoaded = dmLoaded && interLoaded;

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <LanguageProvider>
        <FavoritesProvider>
          <NotificationsProvider>
            <CartProvider>
              <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
                <StatusBar style="light" />
                <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="events" />
                  <Stack.Screen name="event/[id]" />
                  <Stack.Screen name="destination/[id]" />
                  <Stack.Screen name="service/[id]" />
                  <Stack.Screen name="marketplace" />
                  <Stack.Screen name="product/[id]" />
                  <Stack.Screen name="cart" />
                  <Stack.Screen name="investments" />
                  <Stack.Screen name="investment/[id]" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="activity" />
                </Stack>
              </View>
            </CartProvider>
          </NotificationsProvider>
        </FavoritesProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
