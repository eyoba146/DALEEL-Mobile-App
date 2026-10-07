import React, { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
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
import { AuthProvider } from '../lib/auth-context';
import { LanguageProvider } from '../lib/language-context';
import { ToastProvider } from '../lib/toast-context';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <ToastProvider>
            <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="service/[id]" />
                <Stack.Screen name="destination/[id]" />
                <Stack.Screen name="event/[id]" />
                <Stack.Screen name="event/scanner" />
                <Stack.Screen name="product/[id]" />
                <Stack.Screen name="investment/[id]" />
                <Stack.Screen name="user/[id]" />
                <Stack.Screen name="team/new" />
                <Stack.Screen name="profile/security" />
                <Stack.Screen name="reviews/index" />
              </Stack>
            </View>
          </ToastProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
