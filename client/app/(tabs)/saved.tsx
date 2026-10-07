import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  destinations as sampleDestinations,
  events as sampleEvents,
  investments as sampleInvestments,
  products as sampleProducts,
  services as sampleServices,
} from '../../assets/data/sample';
import { contentApi, Destination, EventItem, InvestmentOpportunity, Product, Service } from '../../lib/api';
import { useFavorites } from '../../lib/favorites-context';
import { useLanguage } from '../../lib/language-context';
import { colors, fonts, radius, shadow, spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterType = 'all' | 'destination' | 'service' | 'event' | 'investment' | 'product';

const FILTER_TABS: { key: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All Items', icon: 'sparkles' },
  { key: 'destination', label: 'Heritage', icon: 'compass-outline' },
  { key: 'service', label: 'Services', icon: 'briefcase-outline' },
  { key: 'event', label: 'Events', icon: 'calendar-outline' },
  { key: 'investment', label: 'Investments', icon: 'trending-up-outline' },
  { key: 'product', label: 'Artisans', icon: 'shirt-outline' },
];

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { favorites, isLoading, toggleFavorite, refreshFavorites } = useFavorites();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Content dictionaries
  const [allDestinations, setAllDestinations] = useState<Destination[]>(sampleDestinations as any);
  const [allServices, setAllServices] = useState<Service[]>(sampleServices as any);
  const [allEvents, setAllEvents] = useState<EventItem[]>(sampleEvents as any);
  const [allInvestments, setAllInvestments] = useState<InvestmentOpportunity[]>(sampleInvestments as any);
  const [allProducts, setAllProducts] = useState<Product[]>(sampleProducts as any);

  const loadAllContent = useCallback(async () => {
    try {
      const [destRes, servRes, eventRes, invRes, prodRes] = await Promise.allSettled([
        contentApi.destinations(),
        contentApi.services(),
        contentApi.events(),
        contentApi.investments(),
        contentApi.products(),
      ]);
      if (destRes.status === 'fulfilled' && destRes.value.length > 0) {
        setAllDestinations(destRes.value);
      }
      if (servRes.status === 'fulfilled' && servRes.value.length > 0) {
        setAllServices(servRes.value);
      }
      if (eventRes.status === 'fulfilled' && eventRes.value.length > 0) {
        setAllEvents(eventRes.value);
      }
      if (invRes.status === 'fulfilled' && invRes.value.length > 0) {
        setAllInvestments(invRes.value);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.length > 0) {
        setAllProducts(prodRes.value);
      }
    } catch (err) {
      console.warn('Failed to load content for saved screen:', err);
    }
  }, []);

  useEffect(() => {
    loadAllContent();
  }, [loadAllContent]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshFavorites(), loadAllContent()]);
    setIsRefreshing(false);
  };

  // Map favorites to concrete content items
  const savedItems = useMemo(() => {
    return favorites
      .map((fav) => {
        if (fav.itemType === 'destination') {
          const item = allDestinations.find((d) => d.id === fav.itemId);
          return item ? { ...item, _type: 'destination' as const } : null;
        }
        if (fav.itemType === 'service') {
          const item = allServices.find((s) => s.id === fav.itemId);
          return item ? { ...item, _type: 'service' as const } : null;
        }
        if (fav.itemType === 'event') {
          const item = allEvents.find((e) => e.id === fav.itemId);
          return item ? { ...item, _type: 'event' as const } : null;
        }
        if (fav.itemType === 'investment') {
          const item = allInvestments.find((inv) => inv.id === fav.itemId);
          return item ? { ...item, _type: 'investment' as const } : null;
        }
        if (fav.itemType === 'product') {
          const item = allProducts.find((p) => p.id === fav.itemId);
          return item ? { ...item, _type: 'product' as const } : null;
        }
        return null;
      })
      .filter(Boolean) as Array<
      | (Destination & { _type: 'destination' })
      | (Service & { _type: 'service' })
      | (EventItem & { _type: 'event' })
      | (InvestmentOpportunity & { _type: 'investment' })
      | (Product & { _type: 'product' })
    >;
  }, [favorites, allDestinations, allServices, allEvents, allInvestments, allProducts]);

  const filteredItems = useMemo(() => {
    return filter === 'all' ? savedItems : savedItems.filter((i) => i._type === filter);
  }, [savedItems, filter]);

  return (
    <View style={styles.screen}>
      {/* ── HERO HEADER ── */}
      <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <View style={styles.headerBadge}>
              <Ionicons name="bookmark" size={11} color={colors.gold} />
              <Text style={styles.headerBadgeText}>PERSONAL SANCTUARY</Text>
            </View>
            <Text style={styles.headerTitle}>Saved Bookmarks</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{savedItems.length} SAVED</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsTrack}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = filter === tab.key;
            const count = tab.key === 'all' ? savedItems.length : savedItems.filter((i) => i._type === tab.key).length;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setFilter(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={13}
                  color={isActive ? colors.navy : 'rgba(255, 255, 255, 0.75)'}
                />
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.pillCount, isActive && styles.pillCountActive]}>
                    <Text style={[styles.pillCountText, isActive && styles.pillCountTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── SAVED CONTENT LIST ── */}
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
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="bookmark-outline" size={32} color={colors.navy} />
            </View>
            <Text style={styles.emptyTitle}>No Bookmarks Here Yet</Text>
            <Text style={styles.emptySub}>
              Tap the bookmark icon on any destination, verified service, cultural event, or artisan piece to save it to your private collection.
            </Text>

            <View style={styles.emptyNavGrid}>
              <TouchableOpacity
                style={styles.emptyNavCard}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Ionicons name="compass-outline" size={20} color={colors.navy} />
                <Text style={styles.emptyNavText}>Explore Heritage</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emptyNavCard}
                onPress={() => router.push('/(tabs)/services')}
                activeOpacity={0.85}
              >
                <Ionicons name="briefcase-outline" size={20} color={colors.navy} />
                <Text style={styles.emptyNavText}>Find Services</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emptyNavCard}
                onPress={() => router.push('/investments')}
                activeOpacity={0.85}
              >
                <Ionicons name="trending-up-outline" size={20} color={colors.navy} />
                <Text style={styles.emptyNavText}>Investments</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emptyNavCard}
                onPress={() => router.push('/marketplace')}
                activeOpacity={0.85}
              >
                <Ionicons name="shirt-outline" size={20} color={colors.navy} />
                <Text style={styles.emptyNavText}>Marketplace</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.itemsStack}>
            {filteredItems.map((item) => {
              if (item._type === 'destination') {
                return (
                  <TouchableOpacity
                    key={`dest-${item.id}`}
                    style={styles.destSavedCard}
                    activeOpacity={0.92}
                    onPress={() => router.push({ pathname: '/destination/[id]', params: { id: item.id } })}
                  >
                    <Image source={{ uri: item.image }} style={styles.destSavedImage} />
                    <View style={styles.destSavedOverlay} />

                    <View style={styles.cardTypeTag}>
                      <Text style={styles.cardTypeTagText}>HERITAGE SITE</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.removeBookmarkBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        toggleFavorite('destination', item.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="bookmark" size={17} color={colors.gold} />
                    </TouchableOpacity>

                    <View style={styles.destSavedBody}>
                      <Text style={styles.destSavedRegion}>{item.region}, Ethiopia</Text>
                      <Text style={styles.destSavedName}>{item.name}</Text>
                      <Text style={styles.destSavedBlurb} numberOfLines={2}>
                        {item.blurb}
                      </Text>

                      <View style={styles.destSavedActionRow}>
                        <Text style={styles.destSavedActionText}>Open Heritage Guide</Text>
                        <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              if (item._type === 'service') {
                return (
                  <TouchableOpacity
                    key={`serv-${item.id}`}
                    style={styles.serviceSavedCard}
                    activeOpacity={0.92}
                    onPress={() => router.push({ pathname: '/service/[id]', params: { id: item.id } })}
                  >
                    <View style={styles.serviceSavedTop}>
                      <Image source={{ uri: item.image }} style={styles.serviceSavedAvatar} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={styles.typeTagRow}>
                          <Text style={styles.serviceTypeTagText}>VERIFIED CONCIERGE</Text>
                          {item.verified && (
                            <View style={styles.verifiedCheckPill}>
                              <Ionicons name="checkmark-circle" size={12} color={colors.goldRich} />
                              <Text style={styles.verifiedCheckText}>VERIFIED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.serviceSavedName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.serviceSavedCategory}>{item.category} • {item.location}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.removeBookmarkBtnLight}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          toggleFavorite('service', item.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="bookmark" size={18} color={colors.goldRich} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.serviceSavedFooter}>
                      <Text style={styles.serviceActionText}>View Consultation Details</Text>
                      <Ionicons name="arrow-forward" size={12} color={colors.navy} />
                    </View>
                  </TouchableOpacity>
                );
              }

              if (item._type === 'event') {
                return (
                  <TouchableOpacity
                    key={`event-${item.id}`}
                    style={styles.eventSavedCard}
                    activeOpacity={0.92}
                    onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
                  >
                    <Image source={{ uri: item.image }} style={styles.eventSavedImg} />
                    <View style={{ flex: 1, padding: 12 }}>
                      <Text style={styles.eventTypeTagText}>CULTURAL EVENT</Text>
                      <Text style={styles.eventSavedTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.eventSavedMeta}>
                        <Ionicons name="calendar-outline" size={11} color={colors.charcoalLight} /> {item.date} • {item.city}
                      </Text>
                      <View style={styles.eventSavedAction}>
                        <Text style={styles.eventActionText}>View Event</Text>
                        <Ionicons name="arrow-forward" size={11} color={colors.navy} />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.removeBookmarkBtnLight}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        toggleFavorite('event', item.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="bookmark" size={18} color={colors.goldRich} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }

              if (item._type === 'investment') {
                return (
                  <TouchableOpacity
                    key={`inv-${item.id}`}
                    style={styles.invSavedCard}
                    activeOpacity={0.92}
                    onPress={() => router.push({ pathname: '/investment/[id]', params: { id: item.id } })}
                  >
                    <View style={styles.invSavedHeader}>
                      <View>
                        <Text style={styles.invTypeTagText}>DIASPORA VENTURE</Text>
                        <Text style={styles.invSavedTitle}>{item.title}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeBookmarkBtnLight}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          toggleFavorite('investment', item.id);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="bookmark" size={18} color={colors.goldRich} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.invSavedMetricsRow}>
                      <View>
                        <Text style={styles.invMetricLabel}>SECTOR</Text>
                        <Text style={styles.invMetricValue}>{item.sector}</Text>
                      </View>
                      <View>
                        <Text style={styles.invMetricLabel}>MIN CAPITAL</Text>
                        <Text style={styles.invMetricValue}>{item.minInvestment ? `$${item.minInvestment.toLocaleString()}` : 'Inquiry'}</Text>
                      </View>
                      {item.expectedReturn && (
                        <View>
                          <Text style={styles.invMetricLabel}>TARGET</Text>
                          <Text style={[styles.invMetricValue, { color: colors.goldRich }]}>{item.expectedReturn}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }

              if (item._type === 'product') {
                return (
                  <TouchableOpacity
                    key={`prod-${item.id}`}
                    style={styles.prodSavedCard}
                    activeOpacity={0.92}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
                  >
                    <Image source={{ uri: item.image }} style={styles.prodSavedImg} />
                    <View style={{ flex: 1, padding: 12 }}>
                      <Text style={styles.prodTypeTagText}>ARTISAN CRAFT</Text>
                      <Text style={styles.prodSavedTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.prodSavedSeller}>{item.sellerName}</Text>
                      <Text style={styles.prodSavedPrice}>{item.currency || '$'} {item.price}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBookmarkBtnLight}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        toggleFavorite('product', item.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="bookmark" size={18} color={colors.goldRich} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }

              return null;
            })}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── HERO HEADER ──────────────────────────────────────────
  heroHeader: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadow.header,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(223, 183, 108, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  countBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  filterPillsTrack: {
    gap: 8,
    paddingRight: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  filterPillTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  pillCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  pillCountActive: {
    backgroundColor: colors.navy,
  },
  pillCountText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    color: '#FFFFFF',
  },
  pillCountTextActive: {
    color: colors.gold,
  },

  // ── CONTENT BODY ─────────────────────────────────────────
  scrollContent: {
    paddingTop: 18,
    paddingBottom: 40,
  },
  itemsStack: {
    paddingHorizontal: 20,
    gap: 14,
  },

  // Destination Card
  destSavedCard: {
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.navy,
    ...shadow.card,
  },
  destSavedImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  destSavedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 21, 43, 0.55)',
  },
  cardTypeTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 2,
  },
  cardTypeTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.navy,
    letterSpacing: 0.5,
  },
  removeBookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 21, 43, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  destSavedBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    zIndex: 2,
  },
  destSavedRegion: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    color: colors.gold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  destSavedName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  destSavedBlurb: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
    marginBottom: 10,
  },
  destSavedActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  destSavedActionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },

  // Service Card
  serviceSavedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  serviceSavedTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceSavedAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  typeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  serviceTypeTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.charcoalLight,
    letterSpacing: 0.5,
  },
  verifiedCheckPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  verifiedCheckText: {
    fontFamily: fonts.bodyBold,
    fontSize: 7.5,
    color: colors.goldRich,
  },
  serviceSavedName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  serviceSavedCategory: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalSub,
    marginTop: 2,
  },
  removeBookmarkBtnLight: {
    padding: 6,
  },
  serviceSavedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  serviceActionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.navy,
  },

  // Event Card
  eventSavedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  eventSavedImg: {
    width: 90,
    height: '100%',
    minHeight: 85,
    backgroundColor: colors.surface,
  },
  eventTypeTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    color: colors.goldRich,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  eventSavedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },
  eventSavedMeta: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.charcoalSub,
    marginTop: 3,
  },
  eventSavedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  eventActionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    color: colors.navy,
  },

  // Investment Card
  invSavedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  invSavedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invTypeTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.goldRich,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  invSavedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  invSavedMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  invMetricLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    color: colors.charcoalLight,
    letterSpacing: 0.5,
  },
  invMetricValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.navy,
    marginTop: 1,
  },

  // Product Card
  prodSavedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  prodSavedImg: {
    width: 80,
    height: '100%',
    minHeight: 80,
    backgroundColor: colors.surface,
  },
  prodTypeTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8,
    color: colors.goldRich,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  prodSavedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },
  prodSavedSeller: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.charcoalLight,
    marginTop: 2,
  },
  prodSavedPrice: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.navy,
    marginTop: 2,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 50,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.navy,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
  },
  emptyNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  emptyNavCard: {
    width: (SCREEN_WIDTH - 56 - 12) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  emptyNavText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.navy,
  },
});
