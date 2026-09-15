import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { services as sampleServices } from '../../assets/data/sample';
import { contentApi, Service } from '../../lib/api';
import { useFavorites } from '../../lib/favorites-context';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

type CategoryItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const CATEGORIES: CategoryItem[] = [
  { label: 'All', icon: 'apps-outline' },
  { label: 'Relocation', icon: 'home-outline' },
  { label: 'Legal services', icon: 'document-text-outline' },
  { label: 'Tour operators', icon: 'compass-outline' },
  { label: 'Transportation', icon: 'car-outline' },
  { label: 'Banking', icon: 'card-outline' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [activeCategory, setActiveCategory] = useState('All');
  const [services, setServices] = useState<Service[]>(sampleServices as any);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      const data = await contentApi.services(activeCategory === 'All' ? undefined : activeCategory);
      if (data && data.length > 0) {
        setServices(data);
      } else if (activeCategory === 'All') {
        setServices(sampleServices as any);
      } else {
        const filtered = (sampleServices as any[]).filter((s) => s.category === activeCategory);
        setServices(filtered);
      }
    } catch (err) {
      console.warn('Failed to load services:', err);
      const filtered =
        activeCategory === 'All'
          ? (sampleServices as any)
          : (sampleServices as any[]).filter((s) => s.category === activeCategory);
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

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Services"
        subtitle="Trusted diaspora & investment solutions"
        badgeCount={services.length}
      />

      {/* Category pills sub-bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catBar}
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
          {services.map((s) => {
            const fav = isFavorite('service', s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={styles.card}
                activeOpacity={0.93}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: s.id } })}
              >
                {/* Hero Photo with Floating Badges */}
                <View style={styles.imageContainer}>
                  <Image source={{ uri: s.image }} style={styles.cardImage} resizeMode="cover" />
                  
                  {/* Category Pill Over Image */}
                  <View style={styles.floatingCategoryPill}>
                    <Text style={styles.floatingCategoryText}>{s.category.toUpperCase()}</Text>
                  </View>

                  {/* Bookmark Floating Button */}
                  <TouchableOpacity
                    style={[styles.floatingBookmark, fav && styles.floatingBookmarkActive]}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      toggleFavorite('service', s.id);
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
                    <Text style={styles.providerName}>{s.name}</Text>
                    {s.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color={colors.gold} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color={colors.gold} />
                    <Text style={styles.locationText}>{s.location}, Ethiopia</Text>
                  </View>

                  <Text style={styles.blurbText}>{s.blurb}</Text>

                  {/* Card Action Footer */}
                  <View style={styles.cardFooter}>
                    <View style={styles.trustIndicator}>
                      <Ionicons name="ribbon-outline" size={14} color={colors.charcoalSub} />
                      <Text style={styles.trustText}>DALEEL Guaranteed Partner</Text>
                    </View>

                    <View style={styles.connectBtn}>
                      <Text style={styles.connectBtnText}>
                        Connect & Inquire
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={colors.navy}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {services.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="briefcase-outline" size={36} color={colors.gold} />
              </View>
              <Text style={styles.emptyTitle}>No partners listed</Text>
              <Text style={styles.emptyText}>
                We are actively onboarding verified partners in {activeCategory}.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
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

  // ── Category sub-bar ─────────────────────────────────
  catBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    maxHeight: 52,
  },
  catScroll: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  catPillTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.gold,
  },
  catText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.charcoalSub,
  },
  catTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodySemiBold,
  },
  // ── Legacy shims ───────────────────────────────────
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tagText: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.gold, letterSpacing: 1.2 },
  countBadge: { backgroundColor: colors.surfaceWarm, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  countText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.charcoalSub },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.charcoalSub },

  // Content & Editorial Cards
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#EBE4D8',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#17191C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
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
    backgroundColor: 'rgba(15, 46, 34, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(198, 148, 10, 0.4)',
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
    borderColor: 'rgba(235, 228, 216, 0.8)',
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
    fontFamily: fonts.bodySemiBold,
    fontSize: 17,
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
    fontSize: 13,
    color: colors.charcoal,
    lineHeight: 19,
    marginBottom: 14,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2ECE1',
  },
  trustIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalSub,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  connectBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.goldBorder,
  },
  emptyTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.charcoal,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalSub,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
