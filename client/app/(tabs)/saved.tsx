import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
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
  investments as sampleInvestments,
  services as sampleServices,
} from '../../assets/data/sample';
import { contentApi, Destination, EventItem, InvestmentOpportunity, Service } from '../../lib/api';
import ScreenHeader from '../../components/ScreenHeader';
import { useFavorites } from '../../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterType = 'all' | 'destination' | 'service' | 'event' | 'investment';

function AnimatedCardWrapper({
  index,
  filterKey,
  children,
}: {
  index: number;
  filterKey: string;
  children: React.ReactNode;
}) {
  const anim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      tension: 65,
      friction: 9,
      delay: Math.min(index * 45, 250),
      useNativeDriver: true,
    }).start();
  }, [filterKey, index, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1],
  });

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY }, { scale }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const { favorites, isLoading, toggleFavorite, refreshFavorites } = useFavorites();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Dynamic Carousel Fades ──
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [carouselContentWidth, setCarouselContentWidth] = useState(1);
  const [carouselLayoutWidth, setCarouselLayoutWidth] = useState(0);

  const maxScroll = Math.max(40, carouselContentWidth - carouselLayoutWidth);
  const leftFadeOpacity = scrollX.interpolate({
    inputRange: [0, 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const rightFadeOpacity = scrollX.interpolate({
    inputRange: [Math.max(0, maxScroll - 30), maxScroll],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Content dictionaries
  const [allDestinations, setAllDestinations] = useState<Destination[]>(sampleDestinations as any);
  const [allServices, setAllServices] = useState<Service[]>(sampleServices as any);
  const [allEvents, setAllEvents] = useState<EventItem[]>(sampleEvents as any);
  const [allInvestments, setAllInvestments] = useState<InvestmentOpportunity[]>(sampleInvestments as any);

  const loadAllContent = useCallback(async () => {
    try {
      const [destRes, servRes, eventRes, invRes] = await Promise.allSettled([
        contentApi.destinations(),
        contentApi.services(),
        contentApi.events(),
        contentApi.investments(),
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
      if (fav.itemType === 'investment') {
        const item = allInvestments.find((inv) => inv.id === fav.itemId);
        return item ? { ...item, _type: 'investment' as const } : null;
      }
      return null;
    })
    .filter(Boolean) as Array<
    | (Destination & { _type: 'destination' })
    | (Service & { _type: 'service' })
    | (EventItem & { _type: 'event' })
    | (InvestmentOpportunity & { _type: 'investment' })
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
            { key: 'investment', label: 'Investments' },
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
        {filteredItems.map((item, index) => {
          if (item._type === 'destination') {
            return (
              <AnimatedCardWrapper key={`dest-${item.id}`} index={index} filterKey={filter}>
                <TouchableOpacity
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
              </AnimatedCardWrapper>
            );
          }

          if (item._type === 'service') {
            return (
              <AnimatedCardWrapper key={`serv-${item.id}`} index={index} filterKey={filter}>
                <TouchableOpacity
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
              </AnimatedCardWrapper>
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
              <AnimatedCardWrapper key={`event-${item.id}`} index={index} filterKey={filter}>
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.92}
                  onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
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
              </AnimatedCardWrapper>
            );
          }

          if (item._type === 'investment') {
            return (
              <AnimatedCardWrapper key={`inv-${item.id}`} index={index} filterKey={filter}>
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.92}
                  onPress={() => router.push({ pathname: '/investment/[id]', params: { id: item.id } })}
                >
                  <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                  <View style={styles.cardBody}>
                    <View style={[styles.typeBadge, { backgroundColor: '#EBF8FF' }]}>
                      <Text style={[styles.typeBadgeText, { color: '#2B6CB0' }]}>INVESTMENT</Text>
                    </View>
                    <Text style={styles.cardName}>{item.title}</Text>
                    <Text style={styles.cardCategory}>{item.sector}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={13} color="#718096" />
                      <Text style={styles.metaText}>{item.location}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.bookmarkBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleFavorite('investment', item.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="bookmark" size={20} color={colors.gold} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </AnimatedCardWrapper>
            );
          }

          return null;
        })}

        {filteredItems.length === 0 && (
          <View style={styles.emptyContainer}>
            {/* 1. Concentric Glowing Gold Badge */}
            <View style={styles.emptyGlowOuter}>
              <View style={styles.emptyGlowMiddle}>
                <View style={styles.emptyGlowCore}>
                  <Ionicons name="bookmark" size={30} color={colors.goldRich} />
                </View>
              </View>
            </View>

            {/* 2. Headline & Narrative */}
            <View style={styles.emptyEyebrowBadge}>
              <Ionicons name="sparkles" size={11} color={colors.goldRich} />
              <Text style={styles.emptyEyebrowText}>YOUR PERSONAL COLLECTION</Text>
            </View>
            
            <Text style={styles.emptyHeadline}>
              {filter === 'destination'
                ? 'No Places Bookmarked'
                : filter === 'service'
                ? 'No Partners Bookmarked'
                : filter === 'event'
                ? 'No Events Saved'
                : filter === 'investment'
                ? 'No Investments Saved'
                : 'Nothing Saved Yet'}
            </Text>

            <Text style={styles.emptySubtext}>
              {filter === 'destination'
                ? 'Bookmark UNESCO world heritage sites, highland treks, and historical landmarks to organize your itinerary.'
                : filter === 'service'
                ? 'Save trusted relocation partners, legal counsel, and banking concierges for instant offline reference.'
                : filter === 'event'
                ? 'Save Ethiopian cultural festivals, business summits, and diaspora forums to receive schedule reminders.'
                : filter === 'investment'
                ? 'Bookmark vetted real estate developments, commercial agriculture projects, and startups to build your portfolio.'
                : 'As you discover Ethiopia’s timeless heritage, vetted diaspora services, and cultural events, tap the bookmark icon to curate your personal collection here.'}
            </Text>

            {/* 3. Quick Action Exploration Cards */}
            <View style={styles.emptyActionsGrid}>
              <TouchableOpacity
                style={styles.emptyActionCard}
                onPress={() => router.push('/(tabs)/explore')}
                activeOpacity={0.88}
              >
                <View style={styles.emptyActionIconCircle}>
                  <Ionicons name="compass" size={20} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyActionTitle}>Explore Heritage</Text>
                  <Text style={styles.emptyActionDesc}>Lalibela, Simien, Addis & Harar</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.goldRich} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.emptyActionCard}
                onPress={() => router.push('/(tabs)/services')}
                activeOpacity={0.88}
              >
                <View style={styles.emptyActionIconCircle}>
                  <Ionicons name="briefcase" size={19} color={colors.navy} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyActionTitle}>Vetted Services</Text>
                  <Text style={styles.emptyActionDesc}>Relocation, legal, banking & tours</Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={colors.goldRich} />
              </TouchableOpacity>
            </View>

            {/* 4. Suggested Starters Carousel */}
            <View style={styles.suggestedSection}>
              <View style={styles.suggestedHeaderRow}>
                <View style={styles.suggestedHeaderIconCircle}>
                  <Ionicons name="sparkles" size={13} color={colors.goldRich} />
                </View>
                <Text style={styles.suggestedHeaderTitle}>Popular to Start Your Collection</Text>
                <View style={styles.suggestedScrollHint}>
                  <Text style={styles.suggestedScrollHintText}>Scroll</Text>
                  <Ionicons name="arrow-forward" size={11} color={colors.goldRich} />
                </View>
              </View>

              <View style={styles.carouselContainer}>
                <Animated.ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.suggestedScrollContent}
                  snapToInterval={244}
                  decelerationRate="fast"
                  onContentSizeChange={(w) => setCarouselContentWidth(w)}
                  onLayout={(e) => setCarouselLayoutWidth(e.nativeEvent.layout.width)}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: true }
                  )}
                  scrollEventThrottle={16}
                >
                  {allDestinations.slice(0, 4).map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.suggestedCard}
                      onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: d.image }} style={styles.suggestedImage} resizeMode="cover" />
                      <LinearGradient
                        colors={['transparent', 'rgba(7, 21, 43, 0.35)', 'rgba(7, 21, 43, 0.9)']}
                        locations={[0, 0.45, 1]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.suggestedBody}>
                        <View style={styles.suggestedPill}>
                          <Ionicons name="location-sharp" size={9} color="#DFB76C" style={{ marginRight: 3 }} />
                          <Text style={styles.suggestedPillText}>{d.region}</Text>
                        </View>
                        <Text style={styles.suggestedName} numberOfLines={1}>{d.name}</Text>
                        <TouchableOpacity
                          style={styles.suggestedSaveBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            toggleFavorite('destination', d.id);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="bookmark-outline" size={13} color={colors.navy} />
                          <Text style={styles.suggestedSaveBtnText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {allServices.slice(0, 3).map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.suggestedCard}
                      onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: s.image }} style={styles.suggestedImage} resizeMode="cover" />
                      <LinearGradient
                        colors={['transparent', 'rgba(7, 21, 43, 0.35)', 'rgba(7, 21, 43, 0.9)']}
                        locations={[0, 0.45, 1]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.suggestedBody}>
                        <View style={styles.suggestedPill}>
                          <Ionicons name="briefcase" size={9} color="#DFB76C" style={{ marginRight: 3 }} />
                          <Text style={styles.suggestedPillText}>{s.category}</Text>
                        </View>
                        <Text style={styles.suggestedName} numberOfLines={1}>{s.name}</Text>
                        <TouchableOpacity
                          style={styles.suggestedSaveBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            toggleFavorite('service', s.id);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="bookmark-outline" size={13} color={colors.navy} />
                          <Text style={styles.suggestedSaveBtnText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </Animated.ScrollView>

                {/* Dynamic Left Edge Fade (Navy) */}
                <Animated.View style={[styles.carouselFadeLeft, { opacity: leftFadeOpacity }]} pointerEvents="none">
                  <LinearGradient
                    colors={['rgba(7, 21, 43, 1)', 'rgba(7, 21, 43, 0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>

                {/* Dynamic Right Edge Fade (Navy) */}
                <Animated.View style={[styles.carouselFadeRight, { opacity: rightFadeOpacity }]} pointerEvents="none">
                  <LinearGradient
                    colors={['rgba(7, 21, 43, 0)', 'rgba(7, 21, 43, 1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
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

  // ── 10x Empty State Styles ─────────────────────────
  emptyContainer: {
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },
  emptyGlowOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(223, 183, 108, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(223, 183, 108, 0.25)',
    marginBottom: 16,
  },
  emptyGlowMiddle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGlowCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyEyebrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.35)',
  },
  emptyEyebrowText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.goldRich,
    letterSpacing: 1,
  },
  emptyHeadline: {
    fontFamily: fonts.heading,
    fontSize: 26,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 10,
    marginBottom: 24,
  },

  // Action Cards Grid
  emptyActionsGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  emptyActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'flex-start',
    gap: 8,
  },
  emptyActionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyActionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.navy,
  },
  emptyActionDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalSub,
    marginTop: 2,
    lineHeight: 15,
  },

  // Suggested Starters Section (Premium Navy VIP UI)
  suggestedSection: {
    width: SCREEN_WIDTH - 24,
    alignSelf: 'center',
    backgroundColor: colors.navy,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 12,
    overflow: 'hidden',
  },
  suggestedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  suggestedHeaderIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedHeaderTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  suggestedScrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(223, 183, 108, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  suggestedScrollHintText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10.5,
    color: colors.goldRich,
  },
  carouselContainer: {
    position: 'relative',
    width: '100%',
  },
  carouselFadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 28,
    zIndex: 10,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  carouselFadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
    zIndex: 10,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  suggestedScrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  suggestedCard: {
    width: 230,
    height: 200,
    borderRadius: radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0F2447',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  suggestedImage: {
    width: '100%',
    height: '100%',
  },
  suggestedBody: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  suggestedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(7, 21, 43, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  suggestedPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  suggestedName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  suggestedSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    gap: 5,
  },
  suggestedSaveBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.navy,
  },
});
