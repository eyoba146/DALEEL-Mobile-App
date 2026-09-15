import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
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
import { services as sampleServices } from '../../assets/data/sample';
import { contentApi, Service, ServiceInquiryPayload } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useFavorites } from '../../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

const TIMEFRAMES = ['Urgent (<48h)', 'Next 2 Weeks', 'Within 1-3 Months', 'General Inquiry'];

export default function ServiceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, token } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // Inquiry Modal State
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [contactWhatsapp, setContactWhatsapp] = useState(user?.phone ?? '');
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[1]);
  const [message, setMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchDetail() {
      if (!id) return;
      try {
        const data = await contentApi.service(id);
        if (isMounted && data) {
          setService(data);
        }
      } catch (err) {
        // Fallback to sample data for offline / preview support
        const fallback = sampleServices.find((s) => s.id === id);
        if (isMounted && fallback) {
          setService(fallback);
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

  // Sync user details if user context updates
  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name);
      if (!contactEmail) setContactEmail(user.email);
      if (!contactPhone && user.phone) setContactPhone(user.phone);
      if (!contactWhatsapp && user.phone) setContactWhatsapp(user.phone);
    }
  }, [user]);

  const fav = service ? isFavorite('service', service.id) : false;

  const handleShare = async () => {
    if (!service) return;
    try {
      await Share.share({
        title: `${service.name} - Verified Partner on DALEEL`,
        message: `Connect with ${service.name} (${service.category}, ${service.location}) on DALEEL: ${service.blurb}`,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

  const handleCall = () => {
    const rawNumber = service?.phone || '+251911234567';
    const cleaned = rawNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Phone Call', `Could not initiate call to ${rawNumber}`);
    });
  };

  const handleWhatsApp = () => {
    const rawNumber = service?.whatsapp || '+251911234567';
    const cleaned = rawNumber.replace(/[^0-9]/g, '');
    const defaultText = encodeURIComponent(
      `Hello ${service?.name}, I found your listing on the DALEEL Diaspora App and would like to inquire about your ${service?.category} services.`
    );
    Linking.openURL(`https://wa.me/${cleaned}?text=${defaultText}`).catch(() => {
      Alert.alert('WhatsApp', 'WhatsApp is not installed on this device.');
    });
  };

  const handleSubmitInquiry = async () => {
    if (!fullName.trim() || !contactEmail.trim() || !message.trim()) {
      Alert.alert('Missing Information', 'Please provide your full name, email address, and inquiry message.');
      return;
    }

    if (!service) return;

    setSubmittingInquiry(true);
    try {
      const payload: ServiceInquiryPayload = {
        fullName: fullName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim() || undefined,
        contactWhatsapp: contactWhatsapp.trim() || undefined,
        timeframe: selectedTimeframe,
        message: message.trim(),
      };

      await contentApi.createInquiry(service.id, payload, token);
      setInquirySuccess(true);
      setTimeout(() => {
        setInquirySuccess(false);
        setInquiryModalVisible(false);
        setMessage('');
      }, 2000);
    } catch (err: any) {
      Alert.alert('Inquiry Note', err?.message || 'Could not submit inquiry at this moment. You can contact them directly via WhatsApp or phone.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading partner profile…</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Ionicons name="briefcase-outline" size={56} color={colors.charcoalLight} />
        <Text style={styles.notFoundTitle}>Partner Not Found</Text>
        <Text style={styles.notFoundSub}>The requested service provider could not be located.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={colors.navy} />
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Parse features list
  const featuresList = service.features
    ? service.features.split(',').map((f) => f.trim()).filter(Boolean)
    : [];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Container */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: service.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradientOverlay} />

          {/* Floating Top Nav Bar inside Hero (Scrolls away with content) */}
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
                  onPress={() => toggleFavorite('service', service.id)}
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

          {/* Floating Category & Verified Badges */}
          <View style={styles.heroTextPod}>
            <View style={styles.badgesRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{service.category.toUpperCase()}</Text>
              </View>

              {service.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.gold} />
                  <Text style={styles.verifiedBadgeText}>DALEEL Verified Partner</Text>
                </View>
              )}
            </View>

            <Text style={styles.providerName}>{service.name}</Text>
          </View>
        </View>

        {/* Content Body Container */}
        <View style={styles.bodyContainer}>
          {/* Partner Meta & Rating Row */}
          <View style={styles.metaRow}>
            <View style={styles.locationItem}>
              <Ionicons name="location-sharp" size={14} color={colors.goldRich} />
              <Text style={styles.locationText}>{service.location}, Ethiopia</Text>
            </View>

            <View style={styles.ratingItem}>
              <Ionicons name="star" size={14} color={colors.goldRich} />
              <Text style={styles.ratingText}>
                {service.rating ? service.rating.toFixed(1) : '4.9'} ({service.reviewCount ?? 110} reviews)
              </Text>
            </View>
          </View>

          {/* Trust Seal Banner */}
          <View style={styles.trustBanner}>
            <View style={styles.trustIconWrap}>
              <Ionicons name="shield-checkmark" size={20} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustTitle}>Vetted & Licensed Service Provider</Text>
              <Text style={styles.trustSub}>
                Commercial registration verified. Multilingual support (English & Amharic) for diaspora clients.
              </Text>
            </View>
          </View>

          {/* Quick Action Contact Cards Row */}
          <View style={styles.quickContactGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={handleWhatsApp} activeOpacity={0.85}>
              <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <Text style={styles.quickActionLabel}>WhatsApp</Text>
              <Text style={styles.quickActionSub}>Direct Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={handleCall} activeOpacity={0.85}>
              <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(7, 21, 43, 0.1)' }]}>
                <Ionicons name="call" size={19} color={colors.navy} />
              </View>
              <Text style={styles.quickActionLabel}>Call Partner</Text>
              <Text style={styles.quickActionSub}>Phone Line</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setInquiryModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(223, 183, 108, 0.18)' }]}>
                <Ionicons name="mail-unread" size={19} color={colors.goldRich} />
              </View>
              <Text style={styles.quickActionLabel}>Send Inquiry</Text>
              <Text style={styles.quickActionSub}>Request Quote</Text>
            </TouchableOpacity>
          </View>

          {/* About Partner Section */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>About this Partner</Text>
            <Text style={styles.overviewText}>
              {service.description || service.blurb}
            </Text>
          </View>

          {/* Services & Capabilities List */}
          {featuresList.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="checkbox" size={18} color={colors.goldRich} />
                <Text style={styles.sectionTitle}>Scope of Services</Text>
              </View>

              <View style={styles.featuresCard}>
                {featuresList.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.goldRich} style={{ marginRight: 10, marginTop: 1 }} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Office & Operations Card */}
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Office & Hours</Text>
            <View style={styles.officeCard}>
              <View style={styles.officeRow}>
                <Ionicons name="time-outline" size={18} color={colors.navy} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.officeHeading}>Operating Hours</Text>
                  <Text style={styles.officeValue}>
                    {service.operatingHours || 'Monday – Friday: 8:30 AM – 5:30 PM (EAT)'}
                  </Text>
                </View>
              </View>

              <View style={styles.officeDivider} />

              <View style={styles.officeRow}>
                <Ionicons name="business-outline" size={18} color={colors.navy} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.officeHeading}>Headquarters Location</Text>
                  <Text style={styles.officeValue}>
                    {service.address || `${service.location}, Addis Ababa, Ethiopia`}
                  </Text>
                </View>
              </View>

              <View style={styles.officeDivider} />

              <View style={styles.officeRow}>
                <Ionicons name="chatbubbles-outline" size={18} color={colors.navy} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.officeHeading}>Languages Supported</Text>
                  <Text style={styles.officeValue}>English, Amharic (አማርኛ), Oromo</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.whatsAppBottomBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.whatsAppBottomText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inquiryBottomBtn}
          onPress={() => setInquiryModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.inquiryBottomText}>Submit Formal Inquiry</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.navy} style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      {/* Interactive Service Inquiry Modal */}
      <Modal
        visible={inquiryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInquiryModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContentCard}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Request Partner Inquiry</Text>
                <Text style={styles.modalSub}>{service.name}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setInquiryModalVisible(false)}
                disabled={submittingInquiry}
              >
                <Ionicons name="close" size={20} color={colors.charcoal} />
              </TouchableOpacity>
            </View>

            {inquirySuccess ? (
              <View style={styles.successStatePod}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-done" size={32} color={colors.gold} />
                </View>
                <Text style={styles.successStateTitle}>Inquiry Dispatched!</Text>
                <Text style={styles.successStateSub}>
                  Your request has been forwarded directly to {service.name}. Their diaspora concierge team will reply within 24 hours.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }}>
                {/* Full Name */}
                <Text style={styles.inputLabel}>Full Legal Name *</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="e.g. Eyob Adamu"
                  placeholderTextColor={colors.charcoalLight}
                  value={fullName}
                  onChangeText={setFullName}
                />

                {/* Email */}
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="name@domain.com"
                  placeholderTextColor={colors.charcoalLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                />

                {/* Phone / WhatsApp */}
                <View style={styles.twoColRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Phone Number</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="+251 9..."
                      placeholderTextColor={colors.charcoalLight}
                      keyboardType="phone-pad"
                      value={contactPhone}
                      onChangeText={setContactPhone}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.inputLabel}>WhatsApp</Text>
                    <TextInput
                      style={styles.inputField}
                      placeholder="+251 9..."
                      placeholderTextColor={colors.charcoalLight}
                      keyboardType="phone-pad"
                      value={contactWhatsapp}
                      onChangeText={setContactWhatsapp}
                    />
                  </View>
                </View>

                {/* Timeframe selector */}
                <Text style={styles.inputLabel}>Required Timeframe</Text>
                <View style={styles.timeframeGrid}>
                  {TIMEFRAMES.map((tf) => {
                    const active = selectedTimeframe === tf;
                    return (
                      <TouchableOpacity
                        key={tf}
                        style={[styles.timeframePill, active && styles.timeframePillActive]}
                        onPress={() => setSelectedTimeframe(tf)}
                      >
                        <Text style={[styles.timeframeText, active && styles.timeframeTextActive]}>
                          {tf}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Requirements Message */}
                <Text style={styles.inputLabel}>Inquiry Details / Scope of Need *</Text>
                <TextInput
                  style={[styles.inputField, styles.textAreaField]}
                  placeholder="Explain your situation, required dates, or specific assistance needed in Ethiopia…"
                  placeholderTextColor={colors.charcoalLight}
                  multiline
                  numberOfLines={4}
                  value={message}
                  onChangeText={setMessage}
                />

                {/* Submit Action */}
                <TouchableOpacity
                  style={[styles.submitInquiryBtn, submittingInquiry && { opacity: 0.65 }]}
                  onPress={handleSubmitInquiry}
                  disabled={submittingInquiry}
                  activeOpacity={0.85}
                >
                  {submittingInquiry ? (
                    <ActivityIndicator size="small" color={colors.navy} />
                  ) : (
                    <>
                      <Text style={styles.submitInquiryText}>Send Inquiry to Partner</Text>
                      <Ionicons name="send" size={15} color={colors.navy} style={{ marginLeft: 8 }} />
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
    height: 400,
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
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.gold,
    gap: 5,
  },
  verifiedBadgeText: {
    color: colors.gold,
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  providerName: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    color: '#FFFFFF',
    lineHeight: 36,
  },

  // Body Container
  bodyContainer: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Meta Row
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.charcoalSub,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.navy,
  },

  // Trust Banner
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: 12,
    marginBottom: spacing.lg,
  },
  trustIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trustSub: {
    fontFamily: fonts.sansRegular,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 15,
  },

  // Quick Contact Grid
  quickContactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: spacing.xl,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  quickActionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.navy,
    marginBottom: 1,
  },
  quickActionSub: {
    fontFamily: fonts.sansRegular,
    fontSize: 10,
    color: colors.charcoalSub,
  },

  // Section Styles
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
    lineHeight: 23,
  },

  // Features Card
  featuresCard: {
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
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  featureText: {
    flex: 1,
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.charcoal,
    lineHeight: 20,
  },

  // Office & Operations Card
  officeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  officeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  officeHeading: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.charcoalSub,
    marginBottom: 2,
  },
  officeValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.navy,
    lineHeight: 18,
  },
  officeDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
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
  whatsAppBottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: radius.xl,
  },
  whatsAppBottomText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  inquiryBottomBtn: {
    flex: 1.4,
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
  inquiryBottomText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.navy,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 43, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingBottom: 12,
  },
  modalTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 20,
    color: colors.navy,
  },
  modalSub: {
    fontFamily: fonts.sansRegular,
    fontSize: 13,
    color: colors.charcoalSub,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form Inputs
  inputLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.navy,
    marginBottom: 6,
    marginTop: 10,
  },
  inputField: {
    backgroundColor: '#F7F8FA',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.sansRegular,
    color: colors.charcoal,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  textAreaField: {
    height: 90,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  timeframeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  timeframePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#F0F2F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeframePillActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    borderColor: colors.gold,
  },
  timeframeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.charcoalSub,
  },
  timeframeTextActive: {
    color: colors.navy,
    fontFamily: fonts.sansSemiBold,
  },

  submitInquiryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: radius.xl,
    marginTop: 20,
    marginBottom: 10,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitInquiryText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.navy,
  },

  // Success State Pod
  successStatePod: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successStateTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.navy,
    marginBottom: 8,
  },
  successStateSub: {
    fontFamily: fonts.sansRegular,
    fontSize: 14,
    color: colors.charcoalSub,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: spacing.md,
  },
});
