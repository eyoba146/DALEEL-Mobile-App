import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { services as sampleServices } from '../../assets/data/sample';
import { categoriesApi, CategoryItem, contentApi, Service } from '../../lib/api';
import { useFavorites } from '../../lib/favorites-context';
import { useLanguage } from '../../lib/language-context';
import { colors, fonts, radius, shadow, spacing } from '../../theme/tokens';

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

export default function ServicesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [services, setServices] = useState<Service[]>(sampleServices as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const [servRes, catRes] = await Promise.allSettled([
        contentApi.services(),
        categoriesApi.getAll('service'),
      ]);
      if (catRes.status === 'fulfilled' && catRes.value.length > 0) {
        setDbCategories(catRes.value);
      }
      if (servRes.status === 'fulfilled' && servRes.value.length > 0) {
        setServices(servRes.value);
      }
    } catch (err) {
      console.warn('Failed to load services:', err);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadServices();
    setIsRefreshing(false);
  };

  const filterCategories = useMemo(() => {
    const list: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { id: 'all', label: t('services.categories.all', 'All Providers'), icon: 'sparkles' },
    ];

    const added = new Set<string>(['all']);

    for (const cat of dbCategories) {
      const catId = cat.name.toLowerCase();
      if (!added.has(catId)) {
        added.add(catId);
        list.push({
          id: catId,
          label: cat.name,
          icon: ((cat.icon as any) || resolveCategoryIcon(cat.name)),
        });
      }
    }

    for (const s of services) {
      if (s.category) {
        const catId = s.category.toLowerCase();
        if (!added.has(catId)) {
          added.add(catId);
          list.push({
            id: catId,
            label: s.category,
            icon: resolveCategoryIcon(s.category),
          });
        }
      }
    }

    return list;
  }, [dbCategories, services, t]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (selectedCategory === 'all') return true;

      const cat = selectedCategory.toLowerCase();
      return (
        s.category.toLowerCase().includes(cat) ||
        cat.includes(s.category.toLowerCase())
      );
    });
  }, [services, searchQuery, selectedCategory]);

  return (
    <View style={styles.screen}>
      {/* ── HERO DIRECTORY HEADER ── */}
      <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerTitleRow}>
          <View>
            <View style={styles.headerBadge}>
              <Ionicons name="shield-checkmark" size={12} color={colors.gold} />
              <Text style={styles.headerBadgeText}>VERIFIED DIASPORA NETWORK</Text>
            </View>
            <Text style={styles.headerTitle}>Concierge Services</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{filtered.length} PARTNERS</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={17} color={colors.gold} style={{ marginLeft: 4 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('services.searchPlaceholder', 'Search legal, real estate, customs, guides…')}
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

        {/* Filter Pills */}
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

      {/* ── SERVICES DIRECTORY LIST ── */}
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
        {/* Verification Guarantee Banner */}
        <View style={styles.guaranteeBanner}>
          <View style={styles.guaranteeIconWrap}>
            <Ionicons name="ribbon" size={16} color={colors.goldRich} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>Trusted Diaspora Standard</Text>
            <Text style={styles.guaranteeSubtitle}>
              All concierge specialists are licensed professionals in Ethiopia with vetted track records.
            </Text>
          </View>
        </View>

        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="briefcase-outline" size={32} color={colors.navy} />
            </View>
            <Text style={styles.emptyTitle}>No Service Providers Found</Text>
            <Text style={styles.emptySub}>
              We couldn't find any partners matching "{searchQuery}". Try searching another specialty or resetting filters.
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
          <View style={styles.providersList}>
            {filtered.map((s) => {
              const fav = isFavorite('service', s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.providerCard}
                  activeOpacity={0.92}
                  onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })}
                >
                  <View style={styles.providerCardTop}>
                    <Image source={{ uri: s.image }} style={styles.providerAvatar} />
                    
                    <View style={styles.providerMainMeta}>
                      <View style={styles.nameHeaderRow}>
                        <Text style={styles.providerNameText} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.providerFavBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            toggleFavorite('service', s.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={fav ? 'bookmark' : 'bookmark-outline'}
                            size={18}
                            color={fav ? colors.gold : colors.charcoalLight}
                          />
                        </TouchableOpacity>
                      </View>

                      {s.verified && (
                        <View style={styles.verifiedTagRow}>
                          <Ionicons name="checkmark-circle" size={13} color={colors.goldRich} />
                          <Text style={styles.verifiedTagText}>DALEEL VERIFIED SPECIALIST</Text>
                        </View>
                      )}

                      <View style={styles.categoryAndLocRow}>
                        <View style={styles.categoryChip}>
                          <Text style={styles.categoryChipText}>{s.category}</Text>
                        </View>
                        <View style={styles.locationChip}>
                          <Ionicons name="location-outline" size={11} color={colors.charcoalLight} />
                          <Text style={styles.locationChipText}>{s.location}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {s.description && (
                    <Text style={styles.providerDescription} numberOfLines={2}>
                      {s.description}
                    </Text>
                  )}

                  <View style={styles.providerCardFooter}>
                    {s.rating ? (
                      <View style={styles.pricingWrap}>
                        <Text style={styles.pricingLabel}>CLIENT RATING</Text>
                        <Text style={styles.pricingValue}>★ {s.rating.toFixed(1)} {s.reviewCount ? `(${s.reviewCount})` : ''}</Text>
                      </View>
                    ) : (
                      <View style={styles.pricingWrap}>
                        <Text style={styles.pricingLabel}>CONCIERGE</Text>
                        <Text style={styles.pricingValue}>Verified Partner</Text>
                      </View>
                    )}

                    <View style={styles.inquireButton}>
                      <Text style={styles.inquireButtonText}>Request Consultation</Text>
                      <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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

  // ── HERO DIRECTORY HEADER ──────────────────────────────
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
    paddingTop: 16,
    paddingBottom: 40,
  },

  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  guaranteeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: colors.navy,
    marginBottom: 1,
  },
  guaranteeSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalSub,
    lineHeight: 15,
  },

  providersList: {
    paddingHorizontal: 20,
    gap: 14,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  providerCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  providerAvatar: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  providerMainMeta: {
    flex: 1,
    marginLeft: 14,
  },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  providerNameText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.navy,
    flex: 1,
    marginRight: 6,
  },
  providerFavBtn: {
    padding: 2,
  },
  verifiedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.goldRich,
    letterSpacing: 0.5,
  },
  categoryAndLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  categoryChip: {
    backgroundColor: 'rgba(7, 21, 43, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 10.5,
    color: colors.navy,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationChipText: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.charcoalLight,
  },

  providerDescription: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.charcoalSub,
    lineHeight: 18,
    marginTop: 12,
  },

  providerCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  pricingWrap: {
    justifyContent: 'center',
  },
  pricingLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    color: colors.charcoalLight,
    letterSpacing: 0.5,
  },
  pricingValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.navy,
    marginTop: 1,
  },
  inquireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.navy,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    ...shadow.button,
  },
  inquireButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
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
