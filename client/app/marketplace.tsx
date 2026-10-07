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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { products as sampleProducts } from '../assets/data/sample';
import { CurrencySelector } from '../components/CurrencySelector';
import ScreenHeader from '../components/ScreenHeader';
import { contentApi, Product, categoriesApi, CategoryItem } from '../lib/api';
import { useCurrency } from '../lib/currency-context';
import { useFavorites } from '../lib/favorites-context';
import { colors, fonts, radius, shadow, spacing } from '../theme/tokens';

function resolveProductIcon(name: string): keyof typeof Ionicons.glyphMap {
  const n = name.toLowerCase();
  if (n.includes('fashion') || n.includes('textil') || n.includes('kemis') || n.includes('dress') || n.includes('cloth') || n.includes('shirt')) return 'shirt-outline';
  if (n.includes('coffee') || n.includes('roast') || n.includes('guji') || n.includes('yirgacheffe') || n.includes('sidama') || n.includes('cafe') || n.includes('bean')) return 'cafe-outline';
  if (n.includes('leather') || n.includes('bag') || n.includes('wallet') || n.includes('briefcase')) return 'briefcase-outline';
  if (n.includes('craft') || n.includes('pottery') || n.includes('art') || n.includes('wood') || n.includes('sculpt')) return 'color-palette-outline';
  if (n.includes('jewel') || n.includes('gold') || n.includes('silver') || n.includes('cross') || n.includes('ring') || n.includes('diamond')) return 'diamond-outline';
  return 'pricetag-outline';
}

