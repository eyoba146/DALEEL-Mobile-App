import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { destinations as sampleDestinations } from '../../assets/data/sample';
import { contentApi, Destination } from '../../lib/api';
import { useFavorites } from '../../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

export default function DestinationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDetail() {
      if (!id) return;
      try {
        const data = await contentApi.destination(id);
        if (isMounted && data) {
          setDestination(data);
        }
      } catch (err) {
        // Fallback to sample data for offline / preview support
        const fallback = sampleDestinations.find((d) => d.id === id);
        if (isMounted && fallback) {
          setDestination(fallback);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const fav = destination ? isFavorite('destination', destination.id) : false;

  const handleShare = async () => {
    if (!destination) return;
    try {
      await Share.share({
        title: `${destination.name} - Explore Ethiopia on DALEEL`,
        message: `Discover ${destination.name} (${destination.region}, Ethiopia) on DALEEL: ${destination.blurb}`,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading destination details…</Text>
      </View>
    );
  }

  if (!destination) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Ionicons name="compass-outline" size={56} color={colors.charcoalLight} />
        <Text style={styles.notFoundTitle}>Destination Not Found</Text>
        <Text style={styles.notFoundSub}>The requested location could not be loaded.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={colors.navy} />
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Parse highlights list
  const highlightsList = destination.highlights
    ? destination.highlights.split(',').map((h) => h.trim()).filter(Boolean)
    : [];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Floating Top Nav Bar (Hero Overlay) */}
      <SafeAreaView style={styles.floatingNavSafe}>
        <View style={styles.floatingNavRow}>
          <TouchableOpacity
            style={styles.circleNavBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.rightNavActions}>
            <TouchableOpacity
              style={styles.circleNavBtn}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={19} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.circleNavBtn, fav && styles.circleNavBtnActive]}
              onPress={() => toggleFavorite('destination', destination.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={fav ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={fav ? colors.gold : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Container with Gradient Overlay */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: destination.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradientOverlay} />

          {/* Bottom Floating Title Pod */}
          <View style={styles.heroTextPod}>
            <View style={styles.badgesRow}>
              <View style={styles.regionBadge}>
                <Ionicons name="location-sharp" size={12} color={colors.goldRich} />
                <Text style={styles.regionBadgeText}>{destination.region}, Ethiopia</Text>
              </View>

              {destination.unescoStatus && (
                <View style={styles.unescoBadge}>
                  <Ionicons name="ribbon" size={11} color="#DFB76C" />
                  <Text style={styles.unescoBadgeText}>UNESCO Heritage</Text>
                </View>
              )}
            </View>

            <Text style={styles.destinationName}>{destination.name}</Text>
          </View>
        </View>

        {/* Content Body Container */}
        <View style={styles.bodyContainer}>
          {/* Quick Metrics Bar */}
          <View style={styles.metricsCard}>
            <View style={styles.metricItem}>
              <View style={styles.metricIconWrap}>
                <Ionicons name="sunny-outline" size={18} color={colors.gold} />
              </View>
              <Text style={styles.metricLabel}>Best Season</Text>
              <Text style={styles.metricValue}>Oct – Mar</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricIconWrap}>
                <Ionicons name="stats-chart-outline" size={18} color={colors.gold} />
              </View>
              <Text style={styles.metricLabel}>Elevation</Text>
              <Text style={styles.metricValue}>{destination.elevation ?? 'Highlands'}</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <View style={styles.metricIconWrap}>
                <Ionicons name="star" size={18} color={colors.gold} />
              </View>
              <Text style={styles.metricLabel}>Guest Score</Text>
              <Text style={styles.metricValue}>{destination.rating ? destination.rating.toFixed(2) : '4.95'}</Text>
            </View>
          </View>

          {/* Overview Section */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>About the Heritage</Text>
            <Text style={styles.overviewText}>
              {destination.description || destination.blurb}
            </Text>
          </View>

          {/* Key Highlights Section */}
          {highlightsList.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="sparkles" size={18} color={colors.goldRich} />
                <Text style={styles.sectionTitle}>Curated Highlights</Text>
              </View>

              <View style={styles.highlightsCard}>
                {highlightsList.map((highlight, index) => (
                  <View key={index} style={styles.highlightRow}>
                    <View style={styles.highlightBadgeCircle}>
                      <Text style={styles.highlightBadgeIndex}>{index + 1}</Text>
                    </View>
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Seasonal Advisory & Weather */}
          {destination.bestTimeToVisit && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.goldRich} />
                <Text style={styles.sectionTitle}>Travel & Weather Advisory</Text>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoCardText}>{destination.bestTimeToVisit}</Text>
              </View>
            </View>
          )}

          {/* How to Get There */}
          {destination.gettingThere && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="airplane-outline" size={18} color={colors.goldRich} />
                <Text style={styles.sectionTitle}>Getting There from Addis Ababa</Text>
              </View>

              <View style={styles.transitCard}>
                <Ionicons name="navigate-circle-outline" size={24} color={colors.navy} style={{ marginRight: 12 }} />
                <Text style={styles.transitCardText}>{destination.gettingThere}</Text>
              </View>
            </View>
          )}

          {/* Services in this Region Link */}
          <View style={styles.exploreServicesBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exploreServicesTitle}>Verified Services Nearby</Text>
              <Text style={styles.exploreServicesSub}>
                Explore vetted tour guides, drivers, and boutique lodges in {destination.region}.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exploreServicesBtn}
              onPress={() => router.push('/(tabs)/services')}
              activeOpacity={0.85}
            >
              <Text style={styles.exploreServicesBtnText}>View Services</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.navy} />
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveActionBtn, fav && styles.saveActionBtnActive]}
          onPress={() => toggleFavorite('destination', destination.id)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={fav ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={fav ? colors.goldRich : colors.charcoal}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.saveActionText, fav && styles.saveActionTextActive]}>
            {fav ? 'Saved in Itinerary' : 'Save Destination'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => {
            Alert.alert(
              'Trip Planning Concierge',
              `Would you like to connect with a certified local guide for ${destination.name}?`,
              [
                { text: 'Later', style: 'cancel' },
                {
                  text: 'Connect with Guide',
                  onPress: () => router.push('/(tabs)/services'),
                },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryActionText}>Plan Journey</Text>
          <Ionicons name="compass" size={16} color={colors.navy} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#07152B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: colors.gold,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  },
  notFoundContainer: {
    flex: 1,
    backgroundColor: '#F7F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notFoundTitle: {
    marginTop: 14,
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.charcoal,
  },
  notFoundSub: {
    marginTop: 6,
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.charcoalSub,
    textAlign: 'center',
    marginBottom: 20,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.full,
  },
  backHomeBtnText: {
    marginLeft: 6,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.navy,
  },

  // Floating Nav Safe
  floatingNavSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  floatingNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 8,
  },
  rightNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleNavBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(7, 21, 43, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  circleNavBtnActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Container
  heroContainer: {
    width: '100%',
    height: 380,
    position: 'relative',
    backgroundColor: '#07152B',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 21, 43, 0.38)',
  },
  heroTextPod: {
    position: 'absolute',
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
    gap: 4,
  },
  regionBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansMedium,
    fontSize: 12,
  },
  unescoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223, 183, 108, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#DFB76C',
    gap: 4,
  },
  unescoBadgeText: {
    color: '#DFB76C',
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
  },
  destinationName: {
    fontFamily: fonts.serifBold,
    fontSize: 34,
    color: '#FFFFFF',
    lineHeight: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Body Container
  bodyContainer: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },

  // Metrics Card
  metricsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: spacing.xl,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: colors.charcoalSub,
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.navy,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.07)',
  },

  // Sections
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 20,
    color: colors.charcoal,
    marginBottom: 8,
  },
  overviewText: {
    fontFamily: fonts.sansRegular,
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 24,
  },

  // Highlights Card
  highlightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  highlightBadgeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  highlightBadgeIndex: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.navy,
  },
  highlightText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },

  // Info Cards
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.25)',
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  infoCardText: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 21,
  },

  transitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  transitCardText: {
    flex: 1,
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 19,
  },

  // Explore Services Nearby Banner
  exploreServicesBanner: {
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.sm,
  },
  exploreServicesTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exploreServicesSub: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 17,
  },
  exploreServicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    gap: 4,
  },
  exploreServicesBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.navy,
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  saveActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F5',
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  saveActionBtnActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  saveActionText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.charcoal,
  },
  saveActionTextActive: {
    color: colors.navy,
  },
  primaryActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: radius.xl,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryActionText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.navy,
  },
});
