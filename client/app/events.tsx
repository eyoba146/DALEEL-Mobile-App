import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import { events as sampleEvents } from '../assets/data/sample';
import { contentApi, EventItem } from '../lib/api';
import { useFavorites } from '../lib/favorites-context';
import { colors, fonts, radius, shadow } from '../theme/tokens';

type CategoryFilter = 'All' | 'Business' | 'Culture' | 'Networking' | 'Community';

export default function EventsScreen() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [events, setEvents] = useState<EventItem[]>(sampleEvents as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rsvpList, setRsvpList] = useState<{ [id: string]: boolean }>({});

  const loadEvents = useCallback(async () => {
    try {
      const data = await contentApi.events();
      if (data && data.length > 0) {
        setEvents(data);
      }
    } catch (err) {
      console.warn('Failed to load events:', err);
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

  const toggleRsvp = (id: string) => {
    setRsvpList((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.city && e.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.category && e.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Business') {
      return (
        e.category.toLowerCase().includes('business') ||
        e.category.toLowerCase().includes('invest') ||
        e.category.toLowerCase().includes('finance')
      );
    }
    if (selectedCategory === 'Culture') {
      return (
        e.category.toLowerCase().includes('culture') ||
        e.category.toLowerCase().includes('festival') ||
        e.category.toLowerCase().includes('heritage')
      );
    }
    if (selectedCategory === 'Networking') {
      return (
        e.category.toLowerCase().includes('network') ||
        e.category.toLowerCase().includes('gala') ||
        e.category.toLowerCase().includes('meetup')
      );
    }
    if (selectedCategory === 'Community') {
      return (
        e.category.toLowerCase().includes('community') ||
        e.category.toLowerCase().includes('diaspora') ||
        e.category.toLowerCase().includes('youth')
      );
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Deep Navy + Warm Gold Header with Back Arrow */}
      <ScreenHeader
        title="Upcoming Events"
        subtitle="Exclusive gatherings & diaspora summits"
        showBack={true}
        badgeCount={filteredEvents.length}
      />

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color="#8A9AA8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events by title or city…"
            placeholderTextColor="#8A9AA8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8A9AA8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Pills Sub-bar */}
      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
          {(['All', 'Business', 'Culture', 'Networking', 'Community'] as CategoryFilter[]).map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
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
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="calendar-outline" size={32} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>No events found</Text>
            <Text style={styles.emptySubtitle}>Try changing your search or category filter.</Text>
          </View>
        ) : (
          filteredEvents.map((item) => {
            const fav = isFavorite('event', item.id);
            const isAttending = !!rsvpList[item.id];
            const dateStr = typeof item.date === 'string' ? item.date.split('T')[0] : 'Upcoming';

            return (
              <View key={item.id} style={styles.card}>
                {/* Event Cover Image */}
                <View style={styles.imageWrap}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                  
                  {/* Category Pill Tag */}
                  <View style={styles.imageCategoryBadge}>
                    <Text style={styles.imageCategoryText}>{item.category || 'Event'}</Text>
                  </View>

                  {/* Bookmark Button */}
                  <TouchableOpacity
                    style={styles.bookmarkButton}
                    onPress={() => toggleFavorite('event', item.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={fav ? 'bookmark' : 'bookmark-outline'}
                      size={18}
                      color={fav ? colors.gold : '#FFFFFF'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Event Details */}
                <View style={styles.cardBody}>
                  <Text style={styles.eventTitle}>{item.title}</Text>

                  {/* Meta: Date and City */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={14} color={colors.gold} />
                      <Text style={styles.metaText}>{dateStr}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="location-sharp" size={14} color={colors.gold} />
                      <Text style={styles.metaText}>{item.city || 'Addis Ababa'}</Text>
                    </View>
                  </View>

                  {(item as any).description || (item as any).blurb ? (
                    <Text style={styles.eventDesc} numberOfLines={2}>
                      {(item as any).description || (item as any).blurb}
                    </Text>
                  ) : null}

                  {/* Action Bar */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.rsvpBtn, isAttending && styles.rsvpBtnActive]}
                      onPress={() => toggleRsvp(item.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={isAttending ? 'checkmark-circle' : 'ticket-outline'}
                        size={16}
                        color={isAttending ? '#FFFFFF' : colors.navy}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.rsvpBtnText, isAttending && styles.rsvpBtnTextActive]}>
                        {isAttending ? 'Registered' : 'RSVP Now'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Live Access</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Off White
  },

  // ── Search Section ──────────────────────────────────
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoal,
  },

  // ── Category Pills Bar ──────────────────────────────
  categoryBar: {
    paddingVertical: 10,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  categoryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoalSub,
  },
  categoryTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.gold,
  },

  // ── Event Cards List ────────────────────────────────
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  imageWrap: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageCategoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  imageCategoryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  cardBody: {
    padding: 16,
  },
  eventTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
    lineHeight: 23,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.charcoalSub,
  },
  eventDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalSub,
    lineHeight: 19,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  rsvpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rsvpBtnActive: {
    backgroundColor: colors.navy,
  },
  rsvpBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  rsvpBtnTextActive: {
    color: colors.gold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16803C',
  },
  statusText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#16803C',
  },

  // ── Empty State ─────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.navy,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.charcoalSub,
    textAlign: 'center',
  },
});
