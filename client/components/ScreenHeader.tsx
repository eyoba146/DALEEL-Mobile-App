import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveMediaUrl } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { colors, fonts } from '../theme/tokens';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
  badgeCount?: number;
}

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  style,
  badgeCount,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const avatarUri = resolveMediaUrl(user?.avatarUrl);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }, style]}>
      {/* Decorative Warm Gold Waves (Exact match to Home) */}
      <View pointerEvents="none" style={styles.goldWaveContainer}>
        <View style={styles.goldWaveOuter} />
        <View style={styles.goldWaveInner} />
      </View>

      <View style={styles.headerContentRow}>
        {/* Left Side: Back Button + DALEEL Logo + Left-Aligned Screen Title */}
        <View style={styles.headerLeftGroup}>
          {showBack && (
            <TouchableOpacity
              style={styles.goldBackCircle}
              onPress={handleBack}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={19} color={colors.navy} />
            </TouchableOpacity>
          )}

          {/* If Subpage Title is present: Brand Badge + DALEEL Eyebrow + Luxury DM Serif Heading */}
          {title ? (
            <View style={styles.headerTitleGroup}>
              {!showBack && (
                <View style={styles.brandIconCircle}>
                  <Ionicons name="compass" size={17} color={colors.navy} />
                </View>
              )}
              <View style={styles.titleColumn}>
                <Text style={styles.brandOverline}>DALEEL</Text>
                <View style={styles.titleWithBadge}>
                  <Text style={styles.pageHeadingText} numberOfLines={1}>
                    {title}
                  </Text>
                  {typeof badgeCount === 'number' && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>{badgeCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : (
            /* Home / Root Header: Brand Badge + Large DALEEL Logo */
            <View style={styles.headerBrand}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="compass" size={17} color={colors.navy} />
              </View>
              <Text style={styles.headerLogo}>DALEEL</Text>
            </View>
          )}
        </View>

        {/* Right Side: Custom Action (Edit Pill) OR User Avatar (Identical to Home Header) */}
        {rightElement ? (
          <View style={styles.rightSlot}>{rightElement}</View>
        ) : (
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarText}>
                  {user?.name?.[0]?.toUpperCase() || 'D'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.headerNavy,
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#0E2243',
  },
  goldWaveContainer: {
    position: 'absolute',
    top: -24,
    right: -40,
    width: 220,
    height: 110,
  },
  goldWaveOuter: {
    position: 'absolute',
    width: 200,
    height: 85,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(223, 183, 108, 0.35)',
    transform: [{ rotate: '-18deg' }],
  },
  goldWaveInner: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 170,
    height: 65,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 183, 108, 0.2)',
    transform: [{ rotate: '-22deg' }],
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    marginTop: 4,
  },
  headerLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingRight: 8,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  titleColumn: {
    justifyContent: 'center',
  },
  brandOverline: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageHeadingText: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  badgePill: {
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  badgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
  },
  goldBackCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  rightSlot: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.navyMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.gold,
  },
});
