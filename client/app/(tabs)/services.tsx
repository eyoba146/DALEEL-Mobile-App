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
import { SafeAreaView } from 'react-native-safe-area-context';
import { services as sampleServices } from '../../assets/data/sample';
import { categoriesApi, CategoryItem, contentApi, Service } from '../../lib/api';
import { useFavorites } from '../../lib/favorites-context';
import { useLanguage } from '../../lib/language-context';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

function resolveCategoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('relocat') || n.includes('home') || n.includes('house')) return 'home-outline';
  if (n.includes('legal') || n.includes('law') || n.includes('doc')) return 'document-text-outline';
  if (n.includes('tour') || n.includes('travel') || n.includes('guide')) return 'compass-outline';
  if (n.includes('transport') || n.includes('car') || n.includes('ride')) return 'car-outline';
  if (n.includes('bank') || n.includes('finance') || n.includes('money')) return 'card-outline';
  if (n.includes('health') || n.includes('medic') || n.includes('care')) return 'medkit-outline';
  if (n.includes('consult') || n.includes('advisor') || n.includes('business')) return 'briefcase-outline';
  return 'pricetag-outline';
}

const AnimatedServiceCard = React.memo(function AnimatedServiceCard({
  service,
  index,
  filterTrigger,
  fav,
  onToggleFav,
  onPress,
}: {
  service: Service;
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
        {/* Hero Photo with Floating Badges */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: service.image }} style={styles.cardImage} resizeMode="cover" />
          
          {/* Category Pill Over Image */}
          <View style={styles.floatingCategoryPill}>
            <Text style={styles.floatingCategoryText}>{service.category.toUpperCase()}</Text>
          </View>

          {/* Bookmark Floating Button */}
          <TouchableOpacity
            style={[styles.floatingBookmark, fav && styles.floatingBookmarkActive]}
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleFav();
            }}
            activeOpacity={0.85}
          >
            <Ionicons
              name={fav ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={fav ? colors.gold : colors.charcoal}
            />
          </TouchableOpacity>
        </View>

        {/* Card Details */}
        <View style={styles.cardBody}>
          <View style={styles.providerRow}>
            <Text style={styles.providerName}>{service.name}</Text>
            {service.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.gold} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.gold} />
            <Text style={styles.locationText}>{service.location}, Ethiopia</Text>
          </View>

          <Text style={styles.blurbText}>{service.blurb}</Text>

          {/* Card Action Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.trustIndicator}>
              <Ionicons name="ribbon-outline" size={14} color={colors.charcoalSub} />
              <Text style={styles.trustText}>DALEEL Guaranteed Partner</Text>
            </View>

            <View style={styles.connectBtn}>
              <Text style={styles.connectBtnText}>Connect & Inquire</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.navy} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function ServicesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState('All');
  const [services, setServices] = useState<Service[]>(sampleServices as any);
  const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);

  const categories = React.useMemo(() => {
    const list: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { id: 'All', label: t('services.categories.all', 'All'), icon: 'apps-outline' },
    ];

    const added = new Set<string>(['All']);

    // Add categories from database
    for (const cat of dbCategories) {
      if (!added.has(cat.name)) {
        added.add(cat.name);
        const transKey = `services.categories.${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        list.push({
          id: cat.name,
          label: t(transKey, cat.name),
          icon: ((cat.icon as any) || resolveCategoryIcon(cat.name)),
        });
      }
    }

    // Add any extra distinct categories in loaded services
    for (const s of services) {
      if (s.category && !added.has(s.category)) {
        added.add(s.category);
        const transKey = `services.categories.${s.category.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        list.push({
          id: s.category,
          label: t(transKey, s.category),
          icon: resolveCategoryIcon(s.category),
        });
      }
    }

    return list;
  }, [dbCategories, services, t]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── High-Performance Native Scroll Slide Header (60fps Native Driver) ──
  const HEADER_HEIGHT = 122;
  const scrollY = useRef(new Animated.Value(0)).current;

  const clampedScrollY = Animated.diffClamp(
    Animated.add(
      scrollY.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolateLeft: 'clamp',
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

  const loadServices = useCallback(async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.allSettled([
        contentApi.services(activeCategory === 'All' ? undefined : activeCategory),
        categoriesApi.getAll('service'),
      ]);

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.length > 0) {
        setDbCategories(categoriesRes.value);
      }

      if (servicesRes.status === 'fulfilled' && servicesRes.value.length > 0) {
        setServices(servicesRes.value);
      } else if (activeCategory === 'All') {
        setServices(sampleServices as any);
      } else {
        const filtered = (sampleServices as any[]).filter(
          (s) => s.category.toLowerCase() === activeCategory.toLowerCase()
        );
        setServices(filtered);
      }
    } catch (err) {
      console.warn('Failed to load services:', err);
      const filtered =
        activeCategory === 'All'
          ? (sampleServices as any)
          : (sampleServices as any[]).filter(
              (s) => s.category.toLowerCase() === activeCategory.toLowerCase()
            );
      setServices(filtered);
    }
  }, [activeCategory]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadServices();
    setIsRefreshing(false);
  };

  // Filter services by category AND real-time search query
  const filteredServices = services.filter((s) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q) ||
      s.blurb.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeCategory === 'All') return true;
    return s.category.toLowerCase().includes(activeCategory.toLowerCase());
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title={t('services.title', 'Services')}
        subtitle={t('services.subtitle', 'Trusted diaspora & investment solutions')}
        badgeCount={services.length}
      />

      {/* Main content body with absolute floating header and full-bleed scroll */}
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
          {filteredServices.map((s, index) => {
            const fav = isFavorite('service', s.id);
            return (
              <AnimatedServiceCard
                key={s.id}
                service={s}
                index={index}
                filterTrigger={`${activeCategory}-${searchQuery}`}
                fav={fav}
                onToggleFav={() => toggleFavorite('service', s.id)}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })}
              />
            );
          })}

          {filteredServices.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="briefcase-outline" size={36} color={colors.gold} />
              </View>
              <Text style={styles.emptyTitle}>{t('services.noPartners', 'No partners found')}</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? `${t('services.noPartnersDesc', 'Try adjusting your keywords or reset filters.')} ("${searchQuery}")`
                  : t('services.noPartnersDesc', 'Try adjusting your keywords or reset filters.')}
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
                <Text style={styles.resetFilterText}>{t('services.resetFilters', 'Reset Search & Filters')}</Text>
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
                placeholder={t('services.searchPlaceholder', 'Search services, legal, relocation…')}
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
                    {filteredServices.length} {filteredServices.length === 1 ? 'partner' : 'partners'}
                  </Text>
                </View>
              )}
            </View>

            {/* Category pills horizontal row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catPill, isActive && styles.catPillActive]}
                    onPress={() => setActiveCategory(cat.id)}
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
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchBarPod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 50,
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

  // ── Category Pills Sub-Bar ──────────────────────────
  catScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 2,
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  catText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12.5,
    color: colors.charcoalSub,
  },
  catTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.navy,
    fontWeight: '700',
  },

  // ── Service Cards ───────────────────────────────────
  cardWrap: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceWarm,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  floatingCategoryPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(7, 21, 43, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  floatingCategoryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 0.8,
  },
  floatingBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  floatingBookmarkActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.gold,
  },

  cardBody: {
    padding: 18,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  providerName: {
    fontFamily: fonts.heading,
    fontSize: 19,
    color: colors.charcoal,
    flex: 1,
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  verifiedText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: '#8A6204',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalSub,
  },
  blurbText: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.charcoalSub,
    lineHeight: 20,
    marginBottom: 14,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    color: colors.charcoalSub,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connectBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
  },

  // ── Empty State Card ────────────────────────────────
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
    lineHeight: 19,
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
