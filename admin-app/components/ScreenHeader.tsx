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
import { useAdminAuth } from '../lib/auth-context';
import { colors, fonts, shadow } from '../theme/tokens';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  rightElement?: React.ReactNode;
  badge?: string;
  badgeCount?: number;
  variant?: 'light' | 'navy';
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  showMenu = false,
  onMenu,
  rightElement,
  badge,
  badgeCount,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { adminUser } = useAdminAuth();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const initial = adminUser?.name?.[0]?.toUpperCase() || 'A';

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }, style]}>
      <View style={styles.headerContentRow}>
        {/* Left Side: Back / Menu + Brand / Title */}
        <View style={styles.headerLeftGroup}>
          {showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {showMenu && !showBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onMenu}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Menu"
            >
              <Ionicons name="menu-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {title ? (
            <View style={styles.headerTitleGroup}>
              <View style={styles.titleColumn}>
                <Text style={styles.brandOverline}>DALEEL</Text>
                <View style={styles.titleWithBadge}>
                  <Text style={styles.pageHeadingText} numberOfLines={1}>
                    {title}
                  </Text>
                  {(badge || typeof badgeCount === 'number') && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgeText}>
                        {badge || badgeCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          ) : (
            /* Home / Root Header: Brand Badge + DALEEL Wordmark */
            <View style={styles.headerBrand}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="compass" size={16} color={colors.navy} />
              </View>
              <Text style={styles.headerLogo}>DALEEL</Text>
            </View>
          )}
        </View>

        {/* Right Side: Custom Action OR Admin Avatar */}
        {rightElement ? (
          <View style={styles.rightSlot}>{rightElement}</View>
        ) : (
          <View style={styles.rightSlot}>
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/(tabs)/more')}
              activeOpacity={0.7}
              accessibilityLabel="Executive Desk"
            >
              {adminUser?.avatarUrl ? (
                <Image source={{ uri: adminUser.avatarUrl }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <Text style={styles.headerAvatarText}>{initial}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default ScreenHeader;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 14,
    ...shadow.header,
    zIndex: 100,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginTop: 2,
  },
  headerLeftGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 8,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontFamily: fonts.heading,
    fontSize: 21,
    color: '#FFFFFF',
    letterSpacing: 1,
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    fontWeight: '600',
    color: colors.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 1,
    opacity: 0.85,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageHeadingText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9,
  },
  badgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
