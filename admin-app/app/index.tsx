import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminAuth } from '../lib/auth-context';
import { colors, fonts, type } from '../theme/tokens';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const router = useRouter();
  const { adminUser, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading) {
      if (adminUser) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [loading, adminUser]);

  return (
    <View style={styles.container}>
      <View style={styles.brandBadge}>
        <Ionicons name="shield-checkmark" size={32} color={colors.gold} />
      </View>
      <Text style={styles.brandTitle}>DALEEL</Text>
      <Text style={styles.brandSubtitle}>EXECUTIVE ADMIN CONSOLE</Text>
      <ActivityIndicator size="small" color={colors.gold} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brandBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 2.5,
    marginTop: 6,
  },
  spinner: {
    marginTop: 32,
  },
});
