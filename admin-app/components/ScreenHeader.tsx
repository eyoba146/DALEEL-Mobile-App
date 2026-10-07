import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, type, fonts, shadow } from '../theme/tokens';

interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  onMenu?: () => void;
  rightElement?: React.ReactNode;
  badge?: string;
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
  variant = 'light',
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const isNavy = variant === 'navy';

  return (
    <View
      style={[
        styles.container,
        isNavy ? styles.containerNavy : styles.containerLight,
        { paddingTop: Math.max(insets.top, 12) },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Side: Back / Menu / Brand */}
        <View style={styles.leftGroup}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.iconBtn, isNavy ? styles.iconBtnNavy : styles.iconBtnLight]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={isNavy ? '#FFFFFF' : colors.navy}
              />
            </TouchableOpacity>
          )}

          {showMenu && (
            <TouchableOpacity
              onPress={onMenu}
              style={[styles.iconBtn, isNavy ? styles.iconBtnNavy : styles.iconBtnLight]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="menu-outline"
                size={22}
                color={isNavy ? '#FFFFFF' : colors.navy}
              />
            </TouchableOpacity>
          )}

          <View style={styles.titleWrap}>
            <View style={styles.titleRow}>
              {title && (
                <Text
                  numberOfLines={1}
                  style={[styles.title, isNavy ? styles.titleNavy : styles.titleLight]}
                >
                  {title}
                </Text>
              )}
              {badge && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              )}
            </View>
            {subtitle && (
              <Text
                numberOfLines={1}
                style={[styles.subtitle, isNavy ? styles.subtitleNavy : styles.subtitleLight]}
              >
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        {/* Right Side Element */}
        {rightElement && <View style={styles.rightGroup}>{rightElement}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: colors.border,
    ...shadow.header,
  },
  containerNavy: {
    backgroundColor: colors.navy,
    borderBottomColor: colors.navyLight,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnLight: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBtnNavy: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  titleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...type.h2,
    fontFamily: fonts.serifBold,
    letterSpacing: -0.3,
  },
  titleLight: {
    color: colors.textPrimary,
  },
  titleNavy: {
    color: '#FFFFFF',
  },
  subtitle: {
    ...type.caption,
    marginTop: 2,
  },
  subtitleLight: {
    color: colors.textSecondary,
  },
  subtitleNavy: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  badgePill: {
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    ...type.tiny,
    color: colors.goldText,
    fontWeight: '700',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
});
