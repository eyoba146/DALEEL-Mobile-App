import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { investments as sampleInvestments } from '../assets/data/sample';
import ScreenHeader from '../components/ScreenHeader';
import { contentApi, InvestmentOpportunity, categoriesApi, CategoryItem } from '../lib/api';
import { useFavorites } from '../lib/favorites-context';
import { colors, fonts, radius, shadow, spacing } from '../theme/tokens';

function resolveInvestmentIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('real estate') || n.includes('estate') || n.includes('property') || n.includes('housing')) return 'business-outline';
  if (n.includes('agri') || n.includes('farm') || n.includes('crop') || n.includes('leaf')) return 'leaf-outline';
  if (n.includes('tech') || n.includes('software') || n.includes('data') || n.includes('chip')) return 'hardware-chip-outline';
  if (n.includes('energy') || n.includes('power') || n.includes('solar') || n.includes('hydro')) return 'flash-outline';
  if (n.includes('manufactur') || n.includes('factor') || n.includes('construct') || n.includes('industrial')) return 'construct-outline';
  if (n.includes('health') || n.includes('pharma') || n.includes('medic')) return 'medkit-outline';
  if (n.includes('tour') || n.includes('hotel') || n.includes('hospitality')) return 'compass-outline';
  if (n.includes('bank') || n.includes('fintech') || n.includes('finance')) return 'cash-outline';
  return 'briefcase-outline';
}

