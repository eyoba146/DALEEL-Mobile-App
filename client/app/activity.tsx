import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  const { user, token } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
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
      console.error('Error loading user activity:', err);
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
    let label = status.toUpperCase();

    if (s === 'confirmed' || s === 'completed') {
      bg = '#DCFCE7';
      text = '#166534';
      label = type === 'event' ? 'CONFIRMED PASS' : 'CONFIRMED';
    } else if (s === 'dispatched') {
      bg = '#E0F2FE';
      text = '#0369A1';
      label = 'DISPATCHED';
    } else if (s === 'pending' || s === 'in_review') {
      bg = '#FEF3C7';
      text = '#92400E';
      label = s === 'in_review' ? 'IN REVIEW' : 'PENDING';
    } else if (s === 'cancelled' || s === 'rejected') {
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
                s === 'confirmed' || s === 'completed'
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

  const renderEventPassCard = (item: UnifiedActivityItem) => {
    const isConfirmed = item.status.toLowerCase() === 'confirmed';
    return (
      <View key={item.id} style={styles.ticketCardWrapper}>
        {/* Ticket Header Bar */}
        <View style={styles.ticketTopBar}>
          <View style={styles.ticketBranding}>
            <Ionicons name="sparkles" size={14} color={colors.gold} />
            <Text style={styles.ticketBrandingText}>DALEEL ADMISSION PASS</Text>
          </View>
          {renderStatusBadge(item.status, 'event')}
        </View>

        {/* Ticket Body */}
        <View style={styles.ticketBody}>
          <View style={styles.ticketRow}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={styles.ticketEventTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.ticketMetaRow}>
                <Ionicons name="location-outline" size={14} color={colors.goldText} />
                <Text style={styles.ticketMetaText} numberOfLines={1}>
                  {item.meta.venue ? `${item.meta.venue}, ` : ''}
                  {item.meta.city || 'Addis Ababa'}
                </Text>
              </View>
              {item.meta.time && (
                <View style={styles.ticketMetaRow}>
                  <Ionicons name="time-outline" size={14} color={colors.goldText} />
                  <Text style={styles.ticketMetaText}>{item.meta.time}</Text>
                </View>
              )}
            </View>

            {item.image && (
              <Image
                source={{ uri: resolveMediaUrl(item.image) || undefined }}
                style={styles.ticketThumbnail}
              />
            )}
          </View>

          {/* Attendee Details Grid */}
          <View style={styles.ticketDetailsGrid}>
            <View style={styles.ticketDetailCol}>
              <Text style={styles.ticketDetailLabel}>ADMISSION</Text>
              <Text style={styles.ticketDetailValue}>
                {item.meta.ticketsCount || 1} {Number(item.meta.ticketsCount) > 1 ? 'Passes' : 'Pass'}
              </Text>
            </View>
            <View style={styles.ticketDetailCol}>
              <Text style={styles.ticketDetailLabel}>PASS REFERENCE</Text>
              <Text style={styles.ticketCodeMono}>{item.meta.passCode || 'DAL-EVT-PASS'}</Text>
            </View>
            <View style={styles.ticketDetailCol}>
              <Text style={styles.ticketDetailLabel}>TYPE</Text>
              <Text style={styles.ticketDetailValue}>General VIP</Text>
            </View>
          </View>
        </View>

        {/* Perforated Divider with Notches */}
        <View style={styles.ticketDividerContainer}>
          <View style={styles.notchLeft} />
          <View style={styles.dashedDivider} />
          <View style={styles.notchRight} />
        </View>

        {/* Ticket Stub / QR Verification Section */}
        <View style={styles.ticketStub}>
          <View style={styles.qrVisualBlock}>
            {/* High-fidelity digital pass barcode frame */}
            <View style={styles.qrGridFrame}>
              {isConfirmed && item.meta.passCode ? (
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      item.meta.passCode
                    )}&color=07152B`,
                  }}
                  style={{ width: 56, height: 56, borderRadius: 4 }}
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="qr-code-outline" size={46} color={colors.navy} />
              )}
            </View>
            <View style={styles.qrTextCol}>
              <Text style={styles.qrTitle}>
                {isConfirmed ? 'OFFICIAL CHECK-IN PASS' : 'VERIFICATION PENDING'}
              </Text>
              <Text style={styles.qrSubtitle}>
                {isConfirmed
                  ? 'Present this QR code at the gate scanner for admission.'
                  : 'Coordinator is reviewing capacity. Pass activates upon confirmation.'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.ticketActionBtn}
            onPress={() => handleNavigateToTarget(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.ticketActionBtnText}>Manage Reservation</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.navy} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderServiceCard = (item: UnifiedActivityItem) => (
    <View key={item.id} style={styles.standardCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTypeTag}>
          <Ionicons name="briefcase" size={12} color="#0D9488" />
          <Text style={[styles.cardTypeTagText, { color: '#0D9488' }]}>
            {item.meta.category || 'VERIFIED SERVICE'}
          </Text>
        </View>
        {renderStatusBadge(item.status, 'service')}
      </View>

      <View style={styles.cardBodyRow}>
        <View style={{ flex: 1 }}>
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
          <Text style={styles.cardActionBtnText}>Manage Inquiry</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderCard = (item: UnifiedActivityItem) => (
    <View key={item.id} style={styles.standardCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTypeTag}>
          <Ionicons name="bag-handle" size={12} color={colors.success} />
          <Text style={[styles.cardTypeTagText, { color: colors.success }]}>ARTISAN MARKETPLACE</Text>
        </View>
        {renderStatusBadge(item.status, 'order')}
      </View>

      <View style={styles.cardBodyRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceHighlight}>
              {item.meta.currency || 'ETB'} {Number(item.meta.totalPrice || 0).toLocaleString()}
            </Text>
            <Text style={styles.quantitySub}>
              ({item.meta.quantity || 1} piece{Number(item.meta.quantity) > 1 ? 's' : ''})
            </Text>
          </View>
          {item.meta.deliveryAddress && (
            <View style={styles.pillRow}>
              <Ionicons name="navigate-outline" size={13} color={colors.charcoalLight} />
              <Text style={styles.pillText} numberOfLines={1}>
                {item.meta.deliveryAddress}
              </Text>
            </View>
          )}
        </View>
        {item.image && (
          <Image
            source={{ uri: resolveMediaUrl(item.image) || undefined }}
            style={styles.cardThumbnail}
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDateText}>
          Ordered {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => handleNavigateToTarget(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardActionBtnText}>View Item</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInvestmentCard = (item: UnifiedActivityItem) => (
    <View key={item.id} style={styles.standardCard}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardTypeTag}>
          <Ionicons name="trending-up" size={12} color="#2563EB" />
          <Text style={[styles.cardTypeTagText, { color: '#2563EB' }]}>
            {item.meta.sector || 'DIASPORA INVESTMENT'}
          </Text>
        </View>
        {renderStatusBadge(item.status, 'investment')}
      </View>

      <View style={styles.cardBodyRow}>
        <View style={{ flex: 1 }}>
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
          />
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.cardDateText}>
          Inquired {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          style={styles.cardActionBtn}
          onPress={() => handleNavigateToTarget(item)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardActionBtnText}>Review Brief</Text>
          <Ionicons name="chevron-forward" size={15} color={colors.navy} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    let emptyTitle = 'No Active Requests Found';
    let emptyDesc = 'You currently have no active passes, service inquiries, or orders.';
    let ctaText = 'Explore Cultural Gatherings';
    let ctaRoute = '/events';

    if (activeTab === 'event') {
      emptyTitle = 'No Event Passes Yet';
      emptyDesc = 'Discover upcoming diaspora summits, cultural galas, and networking events.';
      ctaText = 'Browse Upcoming Events';
      ctaRoute = '/events';
    } else if (activeTab === 'service') {
      emptyTitle = 'No Service Inquiries';
      emptyDesc = 'Connect with verified diaspora legal, logistics, medical, and banking professionals.';
      ctaText = 'Find Verified Services';
      ctaRoute = '/(tabs)/services';
    } else if (activeTab === 'order') {
      emptyTitle = 'No Artisan Orders';
      emptyDesc = 'Browse authentic Habesha traditional wear, Guji specialty coffee, and handcrafted leather goods.';
      ctaText = 'Visit Artisan Marketplace';
      ctaRoute = '/marketplace';
    } else if (activeTab === 'investment') {
      emptyTitle = 'No Investment Inquiries';
      emptyDesc = 'Explore pre-vetted commercial agriculture, real estate, and tech venture prospectuses.';
      ctaText = 'Explore Investment Hub';
      ctaRoute = '/investments';
    }

    return (
      <View style={styles.emptyStateWrapper}>
        <View style={styles.emptyIconCircle}>
          <Ionicons
            name={
              activeTab === 'event'
                ? 'ticket-outline'
                : activeTab === 'service'
                ? 'briefcase-outline'
                : activeTab === 'order'
                ? 'bag-handle-outline'
                : activeTab === 'investment'
                ? 'trending-up-outline'
                : 'file-tray-outline'
            }
            size={38}
            color={colors.goldText}
          />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyDesc}>{emptyDesc}</Text>
        <TouchableOpacity
          style={styles.emptyCtaBtn}
          onPress={() => router.push(ctaRoute as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="compass-outline" size={16} color={colors.navy} style={{ marginRight: 6 }} />
          <Text style={styles.emptyCtaText}>{ctaText}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="My Passes & Activity"
        subtitle="Manage tickets, inquiries & orders"
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
          <Text style={styles.summaryLabel}>Passes</Text>
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
              name="ticket-outline"
              size={14}
              color={activeTab === 'event' ? colors.navy : colors.charcoalLight}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.filterTabText, activeTab === 'event' && styles.filterTabTextActive]}>
              Event Passes ({counts.events})
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
              color={activeTab === 'service' ? colors.navy : colors.charcoalLight}
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
              name="bag-handle-outline"
              size={14}
              color={activeTab === 'order' ? colors.navy : colors.charcoalLight}
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
              color={activeTab === 'investment' ? colors.navy : colors.charcoalLight}
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
          <Text style={styles.loadingText}>Loading your passes and requests...</Text>
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
                  return renderEventPassCard(item);
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
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterTabText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoal,
  },
  filterTabTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl + 20,
    gap: 14,
  },

  // --- Luxury Boarding Pass Ticket Styles ---
  ticketCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: '#DFB76C',
    overflow: 'hidden',
    ...shadow.card,
  },
  ticketTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  ticketBranding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketBrandingText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.gold,
  },
  ticketBody: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
  },
  ticketRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ticketEventTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.navy,
    lineHeight: 22,
    marginBottom: 6,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  ticketMetaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoalLight,
  },
  ticketThumbnail: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
  },
  ticketDetailsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  ticketDetailCol: {
    alignItems: 'flex-start',
  },
  ticketDetailLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.8,
    color: colors.charcoalLight,
    marginBottom: 2,
  },
  ticketDetailValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.navy,
  },
  ticketCodeMono: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.goldText,
    letterSpacing: 0.5,
  },
  ticketDividerContainer: {
    position: 'relative',
    height: 20,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  notchLeft: {
    position: 'absolute',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1.5,
    borderRightColor: '#DFB76C',
  },
  notchRight: {
    position: 'absolute',
    right: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 1.5,
    borderLeftColor: '#DFB76C',
  },
  dashedDivider: {
    marginHorizontal: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  ticketStub: {
    padding: spacing.md,
    backgroundColor: '#FAF7F2',
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  qrVisualBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrGridFrame: {
    width: 58,
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  qrTextCol: {
    flex: 1,
  },
  qrTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.navy,
    letterSpacing: 0.5,
  },
  qrSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalLight,
    marginTop: 2,
    lineHeight: 15,
  },
  ticketActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.sm + 2,
  },
  ticketActionBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },

  // --- Standard Activity Cards ---
  standardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadow.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs + 2,
  },
  cardTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTypeTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginVertical: spacing.xs,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.navy,
    marginBottom: 4,
  },
  cardThumbnail: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    marginLeft: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  pillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoalLight,
  },
  cardMessageSnippet: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoal,
    fontStyle: 'italic',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  priceHighlight: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.navy,
  },
  quantitySub: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoalLight,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm + 2,
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardDateText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalLight,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardActionBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
  },

  // --- Empty States ---
  emptyStateWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: spacing.md,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalLight,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  emptyCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.md,
  },
  emptyCtaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },
});
