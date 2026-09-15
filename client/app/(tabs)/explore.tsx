import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { destinations as sampleDestinations } from '../../assets/data/sample';
import { contentApi, Destination } from '../../lib/api';
import { useFavorites } from '../../lib/favorites-context';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

const FILTER_CATEGORIES = [
  { id: 'all', label: 'All Heritage', icon: 'sparkles' },
  { id: 'unesco', label: 'UNESCO Sites', icon: 'ribbon' },
  { id: 'amhara', label: 'Amhara Region', icon: 'map' },
  { id: 'addis', label: 'Addis Ababa', icon: 'business' },
  { id: 'highlands', label: 'Highlands & Peaks', icon: 'trail-sign' },
];

export default function ExploreScreen() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [destinations, setDestinations] = useState<Destination[]>(sampleDestinations as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDestinations = useCallback(async () => {
    try {
      const data = await contentApi.destinations();
      if (data && data.length > 0) {
        setDestinations(data);
      }
    } catch (err) {
      console.warn('Failed to load destinations:', err);
    }
  }, []);

  useEffect(() => {
    loadDestinations();
  }, [loadDestinations]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDestinations();
    setIsRefreshing(false);
  };

  const filtered = destinations.filter((d) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.blurb.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (selectedCategory === 'unesco') {
      return (
        d.blurb.toLowerCase().includes('unesco') ||
        d.name.toLowerCase().includes('lalibela') ||
        d.name.toLowerCase().includes('simien')
      );
    }
    if (selectedCategory === 'amhara') {
      return d.region.toLowerCase().includes('amhara');
    }
    if (selectedCategory === 'addis') {
      return (
        d.region.toLowerCase().includes('addis') ||
        d.name.toLowerCase().includes('addis')
      );
    }
    if (selectedCategory === 'highlands') {
      return (
        d.blurb.toLowerCase().includes('mountain') ||
        d.blurb.toLowerCase().includes('highland') ||
        d.blurb.toLowerCase().includes('peak') ||
        d.name.toLowerCase().includes('simien')
      );
    }
    return true;
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Explore"
        subtitle="Heritage, cities & natural wonders"
        badgeCount={destinations.length}
      />

      {/* ── 10x Enhanced Search Bar & Filter Section ── */}
      <View style={styles.searchSectionWrap}>
        <View
          style={[
            styles.searchBarPod,
            isSearchFocused && styles.searchBarPodFocused,
          ]}
        >
          <View style={[styles.searchIconCircle, isSearchFocused && styles.searchIconCircleFocused]}>
            <Ionicons
              name="search"
              size={16}
              color={isSearchFocused ? colors.navy : colors.goldRich}
            />
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search heritage, cities, or landmarks…"
            placeholderTextColor={colors.charcoalLight}
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
              <Ionicons name="close-circle" size={19} color={colors.charcoalLight} />
            </TouchableOpacity>
          ) : (
            <View style={styles.countBadgePill}>
              <Text style={styles.countBadgeText}>{filtered.length} found</Text>
            </View>
          )}
        </View>

        {/* Horizontal Quick Filter Pills Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {FILTER_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={13}
                  color={active ? colors.navy : colors.charcoalSub}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      >
        {filtered.map((d) => {
          const fav = isFavorite('destination', d.id);
          return (
            <View key={d.id} style={styles.cardWrap}>
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.93}
                onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
              >
                <Image source={{ uri: d.image }} style={styles.image} resizeMode="cover" />

                <View style={styles.regionBadge}>
                  <Text style={styles.regionText}>{d.region}</Text>
                </View>

                {/* Bookmark trigger */}
                <TouchableOpacity
                  style={styles.bookmarkBadge}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    toggleFavorite('destination', d.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={fav ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={fav ? colors.gold : '#FFFFFF'}
                  />
                </TouchableOpacity>

                <View style={styles.body}>
                  <Text style={styles.name}>{d.name}</Text>
                  <Text style={styles.blurb} numberOfLines={3}>
                    {d.blurb}
                  </Text>

                  <View style={styles.footer}>
                    <View style={styles.footerLeft}>
                      <Ionicons name="location-outline" size={14} color="#718096" />
                      <Text style={styles.footerText}>Federal Democratic Republic of Ethiopia</Text>
                    </View>

                    <View style={styles.explorePill}>
                      <Text style={styles.explorePillText}>View Guide</Text>
                      <Ionicons name="arrow-forward" size={13} color={colors.navy} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="compass-outline" size={36} color={colors.gold} />
            </View>
            <Text style={styles.emptyTitle}>No destinations found</Text>
            <Text style={styles.emptyText}>
              No heritage sites or cities matched your search &quot;{searchQuery}&quot;. Try exploring other regions or reset your filters.
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={15} color={colors.navy} style={{ marginRight: 6 }} />
              <Text style={styles.resetFilterText}>Reset Search & Filters</Text>
            </TouchableOpacity>
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
  // ── 10x Luxury Search Section ───────────────────────
  searchSectionWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchBarPod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 10,
  },
  searchBarPodFocused: {
    borderColor: colors.gold,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  searchIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconCircleFocused: {
    backgroundColor: colors.gold,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.charcoal,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  countBadgePill: {
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  countBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.goldRich,
  },
  // ── Filter Pills ────────────────────────────────────
  filterPillsScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  filterPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.charcoalSub,
  },
  filterPillTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.navy,
    fontWeight: '700',
  },

  content: {
    padding: 16,
  },

  cardWrap: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
  },
  regionBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  regionText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.gold,
  },
  bookmarkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },

  body: {
    padding: 16,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.charcoal,
    marginBottom: 6,
  },
  blurb: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.charcoalSub,
    marginBottom: 14,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: '#718096',
    flex: 1,
  },
  explorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  explorePillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
  },

  // Empty State Card
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.charcoal,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  resetFilterText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
    fontWeight: '700',
  },
});