const AnimatedProductCard = React.memo(function AnimatedProductCard({
  item,
  index,
  filterTrigger,
  fav,
  onToggleFav,
  onPress,
}: {
  item: Product;
  index: number;
  filterTrigger: string;
  fav: boolean;
  onToggleFav: () => void;
  onPress: () => void;
}) {
  const animValue = useRef(new Animated.Value(0)).current;
  const { formatPrice, currency } = useCurrency();

  useEffect(() => {
    animValue.setValue(0);
    Animated.spring(animValue, {
      toValue: 1,
      tension: 65,
      friction: 9,
      delay: Math.min(index * 45, 220),
      useNativeDriver: true,
    }).start();
  }, [filterTrigger]);

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

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
        {/* Product Photo & Badges */}
        <View style={styles.imageWrap}>
          <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{formatPrice(item.price)}</Text>
            {currency !== 'ETB' && (
              <Text style={styles.priceBadgeSubText}>~{item.price.toLocaleString('en-US')} ETB</Text>
            )}
          </View>

          {/* Category Pill */}
          <View style={styles.categoryPillOverImage}>
            <Text style={styles.categoryPillText}>{item.category.toUpperCase()}</Text>
          </View>

          {/* In Stock Badge */}
          {item.inStock && (
            <View style={styles.stockBadge}>
              <View style={styles.stockDot} />
              <Text style={styles.stockText}>IN STOCK</Text>
            </View>
          )}

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

        {/* Card Body Details */}
        <View style={styles.cardBody}>
          {/* Artisan Seller Line */}
          <View style={styles.sellerHeaderRow}>
            <View style={styles.sellerIdentity}>
              <Ionicons name="storefront-outline" size={13} color={colors.gold} style={{ marginRight: 4 }} />
              <Text style={styles.sellerNameText} numberOfLines={1}>
                {item.sellerName}
              </Text>
              {item.sellerVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginLeft: 4 }} />
              )}
            </View>
            <View style={styles.locationWrap}>
              <Ionicons name="location-outline" size={12} color={colors.charcoalSub} style={{ marginRight: 2 }} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.sellerLocation?.split(',')[0] || 'Ethiopia'}
              </Text>
            </View>
          </View>

          {/* Product Title */}
          <Text style={styles.productTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {/* Product Blurb */}
          <Text style={styles.productBlurb} numberOfLines={2}>
            {item.blurb}
          </Text>

          {/* Materials or Origin preview */}
          {(item.materials || item.origin) && (
            <View style={styles.materialsRow}>
              <Ionicons name="sparkles" size={12} color={colors.gold} style={{ marginRight: 5 }} />
              <Text style={styles.materialsText} numberOfLines={1}>
                {item.materials || item.origin}
              </Text>
            </View>
          )}

          {/* Action Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.ratingRow}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.gold} />
              <Text style={styles.authenticityBadgeText}>Certified Authentic</Text>
            </View>

            <View style={styles.viewDetailBtn}>
              <Text style={styles.viewDetailBtnText}>View Artisan Piece</Text>
              <Ionicons name="arrow-forward" size={13} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

const HEADER_HEIGHT = 106;

export default function MarketplaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { formatPrice } = useCurrency();

  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const categories = useMemo(() => {
    const list: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
      { label: 'All', icon: 'sparkles-outline' },
    ];
    const added = new Set<string>(['All']);

    for (const c of dbCategories) {
      if (!added.has(c.name)) {
        added.add(c.name);
        list.push({
          label: c.name,
          icon: (c.icon as any) || resolveProductIcon(c.name),
        });
      }
    }

    for (const p of products) {
      if (p.category && !added.has(p.category)) {
        added.add(p.category);
        list.push({
          label: p.category,
          icon: resolveProductIcon(p.category),
        });
      }
    }

    return list;
  }, [dbCategories, products]);

  // 60fps Native-driven collapsible header animation
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const clampedScroll = useRef(
    Animated.diffClamp(scrollAnim, 0, HEADER_HEIGHT)
  ).current;

  const translateY = clampedScroll.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT],
    extrapolate: 'clamp',
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.allSettled([
        contentApi.products(activeCategory !== 'All' ? activeCategory : undefined),
        categoriesApi.getAll('product'),
      ]);

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.length > 0) {
        setDbCategories(categoriesRes.value);
      }

      if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value) && productsRes.value.length > 0) {
        setProducts(productsRes.value);
      } else {
        setProducts(sampleProducts);
      }
    } catch {
      setProducts(sampleProducts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCategory =
        activeCategory === 'All' || item.category.toLowerCase() === activeCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchCategory;

      const matchQuery =
        item.title.toLowerCase().includes(query) ||
        item.blurb.toLowerCase().includes(query) ||
        item.sellerName.toLowerCase().includes(query) ||
        (item.materials && item.materials.toLowerCase().includes(query)) ||
        (item.origin && item.origin.toLowerCase().includes(query));

      return matchCategory && matchQuery;
    });
  }, [products, activeCategory, searchQuery]);

  return (
    <View style={styles.screen}>
      {/* Fixed Luxury Screen Header with back navigation */}
      <ScreenHeader
        title="Artisan Marketplace"
        subtitle="Handcrafted Ethiopian treasures, textiles & specialty coffee"
        showBack
        rightElement={
          <View style={styles.headerRightActions}>
            <CurrencySelector compact />
            <TouchableOpacity
              style={styles.headerCartBtn}
              onPress={() => router.push('/(tabs)/saved')}
              activeOpacity={0.8}
              accessibilityLabel="Saved Items"
            >
              <Ionicons name="bookmark-outline" size={19} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        }
      />

      {/* Main Screen Body Container */}
      <View style={styles.mainBodyContainer}>
        {/* Scrollable Products List */}
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
            { useNativeDriver: true }
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gold}
              colors={[colors.gold]}
              progressViewOffset={HEADER_HEIGHT + 10}
            />
          }
        >
          {/* Marketplace Story Banner */}
          <View style={styles.announcementBanner}>
            <View style={styles.announcementIconBox}>
              <Ionicons name="ribbon-outline" size={22} color={colors.gold} />
            </View>
            <View style={styles.announcementTextWrap}>
              <Text style={styles.announcementTitle}>Fair-Trade Artisan Direct</Text>
              <Text style={styles.announcementSub}>
                Every piece is authentic, handcrafted by Ethiopian master weavers, silversmiths, and micro-roasters. Direct diaspora courier delivery available.
              </Text>
            </View>
          </View>

          {/* Products List Cards */}
          {filteredProducts.map((item, index) => {
            const fav = isFavorite('product', item.id);
            return (
              <AnimatedProductCard
                key={item.id}
                item={item}
                index={index}
                filterTrigger={`${activeCategory}-${searchQuery}`}
                fav={fav}
                onToggleFav={() => toggleFavorite('product', item.id)}
                onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              />
            );
          })}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="basket-outline" size={36} color={colors.gold} />
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptyText}>
                No artisan items matched &quot;{searchQuery}&quot; in {activeCategory}. Try adjusting your search query or reset filters.
              </Text>
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
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

        {/* Floating Collapsible Search Bar & Category Pills */}
        <Animated.View
          style={[
            styles.floatingHeaderContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.searchSectionInner}>
            {/* Search Bar Pod */}
            <View style={[styles.searchBarPod, isSearchFocused && styles.searchBarPodFocused]}>
              <View style={[styles.searchIconCircle, isSearchFocused && styles.searchIconCircleFocused]}>
                <Ionicons name="search" size={16} color={colors.navy} />
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Search Habesha Kemis, Guji coffee, leather, crosses…"
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
                  <Ionicons name="close-circle" size={18} color={colors.charcoalSub} />
                </TouchableOpacity>
              ) : (
                <View style={styles.countBadgePill}>
                  <Text style={styles.countBadgeText}>{filteredProducts.length}</Text>
                </View>
              )}
            </View>

            {/* Horizontal Category Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsScroll}
            >
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                    onPress={() => setActiveCategory(cat.label)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.charcoal}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.categoryPillLabel, isSelected && styles.categoryPillLabelActive]}>
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
    height: 48,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    marginRight: 8,
  },
  searchIconCircleFocused: {
    backgroundColor: colors.navySoft,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textPrimary,
    height: '100%',
    paddingVertical: 0,
  },
  clearBtn: {
    paddingHorizontal: 6,
  },
  countBadgePill: {
    backgroundColor: colors.navySoft,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.xs,
    marginRight: 4,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },

  // Category Filter Pills
  categoryPillsScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
  },
  categoryPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  categoryPillLabel: {
    fontSize: 12,
    fontFamily: fonts.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryPillLabelActive: {
    color: '#FFFFFF',
  },

  // Announcement / Story Banner
  announcementBanner: {
    flexDirection: 'row',
    backgroundColor: colors.navySoft,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadow.card,
  },
  announcementIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  announcementTextWrap: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
    marginBottom: 2,
  },
  announcementSub: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Product Card Styles
  cardWrap: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: colors.surfaceWarm,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  priceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.navy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  priceBadgeText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.gold,
    letterSpacing: 0.3,
  },
  priceBadgeSubText: {
    fontSize: 9,
    fontFamily: fonts.bodySemiBold,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPillOverImage: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryPillText: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.xs,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
    marginRight: 4,
  },
  stockText: {
    fontSize: 9.5,
    fontFamily: fonts.bodyBold,
    color: colors.charcoal,
    letterSpacing: 0.4,
  },
  floatingBookmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(7, 21, 43, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  floatingBookmarkActive: {
    backgroundColor: colors.navy,
  },

  // Card Body
  cardBody: {
    padding: 16,
  },
  sellerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sellerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  sellerNameText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  productTitle: {
    fontSize: 16,
    fontFamily: fonts.heading,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 6,
  },
  productBlurb: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  materialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.xs,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  materialsText: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authenticityBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bodySemiBold,
    color: colors.goldRich,
    marginLeft: 4,
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.xs,
  },
  viewDetailBtnText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // Empty State
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
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
    fontSize: 18,
    fontFamily: fonts.heading,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  resetFilterText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // Cart Header Button & Badge
  headerCartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerCartBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Floating Bottom View Bag Bar
  floatingCartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
  },
  floatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...shadow.button,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCartIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  floatingCartCountText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  floatingCartRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  floatingCartPriceText: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
    marginRight: 6,
  },
  floatingCartArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
