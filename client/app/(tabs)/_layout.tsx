import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth-context';
import { useLanguage } from '../../lib/language-context';
import { colors, fonts } from '../../theme/tokens';

const TAB_CONFIG: {
  [key: string]: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    outlineIcon: keyof typeof Ionicons.glyphMap;
  };
} = {
  index: {
    label: 'Home',
    icon: 'home',
    outlineIcon: 'home-outline',
  },
  explore: {
    label: 'Explore',
    icon: 'compass',
    outlineIcon: 'compass-outline',
  },
  services: {
    label: 'Services',
    icon: 'briefcase',
    outlineIcon: 'briefcase-outline',
  },
  saved: {
    label: 'Favorites',
    icon: 'bookmark',
    outlineIcon: 'bookmark-outline',
  },
  profile: {
    label: 'Account',
    icon: 'person-circle',
    outlineIcon: 'person-circle-outline',
  },
};

function DaleelTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const getTabLabel = (routeName: string, fallback: string) => {
    switch (routeName) {
      case 'index': return t('tabs.home', fallback);
      case 'explore': return t('tabs.explore', fallback);
      case 'services': return t('tabs.services', fallback);
      case 'saved': return t('tabs.saved', fallback);
      case 'profile': return t('tabs.profile', fallback);
      default: return fallback;
    }
  };

  return (
    <View style={[styles.barContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Subtle top border */}
      <View style={styles.topBorder} />

      <View style={styles.tabsRow}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || {
            label: route.name,
            icon: 'ellipse',
            outlineIcon: 'ellipse-outline',
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
              accessibilityLabel={getTabLabel(route.name, config.label)}
            >
              <View style={styles.tabContent}>
                {/* Active indicator dot */}
                {isFocused && <View style={styles.activeIndicator} />}

                <Ionicons
                  name={isFocused ? config.icon : config.outlineIcon}
                  size={22}
                  color={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.45)'}
                />
                <Text
                  style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {getTabLabel(route.name, config.label)}
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
  const { isReady, user } = useAuth();

  if (!isReady) return null;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      tabBar={(props) => <DaleelTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="services" options={{ title: 'Services' }} />
      <Tabs.Screen name="saved" options={{ title: 'Favorites' }} />
      <Tabs.Screen name="profile" options={{ title: 'Account' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    backgroundColor: colors.navy,
  },
  topBorder: {
    height: 1,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
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
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 3,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
