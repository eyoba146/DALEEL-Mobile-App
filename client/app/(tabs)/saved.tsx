import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  destinations as sampleDestinations,
  events as sampleEvents,
  services as sampleServices,
} from '../../assets/data/sample';
import { contentApi, Destination, EventItem, Service } from '../../lib/api';
import ScreenHeader from '../../components/ScreenHeader';
import { useFavorites } from '../../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

type FilterType = 'all' | 'destination' | 'service' | 'event';

export default function SavedScreen() {
  const router = useRouter();
  const { favorites, isLoading, toggleFavorite, refreshFavorites } = useFavorites();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Content dictionaries
  const [allDestinations, setAllDestinations] = useState<Destination[]>(sampleDestinations as any);
  const [allServices, setAllServices] = useState<Service[]>(sampleServices as any);
  const [allEvents, setAllEvents] = useState<EventItem[]>(sampleEvents as any);

  const loadAllContent = useCallback(async () => {
    try {
      const [destRes, servRes, eventRes] = await Promise.allSettled([
        contentApi.destinations(),
        contentApi.services(),
        contentApi.events(),
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
  const savedItems = favorites
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
      return null;
    })
    .filter(Boolean) as Array<
    | (Destination & { _type: 'destination' })
    | (Service & { _type: 'service' })
    | (EventItem & { _type: 'event' })
  >;

  const filteredItems = filter === 'all' ? savedItems : savedItems.filter((i) => i._type === filter);

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Saved Items"
        subtitle="Your bookmarked places, services & events"
        badgeCount={savedItems.length}
      />

      {/* Filter sub-bar */}
      <View style={styles.filterBar}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'destination', label: 'Places' },
            { key: 'service', label: 'Services' },
            { key: 'event', label: 'Events' },
          ] as const
        ).map((t) => {
          const isActive = filter === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              onPress={() => setFilter(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
        {filteredItems.map((item) => {
          if (item._type === 'destination') {
            return (
              <TouchableOpacity
                key={`dest-${item.id}`}
                style={styles.card}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: '/destination/[id]', params: { id: item.id } })}
              >
                <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>DESTINATION</Text>
                  </View>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardBlurb} numberOfLines={2}>
                    {item.blurb}
                  </Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={13} color="#718096" />
                    <Text style={styles.metaText}>{item.region}, Ethiopia</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.bookmarkBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleFavorite('destination', item.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bookmark" size={20} color={colors.gold} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }

          if (item._type === 'service') {
            return (
              <TouchableOpacity
                key={`serv-${item.id}`}
                style={styles.card}
                activeOpacity={0.92}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: item.id } })}
              >
                <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <View style={[styles.typeBadge, { backgroundColor: '#FEFCBF' }]}>
                    <Text style={[styles.typeBadgeText, { color: '#744210' }]}>SERVICE</Text>
                  </View>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={13} color="#718096" />
                    <Text style={styles.metaText}>{item.location}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.bookmarkBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleFavorite('service', item.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bookmark" size={20} color={colors.gold} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }

          if (item._type === 'event') {
            const dateStr =
              typeof item.date === 'string'
                ? item.date.split('T')[0]
                : typeof (item.date as any) === 'object'
                ? new Date(item.date).toISOString().split('T')[0]
                : 'Upcoming';

            return (
              <TouchableOpacity
                key={`event-${item.id}`}
                style={styles.card}
                activeOpacity={0.92}
                onPress={() => router.push('/events')}
              >
                <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <View style={[styles.typeBadge, { backgroundColor: '#E2E8F0' }]}>
                    <Text style={[styles.typeBadgeText, { color: colors.navy }]}>EVENT</Text>
                  </View>
                  <Text style={styles.cardName}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#718096" />
                    <Text style={styles.metaText}>
                      {dateStr} • {item.city}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.bookmarkBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleFavorite('event', item.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="bookmark" size={20} color={colors.gold} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }

          return null;
        })}

        {filteredItems.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="bookmark-outline" size={40} color={colors.navy} />
            </View>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyText}>
              Tap the bookmark icon on any destination, service, or event to save it here for instant access.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.85}
              >
                <Text style={styles.exploreButtonText}>Explore Places</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exploreButton, { backgroundColor: colors.gold }]}
                onPress={() => router.push('/events')}
                activeOpacity={0.85}
              >
                <Text style={[styles.exploreButtonText, { color: colors.navy }]}>View Events</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  // ── Slim Nav Header ─────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.charcoal,
    letterSpacing: -0.4,
  },
  headerCount: {
    backgroundColor: colors.goldSoft,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  headerCountText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.goldRich,
  },
  // ── Filter sub-bar ─────────────────────────────────
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filterPill: {
    paddingHorizontal: 13,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoalSub,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemiBold,
  },
  // ── Legacy shims ───────────────────────────────────
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tagText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.gold, letterSpacing: 1.2 },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.charcoalSub },
  filterRow: { flexDirection: 'row', gap: 8 },

  content: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
  },
  cardBody: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  typeBadgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.navy,
    letterSpacing: 0.5,
  },
  cardName: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.charcoal,
    marginBottom: 2,
  },
  cardCategory: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.gold,
    marginBottom: 2,
  },
  cardBlurb: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
  },
  bookmarkBtn: {
    padding: 10,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.charcoal,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 21,
  },
  exploreButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  exploreButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
