import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { events as sampleEvents } from '../../assets/data/sample';
import { contentApi, EventItem, EventRsvpPayload } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useFavorites } from '../../lib/favorites-context';
import { colors, fonts, radius, spacing } from '../../theme/tokens';

function formatFullDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function EventDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  // RSVP Modal State
  const [rsvpModalVisible, setRsvpModalVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [ticketCount, setTicketCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [registeredRsvpId, setRegisteredRsvpId] = useState('');
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const fav = event ? isFavorite('event', event.id) : false;

  const loadEventDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await contentApi.event(id);
      if (data && data.id) {
        setEvent(data);
      } else {
        const fallback = sampleEvents.find((e) => e.id === id);
        if (fallback) setEvent(fallback);
      }
    } catch (err) {
      console.warn('Failed to load event by id, falling back to sample:', err);
      const fallback = sampleEvents.find((e) => e.id === id);
      if (fallback) setEvent(fallback);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEventDetail();
  }, [loadEventDetail]);

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        title: event.title,
        message: `Join me at ${event.title} in ${event.city}! Details on DALEEL Diaspora App: ${event.venue || event.city} on ${formatFullDate(event.date)}.`,
      });
    } catch (err) {
      console.warn('Error sharing event:', err);
    }
  };

  const handleOpenRsvpModal = () => {
    setFullName(user?.name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setTicketCount(1);
    setNotes('');
    setRsvpError(null);
    setRsvpSuccess(false);
    setRsvpModalVisible(true);
  };

  const handleSubmitRsvp = async () => {
    if (!fullName.trim() || !email.trim()) {
      setRsvpError('Please provide your full name and email address to confirm your pass.');
      return;
    }

    if (!event) return;

    setRsvpError(null);
    setSubmittingRsvp(true);
    try {
      const payload: EventRsvpPayload = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        ticketsCount: ticketCount,
        notes: notes.trim() || undefined,
      };

      const res = await contentApi.createEventRsvp(event.id, payload, token);
      setRegisteredRsvpId(res.rsvp?.id || `pass-${Date.now()}`);
      setRsvpSuccess(true);
      setTimeout(() => {
        setRsvpModalVisible(false);
        setRsvpSuccess(false);
      }, 2600);
    } catch (err: any) {
      setRsvpError(err?.message || 'Could not register RSVP at this moment. Please check your network and try again.');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Loading event details…</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.notFoundContainer}>
        <Ionicons name="calendar-outline" size={56} color={colors.charcoalLight} />
        <Text style={styles.notFoundTitle}>Event Not Found</Text>
        <Text style={styles.notFoundSub}>The gathering you requested could not be located.</Text>
        <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={16} color={colors.navy} />
          <Text style={styles.backHomeBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Parse agenda items
  const agendaItems = event.agenda
    ? event.agenda.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Cover Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.image }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradientOverlay} />

          {/* Floating Top Nav Bar inside Hero */}
          <View style={[styles.floatingNavSafe, { paddingTop: Math.max(insets.top, 24) + 12 }]}>
            <View style={styles.floatingNavRow}>
              <TouchableOpacity
                style={styles.circleNavBtn}
                onPress={() => router.back()}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.rightNavActions}>
                <TouchableOpacity
                  style={styles.circleNavBtn}
                  onPress={handleShare}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="share-social-outline" size={19} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.circleNavBtn, fav && styles.circleNavBtnActive]}
                  onPress={() => toggleFavorite('event', event.id)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={fav ? 'bookmark' : 'bookmark-outline'}
                    size={19}
                    color={fav ? colors.gold : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Hero Bottom Chips */}
          <View style={styles.heroBottomContainer}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{event.category.toUpperCase()}</Text>
            </View>

            {event.verified && (
              <View style={styles.verifiedPill}>
                <Ionicons name="shield-checkmark" size={13} color={colors.gold} style={{ marginRight: 4 }} />
                <Text style={styles.verifiedPillText}>Official Gathering</Text>
              </View>
            )}
          </View>
        </View>

        {/* Main Content Body */}
        <View style={styles.bodyContainer}>
          {/* Title and Organizer */}
          <Text style={styles.eventTitle}>{event.title}</Text>

          {event.organizer && (
            <View style={styles.organizerRow}>
              <Ionicons name="business" size={15} color={colors.goldRich} style={{ marginRight: 6 }} />
              <Text style={styles.organizerText}>Organized by {event.organizer}</Text>
            </View>
          )}

          {/* Key Metrics 4-Box Grid */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Ionicons name="calendar" size={18} color={colors.goldRich} />
              </View>
              <Text style={styles.metricLabel}>DATE</Text>
              <Text style={styles.metricValue} numberOfLines={2}>
                {formatFullDate(event.date)}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Ionicons name="time" size={18} color={colors.goldRich} />
              </View>
              <Text style={styles.metricLabel}>TIME</Text>
              <Text style={styles.metricValue} numberOfLines={2}>
                {event.time || 'All Day'}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Ionicons name="location" size={18} color={colors.goldRich} />
              </View>
              <Text style={styles.metricLabel}>VENUE</Text>
              <Text style={styles.metricValue} numberOfLines={2}>
                {event.venue || event.city}
              </Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <Ionicons name="ticket" size={18} color={colors.goldRich} />
              </View>
              <Text style={styles.metricLabel}>ADMISSION</Text>
              <Text style={styles.metricValue} numberOfLines={2}>
                {event.price || 'Free Admission'}
              </Text>
            </View>
          </View>

          {/* About Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.gold} style={{ marginRight: 8 }} />
              <Text style={styles.sectionHeading}>About The Event</Text>
            </View>
            <Text style={styles.descriptionParagraph}>
              {event.description || event.blurb || 'Join fellow diaspora members, entrepreneurs, and cultural enthusiasts for this landmark Ethiopian gathering.'}
            </Text>
          </View>

          {/* Event Schedule & Agenda Timeline */}
          {agendaItems.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="list-outline" size={18} color={colors.gold} style={{ marginRight: 8 }} />
                <Text style={styles.sectionHeading}>Program & Agenda</Text>
              </View>

              <View style={styles.timelineList}>
                {agendaItems.map((item, idx) => {
                  const parts = item.split(':');
                  const timePrefix = parts.length > 1 ? `${parts[0]}:${parts[1].substring(0, 2)}` : null;
                  const topic = parts.length > 1 ? parts.slice(1).join(':').substring(2).trim() : item;

                  return (
                    <View key={idx} style={styles.timelineRow}>
                      <View style={styles.timelineNode}>
                        <View style={styles.nodeCircle} />
                        {idx < agendaItems.length - 1 && <View style={styles.nodeLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        {timePrefix && <Text style={styles.timelineTime}>{timePrefix.trim()}</Text>}
                        <Text style={styles.timelineTopic}>{topic || item}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Venue & Location Directions */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="map-outline" size={18} color={colors.gold} style={{ marginRight: 8 }} />
              <Text style={styles.sectionHeading}>Venue & Location</Text>
            </View>
            <View style={styles.venueInfoBox}>
              <Ionicons name="navigate-circle" size={32} color={colors.navy} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.venueName}>{event.venue || `${event.city}, Ethiopia`}</Text>
                <Text style={styles.venueCity}>{event.city}, Ethiopia</Text>
              </View>
            </View>
            <Text style={styles.venueNote}>
              Parking facilities, designated ride-hailing drop-offs (Feres, RIDE), and English-speaking concierge desks are available on site.
            </Text>
          </View>

          <View style={{ height: 90 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>TICKETS & ACCESS</Text>
          <Text style={styles.bottomPriceValue} numberOfLines={1}>
            {event.price || 'Free RSVP'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.rsvpMainBtn}
          onPress={handleOpenRsvpModal}
          activeOpacity={0.88}
        >
          <Ionicons name="ticket" size={18} color={colors.navy} style={{ marginRight: 8 }} />
          <Text style={styles.rsvpMainBtnText}>RSVP / Get Pass</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive RSVP Bottom Sheet Modal */}
      <Modal
        visible={rsvpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRsvpModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setRsvpModalVisible(false)}
          />

          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
            <View style={styles.modalHandleBar} />

            {rsvpSuccess ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <Ionicons name="checkmark-circle" size={54} color={colors.success} />
                </View>
                <Text style={styles.successTitle}>RSVP Confirmed!</Text>
                <Text style={styles.successSubtitle}>
                  Your reservation for {event.title} has been confirmed.
                </Text>
                <View style={styles.passIdPill}>
                  <Ionicons name="barcode-outline" size={16} color={colors.navy} style={{ marginRight: 6 }} />
                  <Text style={styles.passIdText}>Pass Reference: {registeredRsvpId.slice(0, 16).toUpperCase()}</Text>
                </View>
                <Text style={styles.successInstruction}>
                  A confirmation has been logged to your account. Present your pass at the attendee check-in desk.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Your Pass</Text>
                  <Text style={styles.modalSubtitle}>
                    Reserve your admission for {event.title}
                  </Text>
                </View>

                {rsvpError && (
                  <View style={styles.errorNoticeBox}>
                    <Ionicons name="alert-circle-outline" size={16} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.errorNoticeText}>{rsvpError}</Text>
                  </View>
                )}

                {/* Ticket Quantity Stepper */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NUMBER OF TICKETS / PASSES</Text>
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={[styles.counterBtn, ticketCount <= 1 && styles.counterBtnDisabled]}
                      onPress={() => setTicketCount((prev) => Math.max(1, prev - 1))}
                      disabled={ticketCount <= 1}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="remove" size={18} color={ticketCount <= 1 ? '#CBD5E0' : colors.navy} />
                    </TouchableOpacity>
                    <Text style={styles.counterValue}>
                      {ticketCount} {ticketCount === 1 ? 'Pass' : 'Passes'}
                    </Text>
                    <TouchableOpacity
                      style={[styles.counterBtn, ticketCount >= 6 && styles.counterBtnDisabled]}
                      onPress={() => setTicketCount((prev) => Math.min(6, prev + 1))}
                      disabled={ticketCount >= 6}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={18} color={ticketCount >= 6 ? '#CBD5E0' : colors.navy} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Attendee Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PRIMARY ATTENDEE FULL NAME *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Eyob Adamu"
                    placeholderTextColor={colors.charcoalSub}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                {/* Attendee Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS (FOR TICKET CONFIRMATION) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. attendee@email.com"
                    placeholderTextColor={colors.charcoalSub}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Phone / WhatsApp */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>PHONE / WHATSAPP (OPTIONAL)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. +251 911 234 567 or +1 202 555 0143"
                    placeholderTextColor={colors.charcoalSub}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Note / Inquiries */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>SPECIAL REQUIREMENTS / NOTES (OPTIONAL)</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputMulti]}
                    placeholder="Dietary preferences, accessibility needs, or organizer notes…"
                    placeholderTextColor={colors.charcoalSub}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, submittingRsvp && styles.modalSubmitBtnDisabled]}
                  onPress={handleSubmitRsvp}
                  disabled={submittingRsvp}
                  activeOpacity={0.88}
                >
                  {submittingRsvp ? (
                    <ActivityIndicator size="small" color={colors.navy} />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color={colors.navy} style={{ marginRight: 8 }} />
                      <Text style={styles.modalSubmitBtnText}>Complete Registration</Text>
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.charcoalSub,
    marginTop: 12,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 20,
    fontFamily: fonts.heading,
    color: colors.charcoal,
    marginTop: 16,
    marginBottom: 6,
  },
  notFoundSub: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    textAlign: 'center',
    marginBottom: 20,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backHomeBtnText: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero Container
  heroContainer: {
    height: 320,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.navy,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 46, 34, 0.42)',
  },
  floatingNavSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  floatingNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleNavBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15, 46, 34, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  circleNavBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.gold,
  },
  rightNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroBottomContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryPillText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
    letterSpacing: 0.5,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 46, 34, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedPillText: {
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    color: colors.gold,
  },

  // Body
  bodyContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontFamily: fonts.heading,
    color: colors.charcoal,
    lineHeight: 30,
    marginBottom: 8,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  organizerText: {
    fontSize: 13.5,
    fontFamily: fonts.bodySemiBold,
    color: colors.charcoalSub,
  },

  // 4-Box Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.07)',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(198, 148, 10, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: colors.charcoalLight,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  metricValue: {
    fontSize: 13.5,
    fontFamily: fonts.bodyBold,
    color: colors.charcoal,
    lineHeight: 18,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.07)',
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: fonts.heading,
    color: colors.charcoal,
  },
  descriptionParagraph: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    lineHeight: 22,
  },

  // Agenda Timeline
  timelineList: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timelineNode: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 4,
  },
  nodeCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold,
  },
  nodeLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(198, 148, 10, 0.3)',
    minHeight: 34,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.goldRich,
    marginBottom: 2,
  },
  timelineTopic: {
    fontSize: 13.5,
    fontFamily: fonts.bodyMedium,
    color: colors.charcoal,
    lineHeight: 19,
  },

  // Venue Info Box
  venueInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 46, 34, 0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  venueName: {
    fontSize: 14.5,
    fontFamily: fonts.bodyBold,
    color: colors.charcoal,
    marginBottom: 2,
  },
  venueCity: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  venueNote: {
    fontSize: 12,
    fontFamily: fonts.body,
    color: colors.charcoalLight,
    lineHeight: 17,
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 25, 28, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: colors.charcoal,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomPriceCol: {
    flex: 1,
    marginRight: 14,
  },
  bottomPriceLabel: {
    fontSize: 10,
    fontFamily: fonts.bodyBold,
    color: colors.charcoalLight,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  bottomPriceValue: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  rsvpMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 16,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  rsvpMainBtnText: {
    fontSize: 14.5,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },

  // Modal Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(23, 25, 28, 0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.heading,
    color: colors.charcoal,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 10.5,
    fontFamily: fonts.bodyBold,
    color: colors.charcoalLight,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: 'rgba(23, 25, 28, 0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.charcoal,
  },
  modalInputMulti: {
    height: 70,
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 25, 28, 0.04)',
    borderRadius: 12,
    padding: 6,
    width: 170,
    justifyContent: 'space-between',
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(23, 25, 28, 0.1)',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterValue: {
    fontSize: 14,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  modalSubmitBtnDisabled: {
    opacity: 0.7,
  },
  modalSubmitBtnText: {
    fontSize: 15,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },

  // Success Confirmation
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(15, 46, 34, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: fonts.heading,
    color: colors.charcoal,
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.charcoalSub,
    textAlign: 'center',
    marginBottom: 16,
  },
  passIdPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(198, 148, 10, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    marginBottom: 16,
  },
  passIdText: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
    letterSpacing: 0.5,
  },
  successInstruction: {
    fontSize: 12.5,
    fontFamily: fonts.body,
    color: colors.charcoalLight,
    textAlign: 'center',
    lineHeight: 18,
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
});
