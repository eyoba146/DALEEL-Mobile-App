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
import { useNotifications } from '../lib/notifications-context';
import { colors, fonts, shadow } from '../theme/tokens';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
  badgeCount?: number;
  showNotificationBell?: boolean;
}

export default function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  style,
  badgeCount,
  showNotificationBell = !showBack && !rightElement,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
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
      <View style={styles.headerContentRow}>
        {/* Left Side: Back Button + Brand/Title */}
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

          {title ? (
            <View style={styles.headerTitleGroup}>
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
            /* Home / Root Header: Brand Badge + DALEEL Logo */
            <View style={styles.headerBrand}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="compass" size={16} color={colors.navy} />
              </View>
              <Text style={styles.headerLogo}>DALEEL</Text>
            </View>
          )}
        </View>

        {/* Right Side: Custom Action OR (Bell + User Avatar) */}
        {rightElement ? (
          <View style={styles.rightSlot}>{rightElement}</View>
        ) : (
          <View style={styles.rightSlot}>
            {showNotificationBell && (
              <TouchableOpacity
                style={styles.notifBtn}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
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
          </View>
        )}
      </View>
    </View>
  );
}

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
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  notifBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
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
