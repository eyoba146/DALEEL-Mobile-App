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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { destinations as sampleDestinations } from '../../assets/data/sample';
import { categoriesApi, CategoryItem, contentApi, Destination } from '../../lib/api';
import { useFavorites } from '../../lib/favorites-context';
import { useLanguage } from '../../lib/language-context';
import { colors, fonts, radius, shadow, spacing } from '../../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function resolveDestinationIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('unesco') || n.includes('heritage')) return 'ribbon-outline';
  if (n.includes('amhara') || n.includes('region') || n.includes('map')) return 'map-outline';
  if (n.includes('addis') || n.includes('city') || n.includes('urban')) return 'business-outline';
  if (n.includes('highland') || n.includes('peak') || n.includes('mountain') || n.includes('trek')) return 'trail-sign-outline';
  if (n.includes('oromia') || n.includes('nature') || n.includes('park')) return 'leaf-outline';
  if (n.includes('harar') || n.includes('east') || n.includes('desert') || n.includes('sun')) return 'sunny-outline';
  return 'compass-outline';
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [destinations, setDestinations] = useState<Destination[]>(sampleDestinations as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDestinations = useCallback(async () => {
    try {
      const [destRes, catRes] = await Promise.allSettled([
        contentApi.destinations(),
        categoriesApi.getAll('destination'),
      ]);
      if (catRes.status === 'fulfilled' && catRes.value.length > 0) {
        setDbCategories(catRes.value);
      }
      if (destRes.status === 'fulfilled' && destRes.value.length > 0) {
        setDestinations(destRes.value);
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

  const filterCategories = useMemo(() => {
    const list: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { id: 'all', label: t('explore.categories.all', 'All Expeditions'), icon: 'sparkles' },
      { id: 'unesco', label: 'UNESCO Heritage', icon: 'ribbon-outline' },
    ];

    const added = new Set<string>(['all', 'unesco']);

    for (const cat of dbCategories) {
      const catId = cat.name.toLowerCase();
      if (!added.has(catId)) {
        added.add(catId);
        list.push({
          id: catId,
          label: cat.name,
          icon: ((cat.icon as any) || resolveDestinationIcon(cat.name)),
        });
      }
    }

    for (const d of destinations) {
      if (d.region) {
        const regionId = d.region.toLowerCase();
        if (!added.has(regionId)) {
          added.add(regionId);
          list.push({
            id: regionId,
            label: `${d.region} Region`,
            icon: resolveDestinationIcon(d.region),
          });
        }
      }
    }

    return list;
  }, [dbCategories, destinations, t]);

  const filtered = useMemo(() => {
    return destinations.filter((d) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.blurb.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (selectedCategory === 'all') return true;

      const cat = selectedCategory.toLowerCase();
      if (cat === 'unesco') {
        return d.unescoStatus || d.blurb.toLowerCase().includes('unesco');
      }
      return (
        d.region.toLowerCase().includes(cat) ||
        cat.includes(d.region.toLowerCase()) ||
        d.name.toLowerCase().includes(cat) ||
        d.blurb.toLowerCase().includes(cat)
      );
    });
  }, [destinations, searchQuery, selectedCategory]);

  const spotlightDest = filtered[0];
  const listDestinations = filtered.slice(1);

  return (
    <View style={styles.screen}>
      {/* ── EDITORIAL DISCOVERY HERO HEADER (Deep Navy) ── */}
      <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <View style={styles.headerBadge}>
              <Ionicons name="compass" size={12} color={colors.gold} />
              <Text style={styles.headerBadgeText}>HERITAGE & SACRED SITES</Text>
            </View>
            <Text style={styles.headerTitle}>Explore Ethiopia</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length} SITES</Text>
          </View>
        </View>

        {/* Integrated Search Input */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={17} color={colors.gold} style={{ marginLeft: 4 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('explore.searchPlaceholder', 'Search monolithic churches, peaks, lakes…')}
            placeholderTextColor={colors.charcoalLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={colors.charcoalLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsTrack}
        >
          {filterCategories.map((c) => {
            const isActive = selectedCategory === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => setSelectedCategory(c.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={c.icon}
                  size={13}
                  color={isActive ? colors.navy : 'rgba(255, 255, 255, 0.75)'}
                />
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── EDITORIAL CONTENT BODY ── */}
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
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="compass-outline" size={32} color={colors.navy} />
            </View>
            <Text style={styles.emptyTitle}>No Destinations Found</Text>
            <Text style={styles.emptySub}>
              We couldn't find any sites matching "{searchQuery}". Try broadening your search or choosing a different region.
            </Text>
            <TouchableOpacity
              style={styles.emptyResetBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyResetText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Premier Spotlight Destination */}
            {spotlightDest && (
              <View style={styles.spotlightContainer}>
                <Text style={styles.sectionOverline}>FEATURED EXPEDITION</Text>
                <TouchableOpacity
                  style={styles.spotlightCard}
                  activeOpacity={0.92}
                  onPress={() => router.push({ pathname: '/destination/[id]', params: { id: spotlightDest.id } })}
                >
                  <Image source={{ uri: spotlightDest.image }} style={styles.spotlightImg} />
                  <View style={styles.spotlightOverlay} />

                  <View style={styles.spotlightTopRow}>
                    {spotlightDest.unescoStatus && (
                      <View style={styles.spotlightUnescoBadge}>
                        <Ionicons name="ribbon" size={11} color="#8C6A21" />
                        <Text style={styles.spotlightUnescoText}>UNESCO HERITAGE</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.spotlightFavBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        toggleFavorite('destination', spotlightDest.id);
                      }}
                      activeOpacity={0.75}
                    >
                      <Ionicons
                        name={isFavorite('destination', spotlightDest.id) ? 'bookmark' : 'bookmark-outline'}
                        size={17}
                        color={isFavorite('destination', spotlightDest.id) ? colors.gold : '#FFFFFF'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.spotlightBody}>
                    <View style={styles.regionRow}>
                      <Ionicons name="location-sharp" size={12} color={colors.gold} />
                      <Text style={styles.regionName}>{spotlightDest.region}, Ethiopia</Text>
                    </View>
                    <Text style={styles.spotlightTitle}>{spotlightDest.name}</Text>
                    <Text style={styles.spotlightExcerpt} numberOfLines={2}>
                      {spotlightDest.blurb}
                    </Text>

                    <View style={styles.spotlightActionRow}>
                      <View style={styles.exploreActionBtn}>
                        <Text style={styles.exploreActionText}>View Heritage Guide</Text>
                        <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                      </View>
                      {spotlightDest.rating && (
                        <View style={styles.ratingBadge}>
                          <Ionicons name="star" size={12} color={colors.gold} />
                          <Text style={styles.ratingText}>{spotlightDest.rating.toFixed(1)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Curated Grid of Secondary Sanctuaries */}
            {listDestinations.length > 0 && (
              <View style={styles.listSection}>
                <View style={styles.listHeaderRow}>
                  <Text style={styles.sectionOverline}>ALL DISCOVERIES</Text>
                  <Text style={styles.sectionSubtitle}>
                    {listDestinations.length} additional regional destinations
                  </Text>
                </View>

                <View style={styles.destinationsGrid}>
                  {listDestinations.map((d) => {
                    const fav = isFavorite('destination', d.id);
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={styles.gridCard}
                        activeOpacity={0.9}
                        onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
                      >
                        <View style={styles.gridImgWrap}>
                          <Image source={{ uri: d.image }} style={styles.gridImg} />
                          <TouchableOpacity
                            style={styles.gridFavBtn}
                            onPress={(e) => {
                              e.stopPropagation?.();
                              toggleFavorite('destination', d.id);
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={fav ? 'bookmark' : 'bookmark-outline'}
                              size={15}
                              color={fav ? colors.gold : '#FFFFFF'}
                            />
                          </TouchableOpacity>

                          {d.unescoStatus && (
                            <View style={styles.gridUnescoBadge}>
                              <Ionicons name="ribbon" size={10} color="#8C6A21" />
                            </View>
                          )}
                        </View>

                        <View style={styles.gridCardBody}>
                          <View style={styles.gridRegionRow}>
                            <Ionicons name="location-outline" size={10} color={colors.charcoalLight} />
                            <Text style={styles.gridRegionText}>{d.region}</Text>
                          </View>
                          <Text style={styles.gridCardTitle} numberOfLines={1}>
                            {d.name}
                          </Text>
                          <Text style={styles.gridCardBlurb} numberOfLines={2}>
                            {d.blurb}
                          </Text>

                          <View style={styles.gridCardFooter}>
                            <Text style={styles.viewGuideText}>Explore</Text>
                            <Ionicons name="arrow-forward" size={11} color={colors.navy} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </>
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

  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    height: 48,
    paddingHorizontal: 12,
    gap: 8,
    ...shadow.button,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.navy,
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

  // ── CONTENT ──────────────────────────────────────────────
  scrollContent: {
    paddingTop: 18,
    paddingBottom: 40,
  },
  sectionOverline: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    color: colors.goldRich,
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  // Premier Spotlight
  spotlightContainer: {
    paddingHorizontal: 20,
    marginBottom: 26,
  },
  spotlightCard: {
    height: 280,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.navy,
    position: 'relative',
    ...shadow.card,
  },
  spotlightImg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  spotlightOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 21, 43, 0.6)',
  },
  spotlightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    zIndex: 2,
  },
  spotlightUnescoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  spotlightUnescoText: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: '#8C6A21',
    letterSpacing: 0.5,
  },
  spotlightFavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(7, 21, 43, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  spotlightBody: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    zIndex: 2,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  regionName: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  spotlightTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  spotlightExcerpt: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
    marginBottom: 12,
  },
  spotlightActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exploreActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.navy,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.5)',
  },
  exploreActionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(7, 21, 43, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  ratingText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  // Secondary Grid
  listSection: {
    paddingHorizontal: 20,
  },
  listHeaderRow: {
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalLight,
    marginTop: -4,
  },
  destinationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: (SCREEN_WIDTH - 40 - 12) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  gridImgWrap: {
    width: '100%',
    height: 115,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  gridImg: {
    width: '100%',
    height: '100%',
  },
  gridFavBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(7, 21, 43, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridUnescoBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardBody: {
    padding: 10,
  },
  gridRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  gridRegionText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    color: colors.charcoalLight,
  },
  gridCardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    color: colors.navy,
    marginBottom: 3,
  },
  gridCardBlurb: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalSub,
    lineHeight: 15,
    marginBottom: 8,
  },
  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  viewGuideText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.navy,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
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
    fontSize: 20,
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
    marginBottom: 20,
  },
  emptyResetBtn: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.pill,
  },
  emptyResetText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
});
