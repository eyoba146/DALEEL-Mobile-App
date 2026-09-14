import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../lib/auth-context';
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

function ConcaveBottomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const numTabs = state.routes.length || 5;
  const tabWidth = windowWidth / numTabs;

  const animatedIndex = useRef(new Animated.Value(state.index)).current;
  const wheelRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedIndex, {
        toValue: state.index,
        useNativeDriver: true,
        tension: 65,
        friction: 9,
      }),
      Animated.sequence([
        Animated.timing(wheelRotation, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(wheelRotation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index]);

  // 3000px wide SVG to cover edges regardless of translation
  // Silky smooth, rounded circular cradle (width = 68, depth = 24, perfectly continuous)
  // Notch is from x=1466 to x=1534. Center is at x=1500.
  const svgPath = `M 0 0 L 1466 0 C 1476 0, 1478 8, 1484 16 C 1490 24, 1510 24, 1516 16 C 1522 8, 1524 0, 1534 0 L 3000 0 L 3000 200 L 0 200 Z`;

  const translateX = animatedIndex.interpolate({
    inputRange: state.routes.map((_: any, i: number) => i),
    outputRange: state.routes.map((_: any, i: number) => (i * tabWidth) + (tabWidth / 2) - 1500),
  });

  const carriageTranslateX = animatedIndex.interpolate({
    inputRange: state.routes.map((_: any, i: number) => i),
    outputRange: state.routes.map((_: any, i: number) => (i * tabWidth) + (tabWidth / 2) - 34),
  });

  const rotateZ = wheelRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const activeRoute = state.routes[state.index];
  const activeConfig = TAB_CONFIG[activeRoute?.name] || {
    label: 'Tab',
    icon: 'ellipse',
    outlineIcon: 'ellipse-outline',
  };

  return (
    <View style={[styles.barContainer, { height: 66 + Math.max(insets.bottom, 10) }]}>
      
      {/* Seamless Animated SVG Background (clipped at screen edges) */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 3000,
            height: 200,
            transform: [{ translateX }],
          }}
        >
          <Svg width={3000} height={200}>
            <Path d={svgPath} fill={colors.headerNavy} />
          </Svg>
        </Animated.View>
      </View>

      {/* Sliding Concave Notch Carriage (Wheel Animation) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.slidingNotchCarriage,
          {
            width: 68,
            transform: [{ translateX: carriageTranslateX }],
          },
        ]}
      >
        {/* Elevated Floating Warm Gold Wheel Button */}
        <Animated.View
          style={[
            styles.elevatedButton,
            {
              transform: [{ rotate: rotateZ }],
            },
          ]}
        >
          <Ionicons name={activeConfig.icon} size={22} color={colors.navy} />
        </Animated.View>
      </Animated.View>

      {/* Row of Tab Touchable Items */}
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
              activeOpacity={0.8}
            >
              <View style={styles.tabContent}>
                {/* Inactive tab icon shown; active icon sits on the sliding elevated button */}
                <View style={[styles.tabIconBox, isFocused && { opacity: 0 }]}>
                  <Ionicons name={config.outlineIcon} size={21} color="#8A9AA8" />
                </View>
                <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                  {config.label}
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
  if (!user.isVerified) return <Redirect href="/(auth)/verify-email" />;

  return (
    <Tabs
      tabBar={(props) => <ConcaveBottomTabBar {...props} />}
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
    position: 'relative',
    overflow: 'visible',
    backgroundColor: 'transparent',
    borderTopWidth: 0, // No border! Handled cleanly by SVG
  },
  tabsRow: {
    flexDirection: 'row',
    height: 66,
    zIndex: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabIconBox: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10.5,
    color: '#8A9AA8',
    marginTop: 4,
  },
  tabLabelActive: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.gold,
  },

  // ── Sliding Concave Notch Carriage (Wheel Animation) ──
  slidingNotchCarriage: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 66,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
  },

  // ── Elevated Active Wheel Button (Gold Glow, zero black shadow) ──
  elevatedButton: {
    position: 'absolute',
    top: -15,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold, // Warm Gold Glow instead of harsh black shadow
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
});
