import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { events as sampleEvents } from '../assets/data/sample';
import ScreenHeader from '../components/ScreenHeader';
import { contentApi, EventItem } from '../lib/api';
import { useFavorites } from '../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../theme/tokens';

type CategoryFilter = 'All' | 'Culture' | 'Business' | 'Networking' | 'Festival';

const CATEGORIES: { label: CategoryFilter; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'All', icon: 'sparkles-outline' },
  { label: 'Culture', icon: 'color-palette-outline' },
  { label: 'Business', icon: 'briefcase-outline' },
  { label: 'Networking', icon: 'people-outline' },
  { label: 'Festival', icon: 'musical-notes-outline' },
];

function formatEventDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { month: 'UPCOMING', day: '•', full: dateStr };
    }
    const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = d.toLocaleDateString('en-US', { day: 'numeric' });
    const full = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return { month, day, full };
  } catch {
    return { month: 'UPCOMING', day: '•', full: dateStr };
  }
}

const AnimatedEventCard = React.memo(function AnimatedEventCard({
  item,
  index,
  filterTrigger,
  fav,
  onToggleFav,
  onPress,
}: {
  item: EventItem;
  index: number;
  filterTrigger: string;
  fav: boolean;
  onToggleFav: () => void;
  onPress: () => void;
}) {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animValue.setValue(0);
    Animated.spring(animValue, {
      toValue: 1,
      tension: 65,
      friction: 9,
      delay: Math.min(index * 40, 200),
      useNativeDriver: true,
    }).start();
  }, [filterTrigger]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const { month, day, full } = formatEventDate(item.date);

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: animValue,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={onPress}>
        {/* Cover Photo */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />

          {/* Date Calendar Stamp Badge Over Image */}
          <View style={styles.calendarDateBadge}>
            <Text style={styles.calendarMonthText}>{month}</Text>
            <Text style={styles.calendarDayText}>{day}</Text>
          </View>

          {/* Category Pill Over Image */}
          <View style={styles.categoryPillOverImage}>
            <Text style={styles.categoryPillText}>{item.category.toUpperCase()}</Text>
          </View>

          {/* Floating Bookmark Button */}
          <TouchableOpacity
            style={[styles.floatingBookmark, fav && styles.floatingBookmarkActive]}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFav();
            }}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={fav ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={fav ? colors.gold : '#FFFFFF'}
            />
          </TouchableOpacity>
        </View>

        {/* Card Details */}
        <View style={styles.cardBody}>
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Venue & Location */}
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.gold} style={{ marginRight: 5 }} />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.venue ? `${item.venue}` : `${item.city || 'Addis Ababa'}`}
            </Text>
          </View>

          {/* Time & Schedule */}
          {item.time && (
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={colors.charcoalLight} style={{ marginRight: 5 }} />
              <Text style={styles.timeText} numberOfLines={1}>
                {item.time}
              </Text>
            </View>
          )}

          {/* Blurb excerpt */}
          {item.blurb && (
            <Text style={styles.blurbText} numberOfLines={2}>
              {item.blurb}
            </Text>
          )}

          {/* Footer Action Strip */}
          <View style={styles.cardFooter}>
            <View style={styles.priceTag}>
              <Ionicons name="ticket-outline" size={14} color={colors.navy} style={{ marginRight: 5 }} />
              <Text style={styles.priceText} numberOfLines={1}>
                {item.price || 'Free Admission'}
              </Text>
            </View>

            <TouchableOpacity style={styles.viewDetailsBtn} onPress={onPress} activeOpacity={0.85}>
              <Text style={styles.viewDetailsText}>View Event</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.navy} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const HEADER_HEIGHT = 114;

