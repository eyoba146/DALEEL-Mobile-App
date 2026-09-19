import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { AppNotification, NotificationPreferences, notificationsApi } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { useNotifications } from '../lib/notifications-context';
import { colors, fonts, radius, spacing } from '../theme/tokens';

type NotificationCategory = 'All' | 'Events' | 'Services' | 'Orders' | 'Investments' | 'Announcements';

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
        bg: 'rgba(22, 128, 60, 0.12)',
        tag: 'ORDER UPDATE',
      };
    case 'event':
      return {
        icon: 'calendar' as const,
        color: colors.goldRich,
        bg: 'rgba(197, 155, 67, 0.14)',
        tag: 'EVENT PASS',
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
        bg: 'rgba(7, 21, 43, 0.10)',
        tag: 'ANNOUNCEMENT',
      };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useLanguage();
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
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

  // Preferences Modal State
  const [prefsModalVisible, setPrefsModalVisible] = useState(false);
  const [savingPrefKey, setSavingPrefKey] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orders: true,
    events: true,
    investments: true,
    announcements: true,
  });

  useEffect(() => {
    async function loadPrefs() {
      if (!token) return;
      try {
        const res = await notificationsApi.getPreferences(token);
        if (res) setPreferences(res);
      } catch {
        // Keep defaults
      }
    }
    if (prefsModalVisible) {
      loadPrefs();
    }
  }, [prefsModalVisible, token]);

  const handleTogglePref = async (key: keyof NotificationPreferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setSavingPrefKey(key);

    try {
      await notificationsApi.updatePreferences(updated, token);
    } catch {
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSavingPrefKey(null);
    }
  };

  const categories = useMemo(
    () => [
      { id: 'All' as const, label: t('notifications.categories.all', 'All'), icon: 'sparkles-outline' as const },
      { id: 'Events' as const, label: t('notifications.categories.events', 'Events'), icon: 'calendar-outline' as const },
      { id: 'Services' as const, label: 'Services', icon: 'briefcase-outline' as const },
      { id: 'Orders' as const, label: t('notifications.categories.orders', 'Orders'), icon: 'bag-check-outline' as const },
      { id: 'Investments' as const, label: t('notifications.categories.investments', 'Investments'), icon: 'trending-up-outline' as const },
      { id: 'Announcements' as const, label: t('notifications.categories.announcements', 'Announcements'), icon: 'megaphone-outline' as const },
    ],
    [t]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeCategory === 'All') return true;
      if (activeCategory === 'Events') return item.type === 'event';
      if (activeCategory === 'Services') return item.type === 'service';
      if (activeCategory === 'Orders') return item.type === 'order';
      if (activeCategory === 'Investments') return item.type === 'investment';
      if (activeCategory === 'Announcements')
        return item.type === 'system' || item.type === 'announcement';
      return true;
    });
  }, [notifications, activeCategory]);

  const handleCardPress = (item: AppNotification) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.actionUrl) {
      router.push(item.actionUrl as any);
    } else {
      setSelectedNotif(item);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t('notifications.title', 'Notifications')}
        subtitle={t('notifications.subtitle', 'Live gate passes, inquiries & notices')}
        showBack
        badgeCount={unreadCount}
        rightElement={
          <TouchableOpacity
            style={styles.headerSettingsBtn}
            onPress={() => setPrefsModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Notification Preferences"
          >
            <Ionicons name="options-outline" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        }
      />

      {/* Action Sub-Bar: Mark All As Read & Filter Summary */}
      <View style={styles.actionSubBar}>
        <View style={styles.unreadBadgeRow}>
          <View style={[styles.unreadDot, unreadCount === 0 && styles.unreadDotInactive]} />
          <Text style={styles.unreadCountText}>
            {unreadCount > 0
              ? `${unreadCount} ${t('notifications.unreadUpdates', 'unread update(s)')}`
              : t('notifications.allCaughtUp', 'All caught up')}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={markAllAsRead}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-done" size={15} color={colors.navy} style={{ marginRight: 4 }} />
            <Text style={styles.markAllText}>{t('notifications.markAllRead', 'Mark all as read')}</Text>
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
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat.id)}
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
                    <Text style={styles.actionLinkText}>
                      {item.type === 'event'
                        ? 'View Admission Pass'
                        : item.type === 'order'
                        ? 'Track Order'
                        : item.type === 'investment'
                        ? 'View Opportunity'
                        : t('common.viewDetails', 'View Details')}
                    </Text>
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
                      e.stopPropagation();
                      dismissNotification(item.id);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Delete notification"
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
              <Ionicons name="notifications-off-outline" size={36} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>{t('notifications.emptyTitle', 'No notifications found')}</Text>
            <Text style={styles.emptySubtitle}>
              {activeCategory === 'All'
                ? t('notifications.noNotifications', 'All caught up! No notifications at this time.')
                : `No active notifications in the ${activeCategory} category.`}
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

      {/* Notification Details Modal (When tapped with no direct actionUrl) */}
      <Modal
        visible={!!selectedNotif}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotif(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedNotif && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: getCategoryConfig(selectedNotif.type).bg },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryConfig(selectedNotif.type).icon}
                      size={22}
                      color={getCategoryConfig(selectedNotif.type).color}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.modalCategoryTag}>
                      {getCategoryConfig(selectedNotif.type).tag}
                    </Text>
                    <Text style={styles.modalTimeText}>
                      {formatRelativeTime(selectedNotif.createdAt)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedNotif(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={22} color={colors.charcoal} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>{selectedNotif.title}</Text>
                <Text style={styles.modalMessage}>{selectedNotif.message}</Text>

                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.modalDismissBtn}
                    onPress={() => {
                      dismissNotification(selectedNotif.id);
                      setSelectedNotif(null);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} style={{ marginRight: 4 }} />
                    <Text style={styles.modalDismissBtnText}>Delete</Text>
                  </TouchableOpacity>

                  {selectedNotif.actionUrl ? (
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={() => {
                        const target = selectedNotif.actionUrl;
                        setSelectedNotif(null);
                        router.push(target as any);
                      }}
                    >
                      <Text style={styles.modalActionBtnText}>Open Details</Text>
                      <Ionicons name="arrow-forward" size={15} color="#FFFFFF" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.modalActionBtn}
                      onPress={() => setSelectedNotif(null)}
                    >
                      <Text style={styles.modalActionBtnText}>Got It</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Notification Preferences Modal */}
      <Modal
        visible={prefsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrefsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.prefsModalCard}>
            <View style={styles.prefsModalHeader}>
              <View style={styles.prefsModalTitleGroup}>
                <View style={[styles.fieldIconCircle, { width: 34, height: 34, borderRadius: 17 }]}>
                  <Ionicons name="options-outline" size={18} color={colors.navy} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.prefsModalTitle}>Notification Preferences</Text>
                  <Text style={styles.prefsModalSubtitle}>Choose which real-time alerts to receive</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setPrefsModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.charcoal} />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Pref 1: Events & Gate Passes */}
            <View style={styles.prefRow}>
              <View style={styles.prefIconWrap}>
                <Ionicons name="calendar-outline" size={20} color={colors.goldRich} />
              </View>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Events & Admission Passes</Text>
                <Text style={styles.prefDesc}>Gate check-in verifications & RSVP reminders</Text>
              </View>
              <Switch
                value={preferences.events}
                onValueChange={() => handleTogglePref('events')}
                trackColor={{ false: '#E2E8F0', true: colors.gold }}
                thumbColor={preferences.events ? colors.navy : '#FFFFFF'}
              />
            </View>

            <View style={styles.prefDivider} />

            {/* Pref 2: Artisan Orders */}
            <View style={styles.prefRow}>
              <View style={styles.prefIconWrap}>
                <Ionicons name="bag-check-outline" size={20} color={colors.success} />
              </View>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Artisan Orders & Marketplace</Text>
                <Text style={styles.prefDesc}>Delivery tracking, seller replies & shipments</Text>
              </View>
              <Switch
                value={preferences.orders}
                onValueChange={() => handleTogglePref('orders')}
                trackColor={{ false: '#E2E8F0', true: colors.gold }}
                thumbColor={preferences.orders ? colors.navy : '#FFFFFF'}
              />
            </View>

            <View style={styles.prefDivider} />

            {/* Pref 3: Diaspora Investments */}
            <View style={styles.prefRow}>
              <View style={styles.prefIconWrap}>
                <Ionicons name="trending-up-outline" size={20} color="#2563EB" />
              </View>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Investment Hub & Real Estate</Text>
                <Text style={styles.prefDesc}>Prospectus replies & syndication updates</Text>
              </View>
              <Switch
                value={preferences.investments}
                onValueChange={() => handleTogglePref('investments')}
                trackColor={{ false: '#E2E8F0', true: colors.gold }}
                thumbColor={preferences.investments ? colors.navy : '#FFFFFF'}
              />
            </View>

            <View style={styles.prefDivider} />

            {/* Pref 4: Community Announcements */}
            <View style={styles.prefRow}>
              <View style={styles.prefIconWrap}>
                <Ionicons name="megaphone-outline" size={20} color={colors.navy} />
              </View>
              <View style={styles.prefTextCol}>
                <Text style={styles.prefTitle}>Community & Embassy Notices</Text>
                <Text style={styles.prefDesc}>Yellow Card advisory & consular circulars</Text>
              </View>
              <Switch
                value={preferences.announcements}
                onValueChange={() => handleTogglePref('announcements')}
                trackColor={{ false: '#E2E8F0', true: colors.gold }}
                thumbColor={preferences.announcements ? colors.navy : '#FFFFFF'}
              />
            </View>

            <TouchableOpacity
              style={styles.prefsSaveBtn}
              onPress={() => setPrefsModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.prefsSaveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSettingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
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
    backgroundColor: 'rgba(7, 21, 43, 0.06)',
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
    borderColor: 'rgba(223, 183, 108, 0.35)',
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
    backgroundColor: 'rgba(223, 183, 108, 0.14)',
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

  // Modal Details
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 13, 26, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalCategoryTag: {
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: '800',
    color: colors.goldText,
    letterSpacing: 0.4,
  },
  modalTimeText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 8,
    lineHeight: 22,
  },
  modalMessage: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalDismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(214, 48, 49, 0.08)',
  },
  modalDismissBtnText: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.error,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
  },
  modalActionBtnText: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Preferences Modal
  prefsModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 22,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  prefsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  prefsModalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIconCircle: {
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefsModalTitle: {
    fontSize: 16,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.navy,
  },
  prefsModalSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(23, 25, 28, 0.07)',
    marginBottom: 14,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  prefIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  prefTextCol: {
    flex: 1,
    marginRight: 10,
  },
  prefTitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: colors.charcoal,
    marginBottom: 2,
  },
  prefDesc: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    lineHeight: 15,
  },
  prefDivider: {
    height: 1,
    backgroundColor: 'rgba(23, 25, 28, 0.05)',
    marginVertical: 4,
  },
  prefsSaveBtn: {
    backgroundColor: colors.navy,
    borderRadius: radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  prefsSaveBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
