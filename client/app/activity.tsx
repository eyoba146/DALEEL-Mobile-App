import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import {
  ActivityType,
  resolveMediaUrl,
  UnifiedActivityItem,
  userActivityApi,
  UserActivityCounts,
} from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useLanguage } from '../lib/language-context';
import { colors, fonts, radius, shadow, spacing } from '../theme/tokens';

type FilterTab = 'all' | 'event' | 'service' | 'order' | 'investment';

export default function ActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, token } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<FilterTab>(() => {
    const rawTab = params?.tab ? String(params.tab).toLowerCase() : 'all';
    if (['all', 'event', 'service', 'order', 'investment'].includes(rawTab)) {
      return rawTab as FilterTab;
    }
    return 'all';
  });

  useEffect(() => {
    if (params?.tab) {
      const rawTab = String(params.tab).toLowerCase();
      if (['all', 'event', 'service', 'order', 'investment'].includes(rawTab)) {
        setActiveTab(rawTab as FilterTab);
      }
    }
  }, [params?.tab]);

  const [items, setItems] = useState<UnifiedActivityItem[]>([]);
  const [counts, setCounts] = useState<UserActivityCounts>({
    total: 0,
    events: 0,
    services: 0,
    orders: 0,
    investments: 0,
    pending: 0,
    confirmed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await userActivityApi.getMyActivity(token, user?.email);
      if (res) {
        setItems(res.items || []);
        setCounts(
          res.counts || {
            total: 0,
            events: 0,
            services: 0,
            orders: 0,
            investments: 0,
            pending: 0,
            confirmed: 0,
          }
        );
      }
    } catch (err) {
      console.warn('Error loading user concierge activity:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token, user?.email]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchActivity();
  };

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return items;
    return items.filter((item) => item.type === activeTab);
  }, [items, activeTab]);

  const handleNavigateToTarget = (item: UnifiedActivityItem) => {
    switch (item.type) {
      case 'event':
        router.push(`/event/${item.targetId}`);
        break;
      case 'service':
        router.push(`/service/${item.targetId}`);
        break;
      case 'order':
        router.push(`/product/${item.targetId}`);
        break;
      case 'investment':
        router.push(`/investment/${item.targetId}`);
        break;
    }
  };

  const renderStatusBadge = (status: string, type: ActivityType) => {
    const s = status.toLowerCase();
    let bg = '#F1F5F9';
    let text = '#475569';
    let label = status.replace(/_/g, ' ').toUpperCase();

    if (s === 'confirmed' || s === 'completed' || s === 'checked_in') {
      bg = '#DCFCE7';
      text = '#166534';
      label = type === 'event' ? 'CONFIRMED ATTENDANCE' : 'CONFIRMED';
    } else if (s === 'dispatched') {
      bg = '#E0F2FE';
      text = '#0369A1';
      label = 'DISPATCHED';
    } else if (s === 'pending' || s === 'in_review') {
      bg = '#FEF3C7';
      text = '#92400E';
      label = s === 'in_review' ? 'IN REVIEW' : 'PENDING';
    } else if (s === 'cancelled' || s === 'declined') {
      bg = '#FEE2E2';
      text = '#991B1B';
      label = 'CANCELLED';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor:
                s === 'confirmed' || s === 'completed' || s === 'checked_in'
                  ? '#16A34A'
                  : s === 'pending' || s === 'in_review'
                  ? '#D97706'
                  : s === 'dispatched'
                  ? '#0284C7'
                  : '#DC2626',
            },
          ]}
        />
        <Text style={[styles.statusBadgeText, { color: text }]}>{label}</Text>
      </View>
    );
  };

  const renderEventRsvpCard = (item: UnifiedActivityItem) => (
    <View key={item.id} style={styles.standardCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTypeTag}>
          <Ionicons name="calendar" size={13} color={colors.goldRich} />
          <Text style={[styles.cardTypeTagText, { color: colors.goldRich }]}>
            CULTURAL EVENT RSVP
          </Text>
        </View>
        {renderStatusBadge(item.status, 'event')}
      </View>

      <View style={styles.cardBodyRow}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.pillRow}>
            <Ionicons name="location-outline" size={13} color={colors.charcoalLight} />
            <Text style={styles.pillText} numberOfLines={1}>
              {item.meta.venue ? `${item.meta.venue}, ` : ''}{item.meta.city || 'Addis Ababa'}
            </Text>
          </View>
          {item.meta.time && (
            <View style={styles.pillRow}>
              <Ionicons name="time-outline" size={13} color={colors.charcoalLight} />
              <Text style={styles.pillText}>{item.meta.time}</Text>
            </View>
          )}
          <View style={[styles.pillRow, { marginTop: 4 }]}>
            <Ionicons name="people-outline" size={13} color={colors.navy} />
            <Text style={[styles.pillText, { color: colors.navy, fontWeight: '600' }]}>
              {item.meta.ticketsCount || 1} {Number(item.meta.ticketsCount) > 1 ? 'Guests Attending' : 'Guest Attending'}
            </Text>
          </View>
        </View>
        {item.image && (
          <Image
            source={{ uri: resolveMediaUrl(item.image) || undefined }}
            style={styles.cardThumbnail}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDateText}>
          Inquired on {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => handleNavigateToTarget(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardActionBtnText}>View Event</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServiceCard = (item: UnifiedActivityItem) => (
    <View key={item.id} style={styles.standardCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTypeTag}>
          <Ionicons name="briefcase" size={13} color="#0D9488" />
          <Text style={[styles.cardTypeTagText, { color: '#0D9488' }]}>
            {item.meta.category ? item.meta.category.toUpperCase() : 'VERIFIED SERVICE CONSULTATION'}
          </Text>
        </View>
        {renderStatusBadge(item.status, 'service')}
      </View>

      <View style={styles.cardBodyRow}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.meta.timeframe && (
            <View style={styles.pillRow}>
              <Ionicons name="hourglass-outline" size={13} color={colors.charcoalLight} />
              <Text style={styles.pillText}>Timeframe: {item.meta.timeframe}</Text>
            </View>
          )}
          {item.meta.message && (
            <Text style={styles.cardMessageSnippet} numberOfLines={2}>
              "{item.meta.message}"
            </Text>
          )}
        </View>
        {item.image && (
          <Image
            source={{ uri: resolveMediaUrl(item.image) || undefined }}
            style={styles.cardThumbnail}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDateText}>
          Submitted {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => handleNavigateToTarget(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardActionBtnText}>View Specialist</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderCard = (item: UnifiedActivityItem) => (
    <View key={item.id} style={styles.standardCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTypeTag}>
          <Ionicons name="shirt-outline" size={13} color={colors.navy} />
          <Text style={[styles.cardTypeTagText, { color: colors.navy }]}>
            ARTISAN CRAFT INQUIRY
          </Text>
        </View>
        {renderStatusBadge(item.status, 'order')}
      </View>

      <View style={styles.cardBodyRow}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.pillRow}>
            <Ionicons name="layers-outline" size={13} color={colors.charcoalLight} />
            <Text style={styles.pillText}>Quantity Requested: {item.meta.quantity || 1} pcs</Text>
          </View>
          {typeof item.meta.totalPrice === 'number' && (
            <View style={styles.pillRow}>
              <Ionicons name="pricetag-outline" size={13} color={colors.goldText} />
              <Text style={[styles.pillText, { color: colors.navy, fontWeight: '600' }]}>
                Estimate: {item.meta.totalPrice} {item.meta.currency || 'USD'}
              </Text>
            </View>
          )}
        </View>
        {item.image && (
          <Image
            source={{ uri: resolveMediaUrl(item.image) || undefined }}
            style={styles.cardThumbnail}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDateText}>
          Requested {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => handleNavigateToTarget(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardActionBtnText}>View Item</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInvestmentCard = (item: UnifiedActivityItem) => (
    <View key={item.id} style={styles.standardCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTypeTag}>
          <Ionicons name="trending-up" size={13} color="#2563EB" />
          <Text style={[styles.cardTypeTagText, { color: '#2563EB' }]}>
            {item.meta.sector ? item.meta.sector.toUpperCase() : 'DIASPORA INVESTMENT VENTURE'}
          </Text>
        </View>
        {renderStatusBadge(item.status, 'investment')}
      </View>

      <View style={styles.cardBodyRow}>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          {item.meta.investmentBudget && (
            <View style={styles.pillRow}>
              <Ionicons name="cash-outline" size={13} color={colors.goldText} />
              <Text style={styles.pillText}>Target Allocation: {item.meta.investmentBudget}</Text>
            </View>
          )}
          {item.meta.message && (
            <Text style={styles.cardMessageSnippet} numberOfLines={2}>
              "{item.meta.message}"
            </Text>
          )}
        </View>
        {item.image && (
          <Image
            source={{ uri: resolveMediaUrl(item.image) || undefined }}
            style={styles.cardThumbnail}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDateText}>
          Inquired on {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => handleNavigateToTarget(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardActionBtnText}>Review Brief</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    let emptyTitle = 'No Active Inquiries Found';
    let emptyDesc = 'You currently have no active event RSVPs, consultations, or requests.';
    let ctaText = 'Explore Heritage & Opportunities';
    let targetRoute = '/(tabs)/explore';

    if (activeTab === 'event') {
      emptyTitle = 'No Event RSVPs Registered';
      emptyDesc = 'Discover upcoming Ethiopian cultural gatherings, diaspora summits, and community festivals.';
      ctaText = 'Discover Cultural Events';
      targetRoute = '/events';
    } else if (activeTab === 'service') {
      emptyTitle = 'No Consultations Requested';
      emptyDesc = 'Connect with verified Ethiopian attorneys, physicians, certified tour guides, and tax consultants.';
      ctaText = 'Browse Verified Services';
      targetRoute = '/(tabs)/services';
    } else if (activeTab === 'order') {
      emptyTitle = 'No Artisan Orders';
      emptyDesc = 'Support master artisans by requesting custom Habesha Kemis, single-origin coffee, and leathercraft.';
      ctaText = 'Explore Artisan Marketplace';
      targetRoute = '/marketplace';
    } else if (activeTab === 'investment') {
      emptyTitle = 'No Prospectuses Requested';
      emptyDesc = 'Explore vetted commercial agriculture, renewable tech, and residential developments in Ethiopia.';
      ctaText = 'Explore Investment Hub';
      targetRoute = '/investments';
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="file-tray-outline" size={44} color={colors.gold} />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyDesc}>{emptyDesc}</Text>
        <TouchableOpacity
          style={styles.emptyCtaBtn}
          onPress={() => router.push(targetRoute as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="compass-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.emptyCtaText}>{ctaText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Concierge Activity & Inquiries"
        subtitle="Track RSVPs, specialist consultations & craft orders"
        showBack={true}
      />

      {/* Summary Telemetry Bar */}
      <View style={styles.summaryRibbon}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{counts.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#16A34A' }]}>{counts.confirmed}</Text>
          <Text style={styles.summaryLabel}>Confirmed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#D97706' }]}>{counts.pending}</Text>
          <Text style={styles.summaryLabel}>In Review</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: colors.goldText }]}>{counts.events}</Text>
          <Text style={styles.summaryLabel}>RSVPs</Text>
        </View>
      </View>

      {/* Filter Tabs Strip */}
      <View style={styles.tabsStripWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>
              All ({counts.total})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'event' && styles.filterTabActive]}
            onPress={() => setActiveTab('event')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={activeTab === 'event' ? '#FFFFFF' : colors.charcoalLight}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.filterTabText, activeTab === 'event' && styles.filterTabTextActive]}>
              Events ({counts.events})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'service' && styles.filterTabActive]}
            onPress={() => setActiveTab('service')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="briefcase-outline"
              size={14}
              color={activeTab === 'service' ? '#FFFFFF' : colors.charcoalLight}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.filterTabText, activeTab === 'service' && styles.filterTabTextActive]}>
              Services ({counts.services})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'order' && styles.filterTabActive]}
            onPress={() => setActiveTab('order')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="shirt-outline"
              size={14}
              color={activeTab === 'order' ? '#FFFFFF' : colors.charcoalLight}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.filterTabText, activeTab === 'order' && styles.filterTabTextActive]}>
              Artisan Orders ({counts.orders})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, activeTab === 'investment' && styles.filterTabActive]}
            onPress={() => setActiveTab('investment')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trending-up-outline"
              size={14}
              color={activeTab === 'investment' ? '#FFFFFF' : colors.charcoalLight}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.filterTabText,
                activeTab === 'investment' && styles.filterTabTextActive,
              ]}
            >
              Investments ({counts.investments})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Loading your concierge requests...</Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
              colors={[colors.gold]}
            />
          }
        >
          {filteredItems.length === 0 ? (
            renderEmptyState()
          ) : (
            filteredItems.map((item) => {
              switch (item.type) {
                case 'event':
                  return renderEventRsvpCard(item);
                case 'service':
                  return renderServiceCard(item);
                case 'order':
                  return renderOrderCard(item);
                case 'investment':
                  return renderInvestmentCard(item);
                default:
                  return null;
              }
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.charcoalLight,
  },
  summaryRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow.card,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNum: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.navy,
  },
  summaryLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.charcoalLight,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  tabsStripWrapper: {
    marginVertical: spacing.sm + 2,
  },
  tabsScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterTabText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  filterTabTextActive: {
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl + 20,
    gap: 14,
  },
  standardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    ...shadow.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 4,
  },
  cardTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardTypeTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.navy,
    lineHeight: 20,
    marginBottom: 4,
  },
  cardThumbnail: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    marginLeft: 8,
    flexShrink: 0,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  pillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoalLight,
  },
  cardMessageSnippet: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoal,
    fontStyle: 'italic',
    marginTop: 5,
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: radius.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm + 4,
    paddingTop: spacing.xs + 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardDateText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.charcoalLight,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cardActionBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDesc: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoalLight,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.lg,
    maxWidth: 290,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    ...shadow.card,
  },
  emptyCtaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
