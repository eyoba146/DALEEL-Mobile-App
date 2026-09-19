import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
import { categoriesApi, CategoryItem, contentApi, Destination } from '../../lib/api';
import { useFavorites } from '../../lib/favorites-context';
import { useLanguage } from '../../lib/language-context';
import ScreenHeader from '../../components/ScreenHeader';
import { ExploreMapView } from '../../components/ExploreMapView';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

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


const AnimatedDestinationCard = React.memo(function AnimatedDestinationCard({
  destination,
  index,
  filterTrigger,
  fav,
  onToggleFav,
  onPress,
}: {
  destination: Destination;
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
      delay: Math.min(index * 45, 220),
      useNativeDriver: true,
    }).start();
  }, [filterTrigger, index, animValue]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  const scale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: animValue,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.93}
        onPress={onPress}
      >
        <Image source={{ uri: destination.image }} style={styles.image} resizeMode="cover" />

        <View style={styles.regionBadge}>
          <Text style={styles.regionText}>{destination.region}</Text>
        </View>

        {/* Bookmark trigger */}
        <TouchableOpacity
          style={styles.bookmarkBadge}
          onPress={(e) => {
            e.stopPropagation?.();
            onToggleFav();
          }}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={fav ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={fav ? colors.goldRich : colors.charcoal}
          />
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.name}>{destination.name}</Text>
          <Text style={styles.blurb} numberOfLines={3}>
            {destination.blurb}
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
    </Animated.View>
  );
});

export default function ExploreScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [destinations, setDestinations] = useState<Destination[]>(sampleDestinations as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const filterCategories = React.useMemo(() => {
    const list: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { id: 'all', label: t('explore.categories.all', 'All Heritage'), icon: 'sparkles' },
    ];

    const added = new Set<string>(['all']);

    // Add categories from database
    for (const cat of dbCategories) {
      const catId = cat.name.toLowerCase();
      if (!added.has(catId)) {
        added.add(catId);
        const transKey = `explore.categories.${catId.replace(/[^a-z0-9]/g, '')}`;
        list.push({
          id: catId,
          label: t(transKey, cat.name),
          icon: ((cat.icon as any) || resolveDestinationIcon(cat.name)),
        });
      }
    }

    // Add distinct regions found in loaded destinations
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

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── High-Performance Native Scroll Slide Header (60fps Native Driver) ──
  const HEADER_HEIGHT = 126;
  const scrollY = useRef(new Animated.Value(0)).current;

  // We use diffClamp to seamlessly translate the header based purely on scroll direction
  // without any manual JS logic or timers getting stuck.
  const clampedScrollY = Animated.diffClamp(
    Animated.add(
      scrollY.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: 'clamp', // Ignore iOS rubber-banding at the top
      }),
      new Animated.Value(0)
    ),
    0,
    HEADER_HEIGHT + 20
  );

  const translateY = clampedScrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT + 20],
    outputRange: [0, -(HEADER_HEIGHT + 20)],
    extrapolate: 'clamp',
  });

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

  const filtered = destinations.filter((d) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.blurb.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;

    const cat = selectedCategory.toLowerCase();
    if (cat.includes('unesco')) {
      return d.unescoStatus || d.blurb.toLowerCase().includes('unesco');
    }
    if (cat.includes('highland') || cat.includes('peak')) {
      return (
        d.blurb.toLowerCase().includes('mountain') ||
        d.blurb.toLowerCase().includes('highland') ||
        d.blurb.toLowerCase().includes('peak') ||
        d.name.toLowerCase().includes('simien')
      );
    }
    return (
      d.region.toLowerCase().includes(cat) ||
      cat.includes(d.region.toLowerCase()) ||
      d.name.toLowerCase().includes(cat) ||
      d.blurb.toLowerCase().includes(cat)
    );
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t('explore.title', 'Explore')}
        subtitle={t('explore.subtitle', 'Heritage, cities & natural wonders')}
        badgeCount={destinations.length}
      />

      {/* Main content body with absolute floating header and full-bleed scroll or map */}
      <View style={styles.mainBodyContainer}>
        {viewMode === 'map' ? (
          <View style={styles.mapWrap}>
            <ExploreMapView destinations={filtered} />
          </View>
        ) : (
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
            {filtered.map((d, index) => {
              const fav = isFavorite('destination', d.id);
              return (
                <AnimatedDestinationCard
                  key={d.id}
                  destination={d}
                  index={index}
                  filterTrigger={`${selectedCategory}-${searchQuery}`}
                  fav={fav}
                  onToggleFav={() => toggleFavorite('destination', d.id)}
                  onPress={() => router.push({ pathname: '/destination/[id]', params: { id: d.id } })}
                />
              );
            })}

            {filtered.length === 0 && (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="compass-outline" size={36} color={colors.gold} />
                </View>
                <Text style={styles.emptyTitle}>{t('explore.noDestinations', 'No destinations found')}</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? `${t('explore.noDestinationsDesc', 'Try exploring other regions or reset your filters.')} ("${searchQuery}")`
                    : t('explore.noDestinationsDesc', 'Try exploring other regions or reset your filters.')}
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
                  <Text style={styles.resetFilterText}>{t('explore.resetFilters', 'Reset Search & Filters')}</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 32 }} />
          </Animated.ScrollView>
        )}

        {/* ── Floating Collapsible Search Bar & Filter Section (60fps Native Driver) ── */}
        <Animated.View
          style={[
            styles.floatingHeaderContainer,
            {
              transform: [{ translateY: viewMode === 'map' ? 0 : translateY }],
            },
          ]}
        >
          <View style={styles.searchSectionInner}>
            <View style={styles.searchRow}>
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
                    color={colors.navy}
                  />
                </View>

                <TextInput
                  style={styles.searchInput}
                  placeholder={t('explore.searchPlaceholder', 'Search heritage, cities, or landmarks…')}
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
                    <Text style={styles.countBadgeText}>{filtered.length}</Text>
                  </View>
                )}
              </View>

              {/* Grid / Map View Mode Segmented Pill */}
              <View style={styles.viewModePill}>
                <TouchableOpacity
                  style={[styles.viewModeBtn, viewMode === 'grid' && styles.viewModeBtnActive]}
                  onPress={() => setViewMode('grid')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="grid"
                    size={16}
                    color={viewMode === 'grid' ? colors.navy : '#94A3B8'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewModeBtn, viewMode === 'map' && styles.viewModeBtnActive]}
                  onPress={() => setViewMode('map')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="map"
                    size={16}
                    color={viewMode === 'map' ? colors.navy : '#94A3B8'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Horizontal Quick Filter Pills Carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterPillsScroll}
            >
              {filterCategories.map((cat) => {
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
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  mainBodyContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 136,
    paddingBottom: 40,
  },
  floatingHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  searchSectionInner: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  searchBarPod: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(223, 183, 108, 0.45)',
    gap: 10,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  viewModePill: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 3,
    gap: 2,
    height: 48,
    alignItems: 'center',
  },
  viewModeBtn: {
    width: 36,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewModeBtnActive: {
    backgroundColor: colors.gold,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  mapWrap: {
    flex: 1,
    paddingTop: 122,
  },
  searchBarPodFocused: {
    borderColor: colors.goldRich,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: colors.gold,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
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
    backgroundColor: 'rgba(223, 183, 108, 0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.35)',
  },
  countBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.navy,
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
