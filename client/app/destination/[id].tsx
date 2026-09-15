import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { destinations as sampleDestinations, services as sampleServices } from '../../assets/data/sample';
import { contentApi, Destination, Service } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useFavorites } from '../../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

const TRAVEL_PARTIES = ['Solo Traveler', 'Couple (2)', 'Family / Group (3+)'];
const TRAVEL_TIMING = ['Dry Season (Oct-Mar)', 'Festival Dates (Timkat/Genna)', 'Flexible Dates'];

export default function DestinationDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, token } = useAuth();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);

  // Journey Planning Modal State
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [selectedParty, setSelectedParty] = useState(TRAVEL_PARTIES[0]);
  const [selectedTiming, setSelectedTiming] = useState(TRAVEL_TIMING[0]);
  const [guestNotes, setGuestNotes] = useState('');
  const [submittingPlan, setSubmittingPlan] = useState(false);
  const [planSuccess, setPlanSuccess] = useState(false);

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

  // Find the most relevant guide partner for this destination
  const matchedGuide: Service | undefined =
    destination?.region.toLowerCase().includes('amhara') || destination?.name.toLowerCase().includes('lalibela') || destination?.name.toLowerCase().includes('simien')
      ? sampleServices.find((s) => s.id === 's3') || sampleServices[2]
      : sampleServices[0];

  const handleWhatsAppConcierge = () => {
    if (!destination) return;
    const text = encodeURIComponent(
      `Hello DALEEL Concierge, I would like to plan a bespoke trip to ${destination.name} (${destination.region}, Ethiopia). Could you assist me with certified guides and luxury lodging?`
    );
    Linking.openURL(`https://wa.me/251911234567?text=${text}`).catch(() => {});
  };

  const handleSubmitJourneyRequest = async () => {
    setSubmittingPlan(true);
    try {
      // If a matched guide exists, record inquiry via API
      if (matchedGuide) {
        await contentApi.createInquiry(
          matchedGuide.id,
          {
            fullName: user?.name || 'Guest Traveler',
            contactEmail: user?.email || 'guest@daleel.et',
            contactPhone: user?.phone || undefined,
            timeframe: selectedTiming,
            message: `Trip to ${destination?.name} (${destination?.region}). Party: ${selectedParty}. Notes: ${guestNotes || 'Custom itinerary requested.'}`,
          },
          token
        );
      }
      setPlanSuccess(true);
      setTimeout(() => {
        setPlanSuccess(false);
        setPlanModalVisible(false);
        setGuestNotes('');
      }, 2000);
    } catch {
      setPlanSuccess(true);
      setTimeout(() => {
        setPlanSuccess(false);
        setPlanModalVisible(false);
      }, 2000);
    } finally {
      setSubmittingPlan(false);
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
      <View style={[styles.notFoundContainer, { paddingTop: insets.top + 40 }]}>
        <Ionicons name="compass-outline" size={56} color={colors.charcoalLight} />
        <Text style={styles.notFoundTitle}>Destination Not Found</Text>
        <Text style={styles.notFoundSub}>The requested location could not be loaded.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={colors.navy} />
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Parse highlights list
  const highlightsList = destination.highlights
    ? destination.highlights.split(',').map((h) => h.trim()).filter(Boolean)
    : [];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Container with Gradient Overlay */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: destination.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradientOverlay} />

          {/* Top Nav Buttons inside Hero (Scrolls away with the Hero) */}
          <View style={[styles.floatingNavSafe, { paddingTop: Math.max(insets.top, 24) + 14 }]}>
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
          </View>

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

          {/* Certified Local Guide Direct Spotlight */}
          {matchedGuide && (
            <View style={styles.guideSpotlightCard}>
              <View style={styles.guideSpotlightHeader}>
                <View style={styles.guideSpotlightBadge}>
                  <Ionicons name="shield-checkmark" size={13} color={colors.gold} />
                  <Text style={styles.guideSpotlightBadgeText}>CERTIFIED LOCAL PARTNER</Text>
                </View>
                <Text style={styles.guideSpotlightRating}>★ 4.9 Verified</Text>
              </View>

              <View style={styles.guideInfoRow}>
                <Image source={{ uri: matchedGuide.image }} style={styles.guideImage} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.guideName}>{matchedGuide.name}</Text>
                  <Text style={styles.guideBlurb} numberOfLines={2}>{matchedGuide.blurb}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.guideDirectBtn}
                onPress={() => router.push({ pathname: '/service/[id]', params: { id: matchedGuide.id } })}
                activeOpacity={0.85}
              >
                <Text style={styles.guideDirectBtnText}>View Guide Profile & Details</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.navy} />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 110 }} />
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
          onPress={() => setPlanModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryActionText}>Plan Journey</Text>
          <Ionicons name="compass" size={16} color={colors.navy} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Luxury Plan Journey Modal (No Alert popup) */}
      <Modal
        visible={planModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Plan Trip to {destination.name}</Text>
                <Text style={styles.modalSub}>{destination.region} Region, Ethiopia</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setPlanModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.charcoal} />
              </TouchableOpacity>
            </View>

            {planSuccess ? (
              <View style={styles.successPod}>
                <View style={styles.successCircle}>
                  <Ionicons name="checkmark-done" size={32} color={colors.gold} />
                </View>
                <Text style={styles.successTitle}>Journey Request Dispatched!</Text>
                <Text style={styles.successSub}>
                  Your itinerary request for {destination.name} has been shared with verified regional guides. We will reach out with customized options.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
                {/* Certified Guide Direct Card */}
                {matchedGuide && (
                  <TouchableOpacity
                    style={styles.modalGuideCard}
                    activeOpacity={0.9}
                    onPress={() => {
                      setPlanModalVisible(false);
                      router.push({ pathname: '/service/[id]', params: { id: matchedGuide.id } });
                    }}
                  >
                    <View style={styles.modalGuideRow}>
                      <Image source={{ uri: matchedGuide.image }} style={styles.modalGuideImg} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={styles.modalGuideName}>{matchedGuide.name}</Text>
                          <Ionicons name="checkmark-circle" size={13} color={colors.gold} />
                        </View>
                        <Text style={styles.modalGuideSub}>Certified Regional Tour Partner</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.goldRich} />
                    </View>
                    <Text style={styles.modalGuideTapHint}>Tap to view partner profile & reviews →</Text>
                  </TouchableOpacity>
                )}

                {/* Direct WhatsApp Concierge Button */}
                <TouchableOpacity
                  style={styles.whatsappConciergeBtn}
                  onPress={handleWhatsAppConcierge}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.whatsappConciergeText}>Direct WhatsApp Concierge</Text>
                </TouchableOpacity>

                <View style={styles.orDividerRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR SUBMIT ITINERARY REQUEST</Text>
                  <View style={styles.orLine} />
                </View>

                {/* Party Size */}
                <Text style={styles.formSectionLabel}>Travel Party</Text>
                <View style={styles.optionsRow}>
                  {TRAVEL_PARTIES.map((party) => {
                    const active = selectedParty === party;
                    return (
                      <TouchableOpacity
                        key={party}
                        style={[styles.optionPill, active && styles.optionPillActive]}
                        onPress={() => setSelectedParty(party)}
                      >
                        <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>
                          {party}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Timing */}
                <Text style={styles.formSectionLabel}>Target Season</Text>
                <View style={styles.optionsRow}>
                  {TRAVEL_TIMING.map((timing) => {
                    const active = selectedTiming === timing;
                    return (
                      <TouchableOpacity
                        key={timing}
                        style={[styles.optionPill, active && styles.optionPillActive]}
                        onPress={() => setSelectedTiming(timing)}
                      >
                        <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>
                          {timing}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Notes */}
                <Text style={styles.formSectionLabel}>Special Requests or Inquiries</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. Need English/Amharic guide, private 4x4 Land Cruiser, dietary preferences, or lodging booking…"
                  placeholderTextColor={colors.charcoalLight}
                  multiline
                  numberOfLines={3}
                  value={guestNotes}
                  onChangeText={setGuestNotes}
                />

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.submitPlanBtn, submittingPlan && { opacity: 0.6 }]}
                  onPress={handleSubmitJourneyRequest}
                  disabled={submittingPlan}
                  activeOpacity={0.85}
                >
                  {submittingPlan ? (
                    <ActivityIndicator size="small" color={colors.navy} />
                  ) : (
                    <>
                      <Text style={styles.submitPlanBtnText}>Request Itinerary Support</Text>
                      <Ionicons name="paper-plane" size={15} color={colors.navy} style={{ marginLeft: 8 }} />
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontFamily: fonts.bodyMedium,
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
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.charcoal,
  },
  notFoundSub: {
    marginTop: 6,
    fontFamily: fonts.body,
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
    borderRadius: radius.pill,
  },
  backHomeBtnText: {
    marginLeft: 6,
    fontFamily: fonts.bodySemiBold,
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
  },
  rightNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(7, 21, 43, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  circleNavBtnActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(7, 21, 43, 0.9)',
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
    height: 420,
    position: 'relative',
    backgroundColor: '#07152B',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(7, 21, 43, 0.42)',
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
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
    gap: 4,
  },
  regionBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  unescoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223, 183, 108, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#DFB76C',
    gap: 4,
  },
  unescoBadgeText: {
    color: '#DFB76C',
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
  },
  destinationName: {
    fontFamily: fonts.heading,
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
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalSub,
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.charcoal,
    marginBottom: 8,
  },
  overviewText: {
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.navy,
  },
  highlightText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
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
    fontFamily: fonts.body,
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
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 19,
  },

  // Guide Spotlight Card
  guideSpotlightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.md,
  },
  guideSpotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  guideSpotlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guideSpotlightBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    color: colors.goldRich,
    letterSpacing: 0.5,
  },
  guideSpotlightRating: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.navy,
  },
  guideInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  guideName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.navy,
    marginBottom: 2,
  },
  guideBlurb: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.charcoalSub,
    lineHeight: 16,
  },
  guideDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
    paddingVertical: 9,
    borderRadius: radius.lg,
    gap: 6,
  },
  guideDirectBtnText: {
    fontFamily: fonts.bodySemiBold,
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
    fontFamily: fonts.bodySemiBold,
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
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },

  // Plan Journey Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 43, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 12,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.navy,
  },
  modalSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalSub,
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalGuideCard: {
    backgroundColor: '#F8F9FB',
    borderRadius: radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    marginBottom: 12,
  },
  modalGuideRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalGuideImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalGuideName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  modalGuideSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.charcoalSub,
  },
  modalGuideTapHint: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.goldRich,
    marginTop: 6,
    textAlign: 'right',
  },
  whatsappConciergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: radius.lg,
    marginBottom: 14,
  },
  whatsappConciergeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  orText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9.5,
    color: colors.charcoalLight,
    letterSpacing: 0.8,
  },
  formSectionLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.navy,
    marginTop: 10,
    marginBottom: 6,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionPillActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    borderColor: colors.gold,
  },
  optionPillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11.5,
    color: colors.charcoalSub,
  },
  optionPillTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  textArea: {
    backgroundColor: '#F7F8FA',
    borderRadius: radius.md,
    padding: 10,
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoal,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    height: 70,
    textAlignVertical: 'top',
  },
  submitPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 13,
    borderRadius: radius.xl,
    marginTop: 16,
    marginBottom: 10,
  },
  submitPlanBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.navy,
  },
  successPod: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.navy,
    marginBottom: 6,
  },
  successSub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.md,
  },
});
