import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAdminAuth } from '../../lib/auth-context';
import { useAdminLanguage } from '../../lib/language-context';
import { colors, fonts } from '../../theme/tokens';

const ADMIN_TAB_CONFIG: Record<
  string,
  {
    labelKey: string;
    fallback: string;
    icon: keyof typeof Ionicons.glyphMap;
    outlineIcon: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: {
    labelKey: 'dashboard',
    fallback: 'Dashboard',
    icon: 'grid',
    outlineIcon: 'grid-outline',
  },
  triage: {
    labelKey: 'triage',
    fallback: 'Triage',
    icon: 'file-tray-full',
    outlineIcon: 'file-tray-full-outline',
  },
  catalog: {
    labelKey: 'catalog',
    fallback: 'Directory',
    icon: 'business',
    outlineIcon: 'business-outline',
  },
  members: {
    labelKey: 'members',
    fallback: 'Members',
    icon: 'people',
    outlineIcon: 'people-outline',
  },
  more: {
    labelKey: 'more',
    fallback: 'More',
    icon: 'menu',
    outlineIcon: 'menu-outline',
  },
};

function AdminTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useAdminLanguage();

  return (
    <View style={[styles.barContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Subtle Warm Gold top separator border */}
      <View style={styles.topBorder} />

      <View style={styles.tabsRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = ADMIN_TAB_CONFIG[route.name] || {
            labelKey: route.name,
            fallback: route.name,
            icon: 'ellipse' as const,
            outlineIcon: 'ellipse-outline' as const,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={t(config.labelKey) || config.fallback}
            >
              <View style={styles.tabContent}>
                {/* Active Warm Gold Indicator */}
                {isFocused && <View style={styles.activeIndicator} />}

                <Ionicons
                  name={isFocused ? config.icon : config.outlineIcon}
                  size={21}
                  color={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.45)'}
                />
                <Text
                  style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {t(config.labelKey) || config.fallback}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { loading, adminUser } = useAdminAuth();

  if (loading) return null;
  if (!adminUser) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      tabBar={(props) => <AdminTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="triage" options={{ title: 'Triage' }} />
      <Tabs.Screen name="catalog" options={{ title: 'Directory' }} />
      <Tabs.Screen name="members" options={{ title: 'Members' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: colors.navy,
  },
  topBorder: {
    height: 1,
    backgroundColor: 'rgba(223, 183, 108, 0.18)',
  },
  tabsRow: {
    flexDirection: 'row',
    height: 56,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 6,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gold,
  },
  tabLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
  },
});