const AnimatedInvestmentCard = React.memo(function AnimatedInvestmentCard({
  opportunity,
  index,
  filterTrigger,
  fav,
  onToggleFav,
  onPress,
}: {
  opportunity: InvestmentOpportunity;
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

  const formattedMinInvestment = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: opportunity.currency || 'USD',
    maximumFractionDigits: 0,
  }).format(opportunity.minInvestment);

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
        {/* Hero Photo with Badges */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: opportunity.image }} style={styles.cardImage} resizeMode="cover" />

          {/* Sector Pill Over Image */}
          <View style={styles.floatingSectorPill}>
            <Text style={styles.floatingSectorText}>{opportunity.sector.toUpperCase()}</Text>
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

        {/* Opportunity Card Details */}
        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <Text style={styles.opportunityTitle} numberOfLines={1}>
              {opportunity.title}
            </Text>
            {opportunity.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={13} color={colors.gold} />
                <Text style={styles.verifiedText}>EIC Vetted</Text>
              </View>
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={colors.gold} />
            <Text style={styles.locationText}>{opportunity.location}, Ethiopia</Text>
          </View>

          <Text style={styles.blurbText} numberOfLines={2}>
            {opportunity.blurb}
          </Text>

          {/* Financial Highlights Chips Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>MIN TICKET</Text>
              <Text style={styles.metricValue}>{formattedMinInvestment}</Text>
            </View>

            {opportunity.expectedReturn ? (
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>PROJECTED RETURN</Text>
                <Text style={[styles.metricValue, { color: colors.goldRich }]}>
                  {opportunity.expectedReturn}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.incentiveRow}>
              <Ionicons name="ribbon-outline" size={13} color={colors.charcoalSub} />
              <Text style={styles.incentiveText}>
                {opportunity.timeline || 'Open for Diaspora Investors'}
              </Text>
            </View>

            <View style={styles.exploreBtn}>
              <Text style={styles.exploreBtnText}>View Prospectus</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.navy} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function InvestmentsScreen() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeSector, setActiveSector] = useState('All');
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>(sampleInvestments as any);
  const [dbSectors, setDbSectors] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sectors = useMemo(() => {
    const list: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { label: 'All', icon: 'sparkles-outline' },
    ];
    const added = new Set<string>(['All']);

    for (const c of dbSectors) {
      if (!added.has(c.name)) {
        added.add(c.name);
        list.push({
          label: c.name,
          icon: (c.icon as any) || resolveInvestmentIcon(c.name),
        });
      }
    }

    for (const opp of opportunities) {
      if (opp.sector && !added.has(opp.sector)) {
        added.add(opp.sector);
        list.push({
          label: opp.sector,
          icon: resolveInvestmentIcon(opp.sector),
        });
      }
    }

    return list;
  }, [dbSectors, opportunities]);

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

  const loadOpportunities = useCallback(async () => {
    try {
      const [oppsRes, catsRes] = await Promise.allSettled([
        contentApi.investments(activeSector === 'All' ? undefined : activeSector),
        categoriesApi.getAll('investment'),
      ]);

      if (catsRes.status === 'fulfilled' && catsRes.value.length > 0) {
        setDbSectors(catsRes.value);
      }

      if (oppsRes.status === 'fulfilled' && oppsRes.value.length > 0) {
        setOpportunities(oppsRes.value);
      } else if (activeSector === 'All') {
        setOpportunities(sampleInvestments as any);
      } else {
        const filtered = (sampleInvestments as any[]).filter(
          (inv) => inv.sector.toLowerCase() === activeSector.toLowerCase()
        );
        setOpportunities(filtered);
      }
    } catch (err) {
      console.warn('Failed to load investment opportunities:', err);
      const filtered =
        activeSector === 'All'
          ? (sampleInvestments as any)
          : (sampleInvestments as any[]).filter(
              (inv) => inv.sector.toLowerCase() === activeSector.toLowerCase()
            );
      setOpportunities(filtered);
    }
  }, [activeSector]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadOpportunities();
    setIsRefreshing(false);
  };

  // Filter opportunities by sector AND search query
  const filteredOpportunities = opportunities.filter((inv) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      inv.title.toLowerCase().includes(q) ||
      inv.sector.toLowerCase().includes(q) ||
      inv.location.toLowerCase().includes(q) ||
      inv.blurb.toLowerCase().includes(q) ||
      (inv.highlights && inv.highlights.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (activeSector === 'All') return true;
    return inv.sector.toLowerCase() === activeSector.toLowerCase();
  });

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Investment Hub"
        subtitle="Diaspora opportunities, incentives & ventures"
        showBack={true}
        badgeCount={opportunities.length}
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
          {/* Regulatory Diaspora Incentives Banner */}
          <View style={styles.incentivesBanner}>
            <View style={styles.bannerIconContainer}>
              <Ionicons name="sparkles" size={18} color={colors.goldRich} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerHeadline}>Diaspora Investor Protections</Text>
              <Text style={styles.bannerSub}>
                100% foreign exchange profit repatriation, duty-free equipment imports, and official NBE foreign currency bank accounts.
              </Text>
            </View>
          </View>

          {filteredOpportunities.map((opportunity, index) => {
            const fav = isFavorite('investment', opportunity.id);
            return (
              <AnimatedInvestmentCard
                key={opportunity.id}
                opportunity={opportunity}
                index={index}
                filterTrigger={`${activeSector}-${searchQuery}`}
                fav={fav}
                onToggleFav={() => toggleFavorite('investment', opportunity.id)}
                onPress={() =>
                  router.push({ pathname: '/investment/[id]', params: { id: opportunity.id } })
                }
              />
            );
          })}

          {filteredOpportunities.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="trending-up" size={36} color={colors.gold} />
              </View>
              <Text style={styles.emptyTitle}>No opportunities found</Text>
              <Text style={styles.emptyText}>
                No verified projects matched your search &quot;{searchQuery}&quot; in {activeSector}. Try refining your search terms or reset filters.
              </Text>
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSearchQuery('');
                  setActiveSector('All');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.resetFilterText}>Reset Search & Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </Animated.ScrollView>

        {/* ── Floating Collapsible Search Bar & Sector Pills (60fps Native Driver) ── */}
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
                <Ionicons name="search" size={16} color={colors.navy} />
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search real estate, agriculture, startups, energy…"
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
                    {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'project' : 'projects'}
                  </Text>
                </View>
              )}
            </View>

            {/* Sector filter pills horizontal scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {sectors.map((cat) => {
                const isActive = activeSector === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[styles.catPill, isActive && styles.catPillActive]}
                    onPress={() => setActiveSector(cat.label)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isActive ? '#FFFFFF' : colors.charcoalSub}
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
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadow.card,
  },
  searchBarPodFocused: {
    borderColor: colors.navy,
    backgroundColor: colors.card,
    borderWidth: 1.5,
  },
  searchIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconCircleFocused: {
    backgroundColor: colors.navySoft,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  countBadgePill: {
    backgroundColor: colors.navySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.navy,
  },

  // ── Sector Pills Row ────────────────────────────────
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
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
    shadowColor: colors.navy,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  catText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  catTextActive: {
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Incentives Banner ───────────────────────────────
  incentivesBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navySoft,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    gap: 12,
    ...shadow.card,
  },
  bannerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerHeadline: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
    marginBottom: 2,
  },
  bannerSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // ── Opportunity Cards ───────────────────────────────
  cardWrap: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 165,
    backgroundColor: colors.surfaceWarm,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  floatingSectorPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(7, 21, 43, 0.88)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  floatingSectorText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 0.8,
  },
  floatingBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  floatingBookmarkActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.goldBorder,
  },

  cardBody: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  opportunityTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.textPrimary,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  verifiedText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.goldText,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  blurbText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: 10,
    gap: 12,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
  },
  metricLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  metricValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.navy,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  incentiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  incentiveText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.navySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.xs,
  },
  exploreBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginTop: 20,
    ...shadow.card,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 19,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 19,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  resetFilterText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
