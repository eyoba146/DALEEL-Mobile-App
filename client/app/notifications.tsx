import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { AppNotification } from '../lib/api';
import { useNotifications } from '../lib/notifications-context';
import { colors, fonts, radius, spacing } from '../theme/tokens';

type NotificationCategory = 'All' | 'Orders' | 'Events' | 'Investments' | 'Announcements';

const CATEGORIES: { label: NotificationCategory; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', icon: 'sparkles-outline' },
  { label: 'Orders', icon: 'bag-check-outline' },
  { label: 'Events', icon: 'calendar-outline' },
  { label: 'Investments', icon: 'trending-up-outline' },
  { label: 'Announcements', icon: 'megaphone-outline' },
];

function formatRelativeTime(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function getCategoryConfig(type: string) {
  switch (type.toLowerCase()) {
    case 'order':
      return {
        icon: 'bag-check' as const,
        color: colors.success,
        bg: 'rgba(46, 125, 50, 0.12)',
        tag: 'ORDER UPDATE',
      };
    case 'event':
      return {
        icon: 'calendar' as const,
        color: colors.goldRich,
        bg: 'rgba(198, 148, 10, 0.14)',
        tag: 'EVENT GATHERING',
      };
    case 'investment':
      return {
        icon: 'trending-up' as const,
        color: '#2563EB',
        bg: 'rgba(37, 99, 235, 0.12)',
        tag: 'INVESTMENT HUB',
      };
    case 'service':
      return {
        icon: 'briefcase' as const,
        color: '#0D9488',
        bg: 'rgba(13, 148, 136, 0.12)',
        tag: 'VERIFIED SERVICE',
      };
    default:
      return {
        icon: 'megaphone' as const,
        color: colors.navy,
        bg: 'rgba(11, 27, 61, 0.12)',
        tag: 'COMMUNITY ANNOUNCEMENT',
      };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();

  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('All');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeCategory === 'All') return true;
      if (activeCategory === 'Orders') return item.type === 'order';
      if (activeCategory === 'Events') return item.type === 'event';
      if (activeCategory === 'Investments') return item.type === 'investment';
      if (activeCategory === 'Announcements')
        return item.type === 'system' || item.type === 'service';
      return true;
    });
  }, [notifications, activeCategory]);

  const handleCardPress = (item: AppNotification) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.actionUrl) {
      router.push(item.actionUrl as any);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Notifications"
        subtitle="Activity updates, orders & community notices"
        showBack
        badgeCount={unreadCount}
      />

      {/* Action Sub-Bar: Mark All As Read & Filter Summary */}
      <View style={styles.actionSubBar}>
        <View style={styles.unreadBadgeRow}>
          <View style={[styles.unreadDot, unreadCount === 0 && styles.unreadDotInactive]} />
          <Text style={styles.unreadCountText}>
            {unreadCount > 0 ? `${unreadCount} unread update(s)` : 'All caught up'}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllAsRead}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done" size={15} color={colors.navy} style={{ marginRight: 4 }} />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Category Filters */}
      <View style={styles.categoriesWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.label;
            return (
              <TouchableOpacity
                key={cat.label}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat.label)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : colors.charcoal}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {filteredNotifications.map((item) => {
          const cfg = getCategoryConfig(item.type);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
              activeOpacity={0.88}
              onPress={() => handleCardPress(item)}
            >
              {/* Category Icon */}
              <View style={[styles.iconCircle, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={20} color={cfg.color} />
              </View>

              {/* Notification Content */}
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.tagPill, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.tagPillText, { color: cfg.color }]}>{cfg.tag}</Text>
                  </View>
                  <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
                </View>

                <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
                  {item.title}
                </Text>
                <Text style={styles.notifMessage} numberOfLines={3}>
                  {item.message}
                </Text>

                {item.actionUrl && (
                  <View style={styles.actionLinkRow}>
                    <Text style={styles.actionLinkText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={12} color={colors.navy} style={{ marginLeft: 4 }} />
                  </View>
                )}
              </View>

              {/* Right Side Unread Indicator / Dismiss */}
              <View style={styles.rightActionCol}>
                {!item.isRead ? (
                  <View style={styles.unreadIndicatorDot} />
                ) : (
                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      dismissNotification(item.id);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="rgba(23, 25, 28, 0.28)" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Empty State */}
        {filteredNotifications.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={38} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>You&apos;re All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              {activeCategory === 'All'
                ? 'No notifications right now. Order confirmations, event reminders, and community updates will appear here.'
                : `No notifications in ${activeCategory}. Switch categories or check back later.`}
            </Text>
            {activeCategory !== 'All' && (
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => setActiveCategory('All')}
                activeOpacity={0.8}
              >
                <Text style={styles.resetFilterText}>View All Notifications</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  actionSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 25, 28, 0.05)',
  },
  unreadBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginRight: 6,
  },
  unreadDotInactive: {
    backgroundColor: colors.charcoalSub,
    opacity: 0.4,
  },
  unreadCountText: {
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoal,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 27, 61, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  markAllText: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },

  // Categories
  categoriesWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 25, 28, 0.06)',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.08)',
    marginRight: 6,
  },
  categoryPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  categoryLabel: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoal,
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notifCardUnread: {
    backgroundColor: '#FFFEFA',
    borderColor: 'rgba(198, 148, 10, 0.3)',
    borderLeftWidth: 3.5,
    borderLeftColor: colors.gold,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tagPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  tagPillText: {
    fontSize: 9,
    fontFamily: fonts.body,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  timeText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  notifTitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.charcoal,
    lineHeight: 19,
    marginBottom: 4,
  },
  notifTitleUnread: {
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.navy,
  },
  notifMessage: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    lineHeight: 17,
    marginBottom: 6,
  },
  actionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  actionLinkText: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
  rightActionCol: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 8,
    paddingTop: 2,
  },
  unreadIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
    marginTop: 4,
  },
  dismissBtn: {
    padding: 2,
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 32,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.06)',
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(198, 148, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  resetFilterBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.ivory,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  resetFilterText: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.navy,
  },
});
