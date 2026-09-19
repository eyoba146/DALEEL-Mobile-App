import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppNotification } from '../lib/api';
import { colors, fonts, radius } from '../theme/tokens';

interface InAppNotificationBannerProps {
  notification: AppNotification | null;
  onDismiss: () => void;
  onOpen: (notification: AppNotification) => void;
}

function getCategoryConfig(type: string) {
  switch (type.toLowerCase()) {
    case 'order':
      return {
        icon: 'bag-check' as const,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.18)',
        tag: 'ORDER UPDATE',
      };
    case 'event':
      return {
        icon: 'calendar' as const,
        color: colors.gold,
        bg: 'rgba(223, 183, 108, 0.22)',
        tag: 'EVENT PASS',
      };
    case 'investment':
      return {
        icon: 'trending-up' as const,
        color: '#60A5FA',
        bg: 'rgba(96, 165, 250, 0.18)',
        tag: 'INVESTMENT HUB',
      };
    case 'service':
      return {
        icon: 'briefcase' as const,
        color: '#2DD4BF',
        bg: 'rgba(45, 212, 191, 0.18)',
        tag: 'CONCIERGE SERVICE',
      };
    default:
      return {
        icon: 'megaphone' as const,
        color: colors.gold,
        bg: 'rgba(223, 183, 108, 0.22)',
        tag: 'ANNOUNCEMENT',
      };
  }
}

export default function InAppNotificationBanner({
  notification,
  onDismiss,
  onOpen,
}: InAppNotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notification) {
      // Clear any prior timer
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

      // Slide and fade in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 5.5s
      dismissTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 5500);
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [notification]);

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    if (!notification) return;
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onOpen(notification);
    });
  };

  if (!notification) return null;

  const cfg = getCategoryConfig(notification.type);
  const topOffset = Math.max(insets.top, 14) + 6;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topOffset,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
        onPress={handlePress}
      >
        {/* Category Icon */}
        <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={20} color={cfg.color} />
        </View>

        {/* Content */}
        <View style={styles.contentCol}>
          <View style={styles.topRow}>
            <View style={styles.tagWrap}>
              <Text style={[styles.tagText, { color: cfg.color }]}>{cfg.tag}</Text>
            </View>
            <Text style={styles.timeText}>Just now</Text>
          </View>
          <Text style={styles.titleText} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.messageText} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        {/* Right Action / Close */}
        <View style={styles.rightActionCol}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
          <View style={styles.viewBadge}>
            <Text style={styles.viewBadgeText}>View</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07152B',
    borderRadius: radius.xl,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 183, 108, 0.4)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 16,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tagWrap: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    fontSize: 9,
    fontFamily: fonts.body,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  timeText: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  titleText: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.78)',
    lineHeight: 15,
  },
  rightActionCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
    height: 44,
  },
  closeBtn: {
    padding: 2,
  },
  viewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  viewBadgeText: {
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.navy,
  },
});
