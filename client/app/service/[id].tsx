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
import { contentApi, Service, ServiceInquiry, ServiceInquiryPayload } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useFavorites } from '../../lib/favorites-context';
import { LocationCard } from '../../components/LocationCard';
import { ReviewsSection } from '../../components/ReviewsSection';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

const TIMEFRAMES = ['Urgent (<48h)', 'Next 2 Weeks', 'Within 1-3 Months', 'General Inquiry'];

const APPOINTMENT_SLOTS = [
  { id: 'Morning (09:00 - 12:00 EAT)', label: 'Morning', time: '09:00 – 12:00', icon: 'sunny-outline' as const },
  { id: 'Afternoon (14:00 - 17:00 EAT)', label: 'Afternoon', time: '14:00 – 17:00', icon: 'partly-sunny-outline' as const },
  { id: 'Evening (17:00 - 20:00 EAT)', label: 'Evening', time: '17:00 – 20:00', icon: 'moon-outline' as const },
];

const CONSULTATION_CHANNELS = [
  { id: 'WhatsApp Voice/Video', label: 'WhatsApp', icon: 'logo-whatsapp' as const },
  { id: 'Direct Phone Dial', label: 'Phone Call', icon: 'call-outline' as const },
  { id: 'In-Person Office', label: 'In-Person', icon: 'business-outline' as const },
  { id: 'Virtual Video Meet', label: 'Virtual Meet', icon: 'videocam-outline' as const },
];