export default function EventsScreen() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [events, setEvents] = useState<EventItem[]>(sampleEvents as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // 60fps Native-Driven Scroll Header Animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const clampedScroll = Animated.diffClamp(scrollY, 0, HEADER_HEIGHT);
  const translateY = clampedScroll.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const loadEvents = useCallback(async () => {
    try {
      const data = await contentApi.events();
      if (data && data.length > 0) {
        setEvents(data);
      }
    } catch (err) {
      console.warn('Failed to load events from backend, using sample cache:', err);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  const filteredEvents = events.filter((e) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      (e.city && e.city.toLowerCase().includes(q)) ||
      (e.venue && e.venue.toLowerCase().includes(q)) ||
      (e.organizer && e.organizer.toLowerCase().includes(q)) ||
      (e.blurb && e.blurb.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (activeCategory === 'All') return true;
    return e.category.toLowerCase().includes(activeCategory.toLowerCase());
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Events & Summits"
        subtitle="Exclusive gatherings, festivals & conferences"
        showBack={true}
        badgeCount={events.length}
      />

      <View style={styles.mainBodyContainer}>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
              colors={[colors.gold]}
              progressViewOffset={HEADER_HEIGHT}
            />
          }
        >
          {/* Welcome Announcement Card */}
          <View style={styles.heroAnnouncement}>
            <View style={styles.announcementIcon}>
              <Ionicons name="sparkles" size={18} color={colors.goldRich} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.announcementTitle}>Diaspora Gathering Season</Text>
              <Text style={styles.announcementSub}>
                RSVP for official cultural summits, UNESCO festivals, tech keynotes, and high-level business forums in Addis Ababa.
              </Text>
            </View>
          </View>

          {filteredEvents.map((item, index) => {
            const fav = isFavorite('event', item.id);
            return (
              <AnimatedEventCard
                key={item.id}
                item={item}
                index={index}
                filterTrigger={`${activeCategory}-${searchQuery}`}
                fav={fav}
                onToggleFav={() => toggleFavorite('event', item.id)}
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
              />
            );
          })}

          {filteredEvents.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={36} color={colors.gold} />
              </View>
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptyText}>
                No gatherings matched &quot;{searchQuery}&quot; in {activeCategory}. Try adjusting your search query or reset filters.
              </Text>
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={15} color={colors.navy} style={{ marginRight: 6 }} />
                <Text style={styles.resetFilterText}>Reset Search & Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.ScrollView>

        {/* ── Floating Collapsible Search Bar & Category Pills (60fps Native Driver) ── */}
        <Animated.View
          style={[
            styles.floatingHeaderContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.searchSectionInner}>
            <View style={[styles.searchBarPod, isSearchFocused && styles.searchBarPodFocused]}>
              <View style={[styles.searchIconCircle, isSearchFocused && styles.searchIconCircleFocused]}>
                <Ionicons name="search" size={16} color={colors.navy} />
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search summits, Meskel, tech, coffee expo…"
                placeholderTextColor={colors.charcoalSub}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                returnKeyType="search"
                clearButtonMode="never"
                autoCorrect={false}
                autoCapitalize="none"
              />

              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={19} color={colors.charcoalSub} />
                </TouchableOpacity>
              ) : (
                <View style={styles.countBadgePill}>
                  <Text style={styles.countBadgeText}>
                    {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                  </Text>
                </View>
              )}
            </View>

            {/* Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[styles.catPill, isActive && styles.catPillActive]}
                    onPress={() => setActiveCategory(cat.label)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isActive ? colors.navy : colors.charcoalSub}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.catText, isActive && styles.catTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainBodyContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT + 14,
    paddingHorizontal: 16,
    paddingBottom: 36,
  },

  // Floating Collapsible Header
  floatingHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 4,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(23, 25, 28, 0.06)',
  },
  searchSectionInner: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  searchBarPod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    paddingHorizontal: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(198, 148, 10, 0.28)',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchBarPodFocused: {
    borderColor: colors.gold,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.1,
  },
  searchIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(198, 148, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  searchIconCircleFocused: {
    backgroundColor: colors.gold,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: fonts.body,
    color: colors.charcoal,
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: {
    paddingHorizontal: 6,
  },
  countBadgePill: {
    backgroundColor: 'rgba(23, 25, 28, 0.05)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.charcoalSub,
  },

  // Category Pills
  catScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.08)',
  },
  catPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  catText: {
    fontSize: 12.5,
    fontFamily: fonts.bodyMedium,
    color: colors.charcoal,
  },
  catTextActive: {
    color: colors.navy,
    fontFamily: fonts.bodySemiBold,
  },

  // Announcement Banner
  heroAnnouncement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 148, 10, 0.3)',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  announcementIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(198, 148, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  announcementTitle: {
    fontSize: 13.5,
    fontFamily: fonts.bodyBold,
    color: colors.charcoal,
    marginBottom: 2,
  },
  announcementSub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    lineHeight: 16,
  },

  // Event Cards
  cardWrap: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.07)',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrap: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },

  // Calendar Date Stamp Badge
  calendarDateBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 48,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  calendarMonthText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: colors.goldRich,
    letterSpacing: 0.5,
  },
  calendarDayText: {
    fontSize: 18,
    fontFamily: fonts.heading,
    color: colors.navy,
    lineHeight: 22,
  },

  categoryPillOverImage: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 46, 34, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  categoryPillText: {
    fontSize: 10.5,
    fontFamily: fonts.bodyBold,
    color: colors.gold,
    letterSpacing: 0.5,
  },

  floatingBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 46, 34, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBookmarkActive: {
    backgroundColor: colors.navy,
  },

  // Card Body
  cardBody: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 17,
    fontFamily: fonts.heading,
    color: colors.charcoal,
    lineHeight: 23,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  metaText: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.charcoalSub,
    flex: 1,
  },
  timeText: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    color: colors.charcoalLight,
    flex: 1,
  },
  blurbText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoalLight,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },

  // Card Footer Strip
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 25, 28, 0.06)',
    marginTop: 4,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(198, 148, 10, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    maxWidth: '60%',
  },
  priceText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
  },
  viewDetailsText: {
    fontSize: 12.5,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },

  // Empty Card
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.08)',
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
    fontSize: 18,
    fontFamily: fonts.heading,
    color: colors.charcoal,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetFilterText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
});
