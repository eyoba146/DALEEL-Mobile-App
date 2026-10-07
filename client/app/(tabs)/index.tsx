import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import {
  contentApi,
  Destination,
  EventItem,
  InvestmentOpportunity,
  Product,
  resolveMediaUrl,
  Service,
  announcementsApi,
  AnnouncementBanner,
} from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useFavorites } from '../../lib/favorites-context';
import { useLanguage } from '../../lib/language-context';
import { useNotifications } from '../../lib/notifications-context';
import { colors, fonts, radius, shadow, spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUICK_PILLARS = [
  { id: 'heritage', label: 'Heritage', sub: 'Historical Sites', icon: 'compass-outline', route: '/(tabs)/explore' },
  { id: 'services', label: 'Services', sub: 'Verified Directory', icon: 'briefcase-outline', route: '/(tabs)/services' },
  { id: 'invest', label: 'Investment', sub: 'Diaspora Hub', icon: 'trending-up-outline', route: '/investments' },
  { id: 'artisan', label: 'Artisan', sub: 'Cultural Craft', icon: 'shirt-outline', route: '/marketplace' },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const avatarUri = resolveMediaUrl(user?.avatarUrl);
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { unreadCount } = useNotifications();
  const { t } = useLanguage();

  const [destinations, setDestinations] = useState<Destination[]>(sampleDestinations as any);
  const [services, setServices] = useState<Service[]>(sampleServices as any);
  const [events, setEvents] = useState<EventItem[]>(sampleEvents as any);
  const [investments, setInvestments] = useState<InvestmentOpportunity[]>(sampleInvestments as any);
  const [products, setProducts] = useState<Product[]>(sampleProducts as any);
  const [announcements, setAnnouncements] = useState<AnnouncementBanner[]>([
    {
      id: 'default-inv',
      title: 'Diaspora Investment Hub',
      description: 'Explore verified commercial agriculture, tech & real estate ventures in Ethiopia.',
      icon: 'sparkles',
      actionUrl: '/investments',
      active: true,
      order: 1,
    },
    {
      id: 'default-market',
      title: 'Artisan Cultural Marketplace',
      description: 'Authentic Habesha Kemis, premium single-origin coffee & handcrafted leather goods.',
      icon: 'shirt-outline',
      actionUrl: '/marketplace',
      active: true,
      order: 2,
    },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'Friend';

  const loadData = useCallback(async () => {
    try {
      const [destRes, servRes, eventRes, invRes, prodRes, annRes] = await Promise.allSettled([
        contentApi.destinations(),
        contentApi.services(),
        contentApi.events(),
        contentApi.investments(),
        contentApi.products(),
        announcementsApi.getAll(),
      ]);

      if (destRes.status === 'fulfilled' && destRes.value.length > 0) {
        setDestinations(destRes.value);
      }
      if (servRes.status === 'fulfilled' && servRes.value.length > 0) {
        setServices(servRes.value);
      }
      if (eventRes.status === 'fulfilled' && eventRes.value.length > 0) {
        setEvents(eventRes.value);
      }
      if (invRes.status === 'fulfilled' && invRes.value.length > 0) {
        setInvestments(invRes.value);
      }
      if (prodRes.status === 'fulfilled' && prodRes.value.length > 0) {
        setProducts(prodRes.value);
      }
      if (annRes.status === 'fulfilled' && annRes.value.length > 0) {
        setAnnouncements(annRes.value);
      }
    } catch (err) {
      console.warn('Error loading home data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Featured premier showcase (First UNESCO destination or primary highlight)
  const spotlightDest = destinations.find((d) => d.unescoStatus) || destinations[0];
  const secondaryDestinations = destinations.filter((d) => d.id !== spotlightDest?.id);

  return (
    <View style={styles.screen}>
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
        {/* ── 1. EDITORIAL HERO SURFACE (Deep Navy Canvas) ── */}
        <View style={[styles.heroSurface, { paddingTop: Math.max(insets.top, 16) }]}>
          {/* Top Brand & Utility Header */}
          <View style={styles.heroTopBar}>
            <View style={styles.brandCluster}>
              <View style={styles.brandIconWrap}>
                <Ionicons name="compass" size={17} color={colors.navy} />
              </View>
              <View>
                <Text style={styles.brandWordmark}>D A L E E L</Text>
                <Text style={styles.brandSubmark}>DIASPORA CONCIERGE</Text>
              </View>
            </View>

            <View style={styles.utilityActions}>
              <TouchableOpacity
                style={styles.utilityBtn}
                onPress={() => router.push('/notifications')}
                activeOpacity={0.7}
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={19} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.avatarPill}
                onPress={() => router.push('/(tabs)/profile')}
                activeOpacity={0.8}
              >
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>
                      {user?.name?.[0]?.toUpperCase() || 'D'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Editorial Greeting Block */}
          <View style={styles.heroCopyBlock}>
            <View style={styles.conciergeBadge}>
              <Ionicons name="sparkles" size={12} color={colors.gold} />
              <Text style={styles.conciergeBadgeText}>CURATED FOR THE DIASPORA</Text>
            </View>
            <Text style={styles.heroHeading}>
              {t('home.greeting', 'Selam')}, {firstName}
            </Text>
            <Text style={styles.heroSubhead}>
              Your premier gateway to heritage exploration, verified professional services, and trusted Ethiopian opportunities.
            </Text>
          </View>

          {/* Integrated Luxury Search Bar */}
          <TouchableOpacity
            style={styles.heroSearchBar}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <View style={styles.searchIconPod}>
              <Ionicons name="search" size={16} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.searchBarText}>
                {t('home.searchPlaceholder', 'Search heritage, services, artisans, events…')}
              </Text>
            </View>
            <View style={styles.searchActionChip}>
              <Text style={styles.searchActionChipText}>Explore</Text>
              <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Quick Pillars Grid inside Hero transition */}
          <View style={styles.pillarsGrid}>
            {QUICK_PILLARS.map((pillar) => (
              <TouchableOpacity
                key={pillar.id}
                style={styles.pillarCard}
                activeOpacity={0.82}
                onPress={() => router.push(pillar.route as any)}
              >
                <View style={styles.pillarIconCircle}>
                  <Ionicons name={pillar.icon as any} size={18} color={colors.gold} />
                </View>
                <Text style={styles.pillarTitle}>{pillar.label}</Text>
                <Text style={styles.pillarSub}>{pillar.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 2. PREMIER SPOTLIGHT SHOWCASE (Large Editorial Hero Card) ── */}
        {spotlightDest && (
          <View style={styles.spotlightSection}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.editorialOverline}>HERITAGE SPOTLIGHT</Text>
                <Text style={styles.editorialHeadline}>Featured Sanctuary</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/explore')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.editorialLinkText}>View All</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.spotlightCard}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/destination/[id]', params: { id: spotlightDest.id } })}
            >
              <Image source={{ uri: spotlightDest.image }} style={styles.spotlightImage} />
              <View style={styles.spotlightGradientOverlay} />

              <View style={styles.spotlightTopBadges}>
                {spotlightDest.unescoStatus && (
                  <View style={styles.unescoTag}>
                    <Ionicons name="ribbon" size={11} color="#8C6A21" />
                    <Text style={styles.unescoTagText}>UNESCO WORLD HERITAGE</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.spotlightBookmark}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleFavorite('destination', spotlightDest.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isFavorite('destination', spotlightDest.id) ? 'bookmark' : 'bookmark-outline'}
                    size={17}
                    color={isFavorite('destination', spotlightDest.id) ? colors.gold : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.spotlightContent}>
                <View style={styles.spotlightRegionRow}>
                  <Ionicons name="location-sharp" size={13} color={colors.gold} />
                  <Text style={styles.spotlightRegionText}>{spotlightDest.region}, Ethiopia</Text>
                </View>
                <Text style={styles.spotlightTitle}>{spotlightDest.name}</Text>
                <Text style={styles.spotlightBlurb} numberOfLines={2}>
                  {spotlightDest.blurb}
                </Text>

                <View style={styles.spotlightFooter}>
                  <View style={styles.spotlightCta}>
                    <Text style={styles.spotlightCtaText}>Explore Heritage Site</Text>
                    <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                  </View>
                  {spotlightDest.rating && (
                    <View style={styles.spotlightRating}>
                      <Ionicons name="star" size={13} color={colors.gold} />
                      <Text style={styles.spotlightRatingText}>{spotlightDest.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 3. CURATED HERITAGE SITES (Horizontal Editorial Track) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.editorialOverline}>ETHIOPIAN EXPEDITIONS</Text>
              <Text style={styles.editorialHeadline}>Curated Destinations</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/explore')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.editorialLinkText}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScrollContent}
          >
            {secondaryDestinations.map((d) => {
              const fav = isFavorite('destination', d.id);
              return (
                <TouchableOpacity
                  key={d.id}
                  style={styles.destTrackCard}
                  activeOpacity={0.88}
                  onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
                >
                  <Image source={{ uri: d.image }} style={styles.destTrackImage} />
                  <View style={styles.destTrackOverlay} />

                  <TouchableOpacity
                    style={styles.destTrackBookmark}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleFavorite('destination', d.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={fav ? 'bookmark' : 'bookmark-outline'}
                      size={16}
                      color={fav ? colors.gold : '#FFFFFF'}
                    />
                  </TouchableOpacity>

                  <View style={styles.destTrackBody}>
                    <View style={styles.destTrackRegionRow}>
                      <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.85)" />
                      <Text style={styles.destTrackRegion}>{d.region}</Text>
                    </View>
                    <Text style={styles.destTrackName} numberOfLines={1}>
                      {d.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 4. VERIFIED DIASPORA CONCIERGE DIRECTORY ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.editorialOverline}>VERIFIED DIRECTORY</Text>
              <Text style={styles.editorialHeadline}>Concierge Providers</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/services')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.editorialLinkText}>Directory</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.servicesStack}>
            {services.slice(0, 3).map((s) => {
              const fav = isFavorite('service', s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.serviceRowCard}
                  activeOpacity={0.85}
                  onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })}
                >
                  <Image source={{ uri: s.image }} style={styles.serviceRowImage} />
                  <View style={styles.serviceRowMeta}>
                    <View style={styles.serviceRowHeader}>
                      <Text style={styles.serviceRowName} numberOfLines={1}>
                        {s.name}
                      </Text>
                      {s.verified && (
                        <View style={styles.verifiedMiniBadge}>
                          <Ionicons name="checkmark-circle" size={13} color={colors.gold} />
                          <Text style={styles.verifiedMiniText}>VERIFIED</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.serviceRowCategory}>{s.category}</Text>
                    <View style={styles.serviceRowLocation}>
                      <Ionicons name="location-sharp" size={11} color={colors.charcoalLight} />
                      <Text style={styles.serviceRowLocationText}>{s.location}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.serviceRowAction}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleFavorite('service', s.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={fav ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={fav ? colors.gold : colors.charcoalLight}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 5. DYNAMIC ANNOUNCEMENT BANNER ── */}
        {announcements.length > 0 && (
          <View style={styles.bannerWrap}>
            {announcements.slice(0, 1).map((banner) => (
              <TouchableOpacity
                key={banner.id}
                style={styles.curatedBanner}
                activeOpacity={0.9}
                onPress={() => {
                  if (banner.actionUrl) router.push(banner.actionUrl as any);
                }}
              >
                <View style={styles.bannerLeftAccent} />
                <View style={styles.bannerIconCircle}>
                  <Ionicons name="sparkles" size={18} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bannerEyebrow}>STRATEGIC OPPORTUNITY</Text>
                  <Text style={styles.curatedBannerTitle}>{banner.title}</Text>
                  <Text style={styles.curatedBannerDesc} numberOfLines={2}>
                    {banner.description}
                  </Text>
                </View>
                <View style={styles.bannerArrowCircle}>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── 6. UPCOMING CULTURAL MOMENTS (Events) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.editorialOverline}>CALENDAR</Text>
              <Text style={styles.editorialHeadline}>Cultural Events</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/events')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.editorialLinkText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.eventsGrid}>
            {events.slice(0, 2).map((e) => {
              const fav = isFavorite('event', e.id);
              const dateRaw = typeof e.date === 'string' ? e.date : '';
              const dateParts = dateRaw.split('-');
              const monthStr = dateParts[1] ? ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][parseInt(dateParts[1], 10) - 1] : 'DATE';
              const dayStr = dateParts[2] ? dateParts[2].slice(0, 2) : '—';

              return (
                <TouchableOpacity
                  key={e.id}
                  style={styles.eventGridCard}
                  activeOpacity={0.88}
                  onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
                >
                  <Image source={{ uri: e.image }} style={styles.eventGridImg} />
                  <View style={styles.eventDateStamp}>
                    <Text style={styles.eventMonthText}>{monthStr}</Text>
                    <Text style={styles.eventDayText}>{dayStr}</Text>
                  </View>

                  <View style={styles.eventGridBody}>
                    <Text style={styles.eventCategoryTag}>{e.category.toUpperCase()}</Text>
                    <Text style={styles.eventGridTitle} numberOfLines={2}>
                      {e.title}
                    </Text>
                    <View style={styles.eventGridMetaRow}>
                      <Ionicons name="location-outline" size={12} color={colors.charcoalLight} />
                      <Text style={styles.eventGridCity}>{e.city}, Ethiopia</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 7. DIASPORA INVESTMENT VENTURES ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.editorialOverline}>CAPITAL ALLOCATION</Text>
              <Text style={styles.editorialHeadline}>Diaspora Investments</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/investments')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.editorialLinkText}>Explore Hub</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScrollContent}
          >
            {investments.map((inv) => {
              const formattedMin = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: inv.currency || 'USD',
                maximumFractionDigits: 0,
              }).format(inv.minInvestment);

              return (
                <TouchableOpacity
                  key={inv.id}
                  style={styles.invShowcaseCard}
                  activeOpacity={0.88}
                  onPress={() => router.push({ pathname: '/investment/[id]', params: { id: inv.id } })}
                >
                  <Image source={{ uri: inv.image }} style={styles.invShowcaseImg} />
                  <View style={styles.invSectorChip}>
                    <Text style={styles.invSectorChipText}>{inv.sector.toUpperCase()}</Text>
                  </View>

                  <View style={styles.invShowcaseBody}>
                    <Text style={styles.invShowcaseTitle} numberOfLines={1}>
                      {inv.title}
                    </Text>
                    <View style={styles.invShowcaseMetaRow}>
                      <Ionicons name="location-sharp" size={11} color={colors.gold} />
                      <Text style={styles.invShowcaseLocation}>{inv.location}</Text>
                    </View>

                    <View style={styles.invShowcaseMetrics}>
                      <View>
                        <Text style={styles.invMetricLabel}>MIN CAPITAL</Text>
                        <Text style={styles.invMetricValue}>{formattedMin}</Text>
                      </View>
                      {inv.expectedReturn && (
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.invMetricLabel}>RETURN</Text>
                          <Text style={[styles.invMetricValue, { color: colors.goldRich }]}>
                            {inv.expectedReturn.split(' ')[0]}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

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
  scrollContent: {
    paddingBottom: 40,
  },

  // ── 1. HERO SURFACE ─────────────────────────────────────
  heroSurface: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...shadow.header,
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  brandWordmark: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  brandSubmark: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.gold,
    letterSpacing: 1.5,
  },
  utilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  utilityBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: fonts.bodyBold,
  },
  avatarPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Editorial Hero Copy
  heroCopyBlock: {
    marginTop: 18,
    marginBottom: 20,
  },
  conciergeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(223, 183, 108, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.35)',
  },
  conciergeBadgeText: {
    fontSize: 9.5,
    fontFamily: fonts.bodyBold,
    color: colors.gold,
    letterSpacing: 1,
  },
  heroHeading: {
    fontFamily: fonts.heading,
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubhead: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 20,
    marginTop: 6,
  },

  // Hero Search Bar
  heroSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    height: 52,
    ...shadow.button,
  },
  searchIconPod: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  searchBarText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalLight,
  },
  searchActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  searchActionChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },

  // Concierge Pillars Grid
  pillarsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillarIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pillarTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  pillarSub: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
    textAlign: 'center',
  },

  // ── 2. PREMIER SPOTLIGHT HERO CARD ──────────────────────
  spotlightSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  editorialOverline: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.goldRich,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  editorialHeadline: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.navy,
    letterSpacing: -0.3,
  },
  editorialLinkText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: colors.navy,
    letterSpacing: 0.2,
  },

  spotlightCard: {
    height: 320,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.navy,
    ...shadow.card,
  },
  spotlightImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  spotlightGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 21, 43, 0.65)',
  },
  spotlightTopBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    zIndex: 2,
  },
  unescoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  unescoTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: '#8C6A21',
    letterSpacing: 0.5,
  },
  spotlightBookmark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(7, 21, 43, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  spotlightContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 2,
  },
  spotlightRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  spotlightRegionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  spotlightTitle: {
    fontFamily: fonts.heading,
    fontSize: 26,
    lineHeight: 32,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  spotlightBlurb: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 14,
  },
  spotlightFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotlightCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  spotlightCtaText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.navy,
  },
  spotlightRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(7, 21, 43, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
  },
  spotlightRatingText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // ── 3. CURATED TRACK ────────────────────────────────────
  sectionWrap: {
    marginTop: 28,
  },
  hScrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  destTrackCard: {
    width: 170,
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.navy,
    ...shadow.card,
  },
  destTrackImage: {
    width: '100%',
    height: '100%',
  },
  destTrackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 21, 43, 0.45)',
  },
  destTrackBookmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(7, 21, 43, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  destTrackBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  destTrackRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  destTrackRegion: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  destTrackName: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#FFFFFF',
  },

  // ── 4. VERIFIED SERVICES DIRECTORY ──────────────────────
  servicesStack: {
    paddingHorizontal: 20,
    gap: 10,
  },
  serviceRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  serviceRowImage: {
    width: 58,
    height: 58,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  serviceRowMeta: {
    flex: 1,
    marginLeft: 12,
  },
  serviceRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  serviceRowName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
    flexShrink: 1,
  },
  verifiedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  verifiedMiniText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.goldRich,
    letterSpacing: 0.5,
  },
  serviceRowCategory: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoalSub,
  },
  serviceRowLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  serviceRowLocationText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalLight,
  },
  serviceRowAction: {
    padding: 6,
  },

  // ── 5. CURATED BANNER ───────────────────────────────────
  bannerWrap: {
    paddingHorizontal: 20,
    marginTop: 26,
  },
  curatedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    ...shadow.button,
  },
  bannerLeftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.gold,
  },
  bannerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(223, 183, 108, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  curatedBannerTitle: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  curatedBannerDesc: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
  },
  bannerArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  // ── 6. EVENTS GRID ──────────────────────────────────────
  eventsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 12,
  },
  eventGridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  eventGridImg: {
    width: '100%',
    height: 100,
    backgroundColor: colors.surface,
  },
  eventDateStamp: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.navy,
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignItems: 'center',
    minWidth: 38,
  },
  eventMonthText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  eventDayText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  eventGridBody: {
    padding: 10,
  },
  eventCategoryTag: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.goldRich,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  eventGridTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
    lineHeight: 17,
    marginBottom: 4,
  },
  eventGridMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  eventGridCity: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalLight,
  },

  // ── 7. INVESTMENTS SHOWCASE ─────────────────────────────
  invShowcaseCard: {
    width: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  invShowcaseImg: {
    width: '100%',
    height: 110,
  },
  invSectorChip: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  invSectorChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  invShowcaseBody: {
    padding: 12,
  },
  invShowcaseTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.navy,
    marginBottom: 3,
  },
  invShowcaseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 10,
  },
  invShowcaseLocation: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalLight,
  },
  invShowcaseMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  invMetricLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.charcoalLight,
    letterSpacing: 0.5,
  },
  invMetricValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: colors.navy,
    marginTop: 1,
  },
});