export default function ServiceDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user, token } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Inquiry & Editing State
  const [existingInquiry, setExistingInquiry] = useState<ServiceInquiry | null>(null);
  const [loadingInquiry, setLoadingInquiry] = useState(false);

  // Inquiry Modal State
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [contactEmail, setContactEmail] = useState(user?.email ?? '');
  const [contactPhone, setContactPhone] = useState(user?.phone ?? '');
  const [contactWhatsapp, setContactWhatsapp] = useState(user?.phone ?? '');
  const [selectedTimeframe, setSelectedTimeframe] = useState(TIMEFRAMES[1]);
  const [selectedSlot, setSelectedSlot] = useState(APPOINTMENT_SLOTS[0].id);
  const [selectedChannel, setSelectedChannel] = useState(CONSULTATION_CHANNELS[0].id);
  const [message, setMessage] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

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

  // Load existing inquiry for current user if available
  const loadMyInquiry = React.useCallback(async () => {
    if (!id) return;
    try {
      setLoadingInquiry(true);
      const inq = await contentApi.getMyServiceInquiry(id, token, user?.email);
      if (inq) {
        setExistingInquiry(inq);
        setFullName(inq.fullName || user?.name || '');
        setContactEmail(inq.contactEmail || user?.email || '');
        if (inq.contactPhone) setContactPhone(inq.contactPhone);
        if (inq.contactWhatsapp) setContactWhatsapp(inq.contactWhatsapp);
        if (inq.timeframe) {
          if (inq.timeframe.includes('•')) {
            const parts = inq.timeframe.split('•').map((p) => p.trim());
            if (parts[0]) setSelectedTimeframe(parts[0]);
            if (parts[1]) setSelectedSlot(parts[1]);
          } else {
            setSelectedTimeframe(inq.timeframe);
          }
        }
        if (inq.message) {
          const match = inq.message.match(/^\[Channel:\s*([^\]]+)\]\s*/i);
          if (match) {
            setSelectedChannel(match[1].trim());
            setMessage(inq.message.slice(match[0].length).trim());
          } else {
            setMessage(inq.message);
          }
        }
      } else {
        setExistingInquiry(null);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoadingInquiry(false);
    }
  }, [id, token, user?.email, user?.name, user?.phone]);

  useEffect(() => {
    loadMyInquiry();
  }, [loadMyInquiry]);

  // Sync user details if user context updates
  useEffect(() => {
    if (user && !existingInquiry) {
      if (!fullName) setFullName(user.name);
      if (!contactEmail) setContactEmail(user.email);
      if (!contactPhone && user.phone) setContactPhone(user.phone);
      if (!contactWhatsapp && user.phone) setContactWhatsapp(user.phone);
    }
  }, [user, existingInquiry]);

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
    const rawNumber = service?.phone || service?.whatsapp || '+251911234567';
    const cleaned = rawNumber.replace(/[^0-9+]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    const rawNumber = service?.whatsapp || service?.phone || '+251911234567';
    const cleaned = rawNumber.replace(/[^0-9+]/g, '');
    const defaultText = encodeURIComponent(
      `Hello ${service?.name}, I found your service on DALEEL Diaspora Concierge and would like to schedule a consultation / appointment.`
    );
    const appUrl = `whatsapp://send?phone=${cleaned}&text=${defaultText}`;
    Linking.canOpenURL(appUrl).then((supported) => {
      if (supported) {
        Linking.openURL(appUrl);
      } else {
        Linking.openURL(`https://wa.me/${cleaned.replace('+', '')}?text=${defaultText}`);
      }
    }).catch(() => {
      Linking.openURL(`https://wa.me/${cleaned.replace('+', '')}?text=${defaultText}`);
    });
  };

  const handleSubmitInquiry = async () => {
    if (!fullName.trim() || !contactEmail.trim() || !message.trim()) {
      setInquiryError('Please provide your full name, email address, and inquiry message.');
      return;
    }

    if (!service) return;

    setInquiryError(null);
    setSubmittingInquiry(true);
    try {
      const fullTimeframe = `${selectedTimeframe} • ${selectedSlot}`;
      const fullMessage = `[Channel: ${selectedChannel}]\n\n${message.trim()}`;
      const payload: ServiceInquiryPayload = {
        fullName: fullName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim() || undefined,
        contactWhatsapp: contactWhatsapp.trim() || undefined,
        timeframe: fullTimeframe,
        message: fullMessage,
      };

      if (existingInquiry) {
        const res = await contentApi.updateServiceInquiry(existingInquiry.id, payload, token);
        if (res?.inquiry) {
          setExistingInquiry(res.inquiry);
        }
      } else {
        const res = await contentApi.createInquiry(service.id, payload, token);
        if (res?.inquiry) {
          setExistingInquiry(res.inquiry);
        }
      }
      setInquirySuccess(true);
      setTimeout(() => {
        setInquirySuccess(false);
        setInquiryModalVisible(false);
        setInquiryError(null);
      }, 2000);
    } catch (err: any) {
      setInquiryError(err?.message || 'Could not submit inquiry at this moment. You can contact them directly via WhatsApp or phone.');
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
          {/* Active Inquiry Card (if user previously submitted) */}
          {existingInquiry && (
            <TouchableOpacity
              style={styles.activeInquiryBanner}
              onPress={() => setInquiryModalVisible(true)}
              activeOpacity={0.88}
            >
              <View style={styles.activeInquiryIconCircle}>
                <Ionicons name="document-text" size={20} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.activeInquiryHeaderRow}>
                  <Text style={styles.activeInquiryTitle}>Your Formal Inquiry</Text>
                  <View
                    style={[
                      styles.statusPill,
                      existingInquiry.status === 'confirmed'
                        ? styles.statusPillConfirmed
                        : existingInquiry.status === 'cancelled'
                        ? styles.statusPillCancelled
                        : styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        existingInquiry.status === 'confirmed'
                          ? styles.statusPillTextConfirmed
                          : existingInquiry.status === 'cancelled'
                          ? styles.statusPillTextCancelled
                          : styles.statusPillTextPending,
                      ]}
                    >
                      {existingInquiry.status === 'pending'
                        ? 'IN REVIEW'
                        : existingInquiry.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activeInquirySub} numberOfLines={2}>
                  {existingInquiry.timeframe ? `Timeframe: ${existingInquiry.timeframe} • ` : ''}
                  {existingInquiry.message}
                </Text>
                <View style={styles.activeInquiryActionRow}>
                  <Text style={styles.activeInquiryActionLink}>Tap to review or edit your inquiry</Text>
                  <Ionicons name="pencil" size={13} color={colors.goldRich} />
                </View>
              </View>
            </TouchableOpacity>
          )}

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
              <Text style={styles.quickActionSub}>Instant Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={handleCall} activeOpacity={0.85}>
              <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(7, 21, 43, 0.1)' }]}>
                <Ionicons name="call" size={19} color={colors.navy} />
              </View>
              <Text style={styles.quickActionLabel}>Call Partner</Text>
              <Text style={styles.quickActionSub}>{service.phone ? 'Direct Dial' : 'Phone Line'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => setInquiryModalVisible(true)}
              activeOpacity={0.85}
            >
              <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(223, 183, 108, 0.18)' }]}>
                <Ionicons name="calendar" size={19} color={colors.goldRich} />
              </View>
              <Text style={styles.quickActionLabel}>Appointment</Text>
              <Text style={styles.quickActionSub}>Book Time Slot</Text>
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

          {/* Location & Navigation Map */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="map-outline" size={18} color={colors.goldRich} />
              <Text style={styles.sectionTitle}>Office Location & Navigation</Text>
            </View>
            <LocationCard
              title={service.name}
              region={service.location}
              address={service.address || `${service.location}, Ethiopia`}
              latitude={service.latitude}
              longitude={service.longitude}
              style={{ marginTop: 8 }}
            />
          </View>

          {/* Diaspora Community Reviews & Ratings */}
          <ReviewsSection
            targetType="service"
            targetId={service.id}
            targetName={service.name}
          />

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar with WhatsApp, Call, and Appointment Booking */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.whatsAppBottomBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
          <Ionicons name="logo-whatsapp" size={17} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.whatsAppBottomText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.callBottomBtn} onPress={handleCall} activeOpacity={0.85}>
          <Ionicons name="call" size={16} color={colors.navy} style={{ marginRight: 4 }} />
          <Text style={styles.callBottomText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.inquiryBottomBtn, existingInquiry && styles.inquiryBottomBtnEdit]}
          onPress={() => setInquiryModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={existingInquiry ? 'create-outline' : 'calendar-outline'}
            size={16}
            color={colors.navy}
            style={{ marginRight: 5 }}
          />
          <Text style={styles.inquiryBottomText}>
            {existingInquiry ? 'Edit Booking' : 'Book Appointment'}
          </Text>
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
                <Text style={styles.modalTitle}>
                  {existingInquiry ? 'Edit Appointment Booking' : 'Appointment & Concierge Booking'}
                </Text>
                <Text style={styles.modalSub}>
                  {existingInquiry
                    ? `Status: ${existingInquiry.status.toUpperCase()} • Update your details`
                    : `Coordinate directly with ${service.name}`}
                </Text>
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
                <Text style={styles.successStateTitle}>
                  {existingInquiry ? 'Booking Request Updated!' : 'Appointment Request Dispatched!'}
                </Text>
                <Text style={styles.successStateSub}>
                  {existingInquiry
                    ? 'Your changes have been saved and dispatched to the concierge triage desk.'
                    : `Your appointment request has been forwarded directly to ${service.name} and the DALEEL concierge desk. You will receive confirmation within 24 hours.`}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
                {inquiryError && (
                  <View style={styles.errorNoticeBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.errorNoticeText}>{inquiryError}</Text>
                  </View>
                )}

                {/* Preferred Consultation Channel */}
                <Text style={styles.inputLabel}>Preferred Consultation Channel</Text>
                <View style={styles.channelGrid}>
                  {CONSULTATION_CHANNELS.map((ch) => {
                    const active = selectedChannel === ch.id;
                    return (
                      <TouchableOpacity
                        key={ch.id}
                        style={[styles.channelCard, active && styles.channelCardActive]}
                        onPress={() => setSelectedChannel(ch.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={ch.icon}
                          size={15}
                          color={active ? colors.goldRich : colors.charcoalSub}
                          style={{ marginRight: 5 }}
                        />
                        <Text style={[styles.channelCardText, active && styles.channelCardTextActive]}>
                          {ch.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Preferred Appointment Slot */}
                <Text style={styles.inputLabel}>Preferred Time Slot (Ethiopia EAT)</Text>
                <View style={styles.slotGrid}>
                  {APPOINTMENT_SLOTS.map((slot) => {
                    const active = selectedSlot === slot.id;
                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[styles.slotCard, active && styles.slotCardActive]}
                        onPress={() => setSelectedSlot(slot.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={slot.icon}
                          size={14}
                          color={active ? colors.goldRich : colors.charcoalSub}
                          style={{ marginRight: 5 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.slotCardLabel, active && styles.slotCardLabelActive]}>
                            {slot.label}
                          </Text>
                          <Text style={styles.slotCardTime}>{slot.time}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
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

                {/* Requirements Message */}
                <Text style={styles.inputLabel}>Inquiry Details / Scope of Need *</Text>
                <TextInput
                  style={[styles.inputField, styles.textAreaField]}
                  placeholder="Explain your situation, specific documents, dates, or assistance needed in Ethiopia…"
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
                      <Text style={styles.submitInquiryText}>
                        {existingInquiry ? 'Save Updated Booking' : 'Confirm Appointment Request'}
                      </Text>
                      <Ionicons
                        name={existingInquiry ? 'checkmark-circle' : 'calendar'}
                        size={16}
                        color={colors.navy}
                        style={{ marginLeft: 8 }}
                      />
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
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  whatsAppBottomBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: radius.xl,
  },
  whatsAppBottomText: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  callBottomBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: radius.xl,
  },
  callBottomText: {
    fontFamily: fonts.sansBold,
    fontSize: 12.5,
    color: colors.navy,
  },
  inquiryBottomBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 12,
    borderRadius: radius.xl,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  inquiryBottomText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.navy,
  },

  // Consultation Channel & Slot Grids
  channelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  channelCardActive: {
    backgroundColor: '#FEF9EE',
    borderColor: colors.gold,
  },
  channelCardText: {
    fontSize: 12,
    fontFamily: fonts.sansMedium,
    color: colors.charcoalSub,
  },
  channelCardTextActive: {
    fontFamily: fonts.sansSemiBold,
    color: colors.navy,
  },

  slotGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  slotCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotCardActive: {
    backgroundColor: '#FEF9EE',
    borderColor: colors.gold,
  },
  slotCardLabel: {
    fontSize: 11,
    fontFamily: fonts.sansSemiBold,
    color: colors.charcoal,
  },
  slotCardLabelActive: {
    color: colors.navy,
  },
  slotCardTime: {
    fontSize: 9.5,
    fontFamily: fonts.sansRegular,
    color: colors.charcoalSub,
    marginTop: 1,
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
  errorNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  errorNoticeText: {
    fontSize: 13,
    color: '#B91C1C',
    flex: 1,
  },
  activeInquiryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DFB76C',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: spacing.md,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  activeInquiryIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F8F4EC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFB76C',
  },
  activeInquiryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activeInquiryTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.navy,
  },
  activeInquirySub: {
    fontFamily: fonts.sansRegular,
    fontSize: 12,
    color: colors.charcoalSub,
    lineHeight: 16,
    marginBottom: 6,
  },
  activeInquiryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeInquiryActionLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11.5,
    color: colors.goldRich,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillConfirmed: {
    backgroundColor: '#DCFCE7',
  },
  statusPillCancelled: {
    backgroundColor: '#F1F5F9',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPillTextPending: {
    color: '#92400E',
  },
  statusPillTextConfirmed: {
    color: '#166534',
  },
  statusPillTextCancelled: {
    color: '#64748B',
  },
  inquiryBottomBtnEdit: {
    backgroundColor: '#DFB76C',
    borderWidth: 1,
    borderColor: '#B8860B',
  },
});
