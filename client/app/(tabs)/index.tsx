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
import { destinations as sampleDestinations, events as sampleEvents, services as sampleServices } from '../../assets/data/sample';
import { contentApi, Destination, EventItem, resolveMediaUrl, Service } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useFavorites } from '../../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

export default function Home() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const avatarUri = resolveMediaUrl(user?.avatarUrl);
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [destinations, setDestinations] = useState<Destination[]>(sampleDestinations as any);
  const [services, setServices] = useState<Service[]>(sampleServices as any);
  const [events, setEvents] = useState<EventItem[]>(sampleEvents as any);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const loadData = useCallback(async () => {
    try {
      const [destRes, servRes, eventRes] = await Promise.allSettled([
        contentApi.destinations(),
        contentApi.services(),
        contentApi.events(),
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
            <Text style={styles.greeting}>Selam, {firstName} 👋</Text>
            <Text style={styles.subGreeting}>Discover Ethiopia from anywhere</Text>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="search-outline" size={19} color="#9CA3AF" />
          <Text style={styles.searchPlaceholder}>Search services, places, events…</Text>
        </TouchableOpacity>

        {/* Announcement Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="sparkles" size={18} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Diaspora Concierge</Text>
            <Text style={styles.bannerText}>
              Verified investment opportunities and relocation services now live.
            </Text>
          </View>
        </View>

        {/* Destinations */}
        <SectionHeader
          title="Popular Destinations"
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
          title="Recommended Services"
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
          title="Upcoming Events"
          onSeeAll={() => router.push('/events')}
        />
        {events.map((e) => {
          const fav = isFavorite('event', e.id);
          const dateStr = typeof e.date === 'string' ? e.date.split('T')[0] : 'Upcoming';
          return (
            <TouchableOpacity key={e.id} activeOpacity={0.85} style={styles.eventCard}>
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
                onPress={() => toggleFavorite('event', e.id)}
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.sectionLink}>See all</Text>
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
});
