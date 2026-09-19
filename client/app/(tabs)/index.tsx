import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { colors, fonts, radius, spacing } from '../../theme/tokens';

function resolveBannerIcon(icon?: string | null): keyof typeof Ionicons.glyphMap {
  if (!icon) return 'sparkles';
  const i = icon.toLowerCase();
  if (i.includes('invest') || i.includes('spark')) return 'sparkles';
  if (i.includes('shirt') || i.includes('cloth') || i.includes('market')) return 'shirt-outline';
  if (i.includes('event') || i.includes('calendar')) return 'calendar-outline';
  if (i.includes('briefcase') || i.includes('service')) return 'briefcase-outline';
  if (i.includes('dest') || i.includes('compass')) return 'compass-outline';
  return 'sparkles';
}

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
      description: 'Explore verified real estate, commercial agriculture & startup opportunities.',
      icon: 'sparkles',
      actionUrl: '/investments',
      active: true,
      order: 1,
    },
    {
      id: 'default-market',
      title: 'Artisan Marketplace',
      description: 'Handcrafted Habesha Kemis, Guji coffee, leather goods & certified jewelry.',
      icon: 'shirt-outline',
      actionUrl: '/marketplace',
      active: true,
      order: 2,
    },
  ]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

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

  return (
    <View style={styles.screen}>
      {/* Deep Navy + Warm Gold Brand Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        {/* Decorative Warm Gold Waves */}
        <View pointerEvents="none" style={styles.goldWaveContainer}>
          <View style={styles.goldWaveOuter} />
          <View style={styles.goldWaveInner} />
        </View>

        <View style={styles.headerContentRow}>
          <View style={styles.headerBrand}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="compass" size={17} color={colors.navy} />
            </View>
            <Text style={styles.headerLogo}>DALEEL</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/activity')}
              activeOpacity={0.75}
              accessibilityLabel="My Passes & Activity"
            >
              <Ionicons name="ticket-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.75}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.8}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.headerAvatar} />
              ) : (
                <View style={styles.headerAvatarFallback}>
                  <Text style={styles.headerAvatarText}>
                    {user?.name?.[0]?.toUpperCase() || 'D'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
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
        {/* Welcome Row */}
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greeting}>{t('home.greeting', 'Selam')}, {firstName}</Text>
            <Text style={styles.subGreeting}>{t('home.subGreeting', 'Discover Ethiopia from anywhere')}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="search-outline" size={19} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder', 'Search services, places, events…')}</Text>
        </TouchableOpacity>

        {/* Dynamic Announcement Banners */}
        {announcements.map((banner, idx) => (
          <TouchableOpacity
            key={banner.id}
            style={[styles.banner, idx > 0 && { marginTop: 10 }]}
            activeOpacity={0.88}
            onPress={() => {
              if (banner.actionUrl) {
                router.push(banner.actionUrl as any);
              }
            }}
          >
            <View style={styles.bannerIcon}>
              <Ionicons name={resolveBannerIcon(banner.icon)} size={18} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{banner.title}</Text>
              <Text style={styles.bannerText}>{banner.description}</Text>
            </View>
            <Ionicons name="arrow-forward" size={17} color={colors.navy} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        ))}

        {/* Destinations */}
        <SectionHeader
          title={t('home.exploreDestinations', 'Popular Destinations')}
          onSeeAll={() => router.push('/(tabs)/explore')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hScroll}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        >
          {destinations.map((d) => {
            const fav = isFavorite('destination', d.id);
            return (
              <TouchableOpacity
                key={d.id}
                style={styles.destCard}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
              >
                <Image source={{ uri: d.image }} style={styles.destImage} />
                <View style={styles.destOverlay} />

                {/* Bookmark trigger */}
                <TouchableOpacity
                  style={styles.destBookmarkBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleFavorite('destination', d.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={fav ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={fav ? colors.gold : '#FFFFFF'}
                  />
                </TouchableOpacity>

                <View style={styles.destBody}>
                  <Text style={styles.destName}>{d.name}</Text>
                  <View style={styles.destMetaRow}>
                    <Ionicons name="location-sharp" size={12} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.destRegion}>{d.region}, Ethiopia</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Services */}
        <SectionHeader
          title={t('home.recommendedServices', 'Recommended Services')}
          onSeeAll={() => router.push('/(tabs)/services')}
        />
        {services.slice(0, 3).map((s) => {
          const fav = isFavorite('service', s.id);
          return (
            <TouchableOpacity
              key={s.id}
              activeOpacity={0.85}
              style={styles.serviceCard}
              onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })}
            >
              <Image source={{ uri: s.image }} style={styles.serviceImage} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={styles.serviceTitleRow}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  {s.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={15} color={colors.gold} />
                    </View>
                  )}
                </View>
                <Text style={styles.serviceCategory}>{s.category}</Text>
                <Text style={styles.serviceLocation}>
                  <Ionicons name="location-outline" size={12} color="#718096" /> {s.location}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cardBookmarkBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  toggleFavorite('service', s.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={fav ? 'bookmark' : 'bookmark-outline'}
                  size={19}
                  color={fav ? colors.gold : '#A0AEC0'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Events */}
        <SectionHeader
          title={t('home.upcomingEvents', 'Upcoming Events')}
          onSeeAll={() => router.push('/events')}
        />
        {events.slice(0, 3).map((e) => {
          const fav = isFavorite('event', e.id);
          const dateStr = typeof e.date === 'string' ? e.date.split('T')[0] : 'Upcoming';
          return (
            <TouchableOpacity
              key={e.id}
              activeOpacity={0.85}
              style={styles.eventCard}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: e.id } })}
            >
              <Image source={{ uri: e.image }} style={styles.eventImage} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <Text style={styles.eventMeta}>
                  <Ionicons name="calendar-outline" size={12} color="#718096" /> {dateStr} • {e.city}
                </Text>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{e.category}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.cardBookmarkBtn}
                onPress={(evt) => {
                  evt.stopPropagation?.();
                  toggleFavorite('event', e.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={fav ? 'bookmark' : 'bookmark-outline'}
                  size={19}
                  color={fav ? colors.gold : '#A0AEC0'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}

        {/* Investment Opportunities */}
        <SectionHeader
          title={t('home.diasporaInvestments', 'Diaspora Investment Hub')}
          onSeeAll={() => router.push('/investments')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hScroll}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        >
          {investments.map((inv) => {
            const fav = isFavorite('investment', inv.id);
            const formattedMin = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: inv.currency || 'USD',
              maximumFractionDigits: 0,
            }).format(inv.minInvestment);

            return (
              <TouchableOpacity
                key={inv.id}
                style={styles.invCard}
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/investment/[id]', params: { id: inv.id } })}
              >
                <Image source={{ uri: inv.image }} style={styles.invImage} />
                <View style={styles.invSectorBadge}>
                  <Text style={styles.invSectorText}>{inv.sector.toUpperCase()}</Text>
                </View>

                <TouchableOpacity
                  style={styles.invBookmarkBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleFavorite('investment', inv.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={fav ? 'bookmark' : 'bookmark-outline'}
                    size={17}
                    color={fav ? colors.gold : '#FFFFFF'}
                  />
                </TouchableOpacity>

                <View style={styles.invBody}>
                  <Text style={styles.invTitle} numberOfLines={1}>
                    {inv.title}
                  </Text>
                  <Text style={styles.invLocation} numberOfLines={1}>
                    <Ionicons name="location-sharp" size={11} color={colors.gold} /> {inv.location}
                  </Text>

                  <View style={styles.invMetaRow}>
                    <View>
                      <Text style={styles.invLabel}>MIN ENTRY</Text>
                      <Text style={styles.invValue}>{formattedMin}</Text>
                    </View>

                    {inv.expectedReturn && (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.invLabel}>EST. RETURN</Text>
                        <Text style={[styles.invValue, { color: colors.goldRich }]}>
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

        {/* Artisan Marketplace */}
        <SectionHeader
          title={t('home.artisanMarketplace', 'Artisan Marketplace')}
          onSeeAll={() => router.push('/marketplace')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.hScroll}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        >
          {products.map((p) => {
            const fav = isFavorite('product', p.id);
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.productCard}
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
              >
                <Image source={{ uri: p.image }} style={styles.productImage} />
                <View style={styles.productPriceBadge}>
                  <Text style={styles.productPriceText}>{p.price.toLocaleString()} {p.currency}</Text>
                </View>
                <TouchableOpacity
                  style={styles.productBookmarkBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleFavorite('product', p.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={fav ? 'bookmark' : 'bookmark-outline'}
                    size={16}
                    color={fav ? colors.gold : '#FFFFFF'}
                  />
                </TouchableOpacity>
                <View style={styles.productBody}>
                  <Text style={styles.productCategory}>{p.category.toUpperCase()}</Text>
                  <Text style={styles.productCardTitle} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={styles.productSeller} numberOfLines={1}>
                    <Ionicons name="storefront-outline" size={11} color={colors.gold} /> {p.sellerName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.sectionLink}>{t('common.seeAll', 'See all')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },

  // ── Deep Navy Brand Header ─────────────────────────
  header: {
    backgroundColor: colors.headerNavy,
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#0E2243',
  },
  goldWaveContainer: {
    position: 'absolute',
    top: -24,
    right: -40,
    width: 220,
    height: 110,
  },
  goldWaveOuter: {
    position: 'absolute',
    width: 200,
    height: 85,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: 'rgba(223, 183, 108, 0.35)',
    transform: [{ rotate: '-18deg' }],
  },
  goldWaveInner: {
    position: 'absolute',
    top: 14,
    right: 16,
    width: 170,
    height: 65,
    borderRadius: 65,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 183, 108, 0.2)',
    transform: [{ rotate: '-22deg' }],
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
    marginTop: 4,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    lineHeight: 12,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold,
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  headerAvatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.navyMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.gold,
  },

  // ── Welcome Row ───────────────────────────────────
  welcomeRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  greeting: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.charcoal,
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalSub,
    marginTop: 3,
  },

  content: {
    paddingBottom: 32,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  searchPlaceholder: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#9CA3AF',
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.goldSoft,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: colors.goldBorder,
    marginBottom: 8,
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  bannerTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.navy,
    marginBottom: 2,
  },
  bannerText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#5C4304',
    lineHeight: 17,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 18,
    color: colors.charcoal,
  },
  sectionLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.gold,
  },

  // Destinations Horizontal Scroll
  hScroll: {
    marginHorizontal: -20,
  },
  destCard: {
    width: 250,
    height: 168,
    marginRight: 14,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.navy,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  destImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  destOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 28, 21, 0.42)',
  },
  destBookmarkBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(8, 28, 21, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  destName: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  destMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  destRegion: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
  },

  // Service Card
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  serviceImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.charcoal,
  },
  verifiedBadge: {
    marginTop: 1,
  },
  serviceCategory: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.gold,
    marginTop: 3,
  },
  serviceLocation: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    marginTop: 3,
  },
  cardBookmarkBtn: {
    padding: 10,
  },

  // Event Card
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  eventImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  eventTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.charcoal,
  },
  eventMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    marginTop: 4,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTagText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.navy,
  },

  // ── Home Investment Card ────────────────────────────
  invCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  invImage: {
    width: '100%',
    height: 140,
  },
  invSectorBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(7, 21, 43, 0.88)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  invSectorText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9.5,
    color: colors.gold,
    letterSpacing: 0.6,
  },
  invBookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
  },
  invBody: {
    padding: 14,
  },
  invTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14.5,
    color: colors.charcoal,
    marginBottom: 4,
  },
  invLocation: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    marginBottom: 12,
  },
  invMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  invLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.charcoalSub,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  invValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: colors.navy,
  },

  // ── Home Marketplace Card ────────────────────────────
  productCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: colors.border,
    marginRight: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 130,
  },
  productPriceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.navy,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  productPriceText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.gold,
  },
  productBookmarkBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
  },
  productBody: {
    padding: 12,
  },
  productCategory: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9.5,
    color: colors.goldRich,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  productCardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.charcoal,
    marginBottom: 4,
  },
  productSeller: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.charcoalSub,
  },
});
