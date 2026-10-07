import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { adminApi, AdminApiError } from '../../lib/api';
import { useToast } from '../../lib/toast-context';
import { colors, type, fonts, radius } from '../../theme/tokens';

export default function EventScannerScreen() {
  const { eventId: paramEventId } = useLocalSearchParams<{ eventId?: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(paramEventId || '');
  const [loading, setLoading] = useState(true);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [codeQuery, setCodeQuery] = useState('');
  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [searchAttendee, setSearchAttendee] = useState('');

  // Attendance data
  const [eventData, setEventData] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [attendees, setAttendees] = useState<any[]>([]);

  // Last scan result callout
  const [lastResult, setLastResult] = useState<{
    status: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    guestName?: string;
    tickets?: number;
    passCode?: string;
  } | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadAttendance(selectedEventId);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const evs = await adminApi.getEvents();
      setEvents(evs);
      if (!selectedEventId && evs.length > 0) {
        setSelectedEventId(evs[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (eId: string) => {
    try {
      const res = await adminApi.getEventAttendance(eId);
      setEventData(res.event);
      setMetrics(res.metrics);
      setAttendees(res.attendees || []);
    } catch (err: any) {
      console.log('Failed to load attendance:', err);
      // Fallback empty metrics
      setMetrics(null);
      setAttendees([]);
    }
  };

  const handleVerifyCode = async () => {
    const trimmed = codeQuery.trim().toUpperCase();
    if (!trimmed) {
      showToast('Please enter an RSVP or Passcode', 'error');
      return;
    }

    try {
      setSubmittingCode(true);
      setLastResult(null);
      const res = await adminApi.checkInEventPass(trimmed, selectedEventId || undefined);

      setLastResult({
        status: 'success',
        title: 'Pass Verified & Checked In',
        message: res.message || 'Attendee granted entry successfully.',
        guestName: res.rsvp?.fullName || 'Verified Guest',
        tickets: res.rsvp?.ticketsCount || 1,
        passCode: res.rsvp?.passCode || trimmed,
      });

      setCodeQuery('');
      showToast('Attendee checked in successfully', 'success');
      if (selectedEventId) {
        loadAttendance(selectedEventId);
      }
    } catch (err: any) {
      const isAlready = err.reason === 'ALREADY_CHECKED_IN';
      setLastResult({
        status: isAlready ? 'warning' : 'error',
        title: isAlready ? 'Already Checked In' : 'Invalid or Unrecognized Pass',
        message: err.message || 'Ticket could not be validated.',
        guestName: err.rsvp?.fullName,
        tickets: err.rsvp?.ticketsCount,
        passCode: trimmed,
      });
      showToast(err.message || 'Pass verification failed', 'error');
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleUndo = async (rsvpId: string, guestName: string) => {
    Alert.alert(
      'Undo Check-In',
      `Revert gate check-in status for ${guestName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Undo Check-In',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.undoEventCheckIn(rsvpId);
              showToast('Check-in reverted', 'success');
              if (selectedEventId) {
                loadAttendance(selectedEventId);
              }
            } catch (err: any) {
              showToast(err.message || 'Failed to revert check-in', 'error');
            }
          },
        },
      ]
    );
  };

  const filteredAttendees = attendees.filter((a) => {
    const matchesFilter =
      attendeeFilter === 'all'
        ? true
        : attendeeFilter === 'checked_in'
        ? a.status === 'checked_in'
        : a.status !== 'checked_in';

    const q = searchAttendee.toLowerCase().trim();
    const matchesQuery =
      !q ||
      a.fullName?.toLowerCase().includes(q) ||
      a.passCode?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q);

    return matchesFilter && matchesQuery;
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Gate Pass Check-In"
        subtitle={eventData?.title || 'Summit Verification Desk'}
        showBack
        variant="navy"
        badge="GATE DESK"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Event Switcher Strip */}
        {events.length > 1 && (
          <View style={styles.eventPickerContainer}>
            <Text style={styles.pickerLabel}>SELECT SUMMIT / EVENT</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.eventPills}
            >
              {events.map((ev) => {
                const selected = selectedEventId === ev.id;
                return (
                  <TouchableOpacity
                    key={ev.id}
                    style={[styles.eventPill, selected && styles.eventPillSelected]}
                    onPress={() => setSelectedEventId(ev.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.eventPillText, selected && styles.eventPillTextSelected]}
                      numberOfLines={1}
                    >
                      {ev.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Live Attendance Counters */}
        {metrics && (
          <View style={styles.metricsRow}>
            <Card style={styles.metricCard}>
              <Text style={styles.metricNumber}>
                {metrics.checkedInTickets ?? metrics.checkedInCount ?? 0}
              </Text>
              <Text style={styles.metricLabel}>Admitted Tickets</Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={styles.metricNumber}>
                {metrics.totalTickets ?? metrics.totalRsvps ?? 0}
              </Text>
              <Text style={styles.metricLabel}>Total Booked</Text>
            </Card>

            <Card style={styles.metricCard}>
              <Text style={[styles.metricNumber, { color: colors.goldText }]}>
                {metrics.attendanceRate ?? 0}%
              </Text>
              <Text style={styles.metricLabel}>Gate Turnout</Text>
            </Card>
          </View>
        )}

        {/* Verification Card & Passcode Input */}
        <Card style={styles.verifyCard}>
          <Text style={styles.verifyCardTitle}>PASSCODE & TICKET SCANNER</Text>
          <Text style={styles.verifyCardSub}>
            Type or paste the attendee's 8-character passcode (e.g. DL-EVT-4819)
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.passInput}
              value={codeQuery}
              onChangeText={setCodeQuery}
              placeholder="e.g. DL-EVT-XXXX"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleVerifyCode}
            />
            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={handleVerifyCode}
              disabled={submittingCode}
              activeOpacity={0.8}
            >
              {submittingCode ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.verifyBtnText}>Check In</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Scan Result Callout */}
        {lastResult && (
          <View
            style={[
              styles.resultBanner,
              lastResult.status === 'success' && styles.resultSuccess,
              lastResult.status === 'warning' && styles.resultWarning,
              lastResult.status === 'error' && styles.resultError,
            ]}
          >
            <View style={styles.resultIconWrap}>
              <Ionicons
                name={
                  lastResult.status === 'success'
                    ? 'checkmark-circle'
                    : lastResult.status === 'warning'
                    ? 'alert-circle'
                    : 'close-circle'
                }
                size={28}
                color={
                  lastResult.status === 'success'
                    ? colors.success
                    : lastResult.status === 'warning'
                    ? colors.warning
                    : colors.danger
                }
              />
            </View>
            <View style={styles.resultTextWrap}>
              <Text style={styles.resultTitle}>{lastResult.title}</Text>
              <Text style={styles.resultMsg}>{lastResult.message}</Text>
              {lastResult.guestName && (
                <Text style={styles.resultGuest}>
                  Guest: {lastResult.guestName} ({lastResult.tickets} Ticket{lastResult.tickets !== 1 ? 's' : ''})
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Attendee Roster Section */}
        <View style={styles.rosterHeader}>
          <Text style={styles.sectionHeading}>REGISTERED ATTENDEES ({filteredAttendees.length})</Text>
        </View>

        {/* Search & Filter Roster */}
        <View style={styles.rosterSearchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              value={searchAttendee}
              onChangeText={setSearchAttendee}
              placeholder="Filter by name, pass code, or email..."
              placeholderTextColor={colors.textTertiary}
            />
            {searchAttendee.length > 0 && (
              <TouchableOpacity onPress={() => setSearchAttendee('')}>
                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(['all', 'checked_in', 'pending'] as const).map((mode) => {
            const active = attendeeFilter === mode;
            const label =
              mode === 'all'
                ? 'All Attendees'
                : mode === 'checked_in'
                ? 'Checked In'
                : 'Pending Arrival';
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setAttendeeFilter(mode)}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Attendee List */}
        {filteredAttendees.length === 0 ? (
          <EmptyState
            title="No Attendees Found"
            description="No matching registered guests for this summit queue."
            icon="people-outline"
          />
        ) : (
          filteredAttendees.map((att) => {
            const isCheckedIn = att.status === 'checked_in';
            return (
              <Card key={att.id} style={styles.attendeeCard}>
                <View style={styles.attendeeRow}>
                  <View style={styles.attendeeInfo}>
                    <View style={styles.attendeeNameRow}>
                      <Text style={styles.attendeeName}>{att.fullName}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isCheckedIn ? styles.statusChecked : styles.statusPending,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isCheckedIn ? styles.statusTextChecked : styles.statusTextPending,
                          ]}
                        >
                          {isCheckedIn ? 'ADMITTED' : 'NOT ARRIVED'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.attendeeEmail}>{att.email}</Text>

                    <View style={styles.passCodeBadge}>
                      <Ionicons name="ticket-outline" size={12} color={colors.goldText} />
                      <Text style={styles.passCodeText}>Code: {att.passCode}</Text>
                      <Text style={styles.ticketCount}>• {att.ticketsCount} Ticket(s)</Text>
                    </View>
                  </View>

                  {/* Action */}
                  <View style={styles.attendeeActions}>
                    {isCheckedIn ? (
                      <TouchableOpacity
                        style={styles.undoBtn}
                        onPress={() => handleUndo(att.id, att.fullName)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="arrow-undo" size={14} color={colors.textSecondary} />
                        <Text style={styles.undoBtnText}>Undo</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.quickAdmitBtn}
                        onPress={() => {
                          setCodeQuery(att.passCode);
                          handleVerifyCode();
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        <Text style={styles.quickAdmitText}>Admit</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  eventPickerContainer: {
    marginBottom: 14,
  },
  pickerLabel: {
    ...type.tiny,
    fontFamily: fonts.sansBold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 2,
  },
  eventPills: {
    gap: 8,
  },
  eventPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventPillSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.gold,
  },
  eventPillText: {
    ...type.caption,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  eventPillTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricNumber: {
    ...type.h2,
    fontFamily: fonts.sansBold,
    color: colors.textPrimary,
  },
  metricLabel: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  verifyCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderColor: 'rgba(223, 183, 108, 0.4)',
    borderWidth: 1.5,
  },
  verifyCardTitle: {
    ...type.caption,
    fontFamily: fonts.sansBold,
    color: colors.goldText,
    letterSpacing: 1,
  },
  verifyCardSub: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 3,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  passInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: fonts.sansBold,
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: radius.md,
    gap: 6,
  },
  verifyBtnText: {
    ...type.body,
    fontFamily: fonts.sansBold,
    color: '#FFFFFF',
  },
  resultBanner: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  resultSuccess: {
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    borderWidth: 1,
    borderColor: colors.success,
  },
  resultWarning: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
    borderWidth: 1,
    borderColor: colors.warning,
  },
  resultError: {
    backgroundColor: 'rgba(214, 48, 49, 0.12)',
    borderWidth: 1,
    borderColor: colors.danger,
  },
  resultIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextWrap: {
    flex: 1,
  },
  resultTitle: {
    ...type.body,
    fontFamily: fonts.sansBold,
    color: colors.textPrimary,
  },
  resultMsg: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultGuest: {
    ...type.caption,
    fontFamily: fonts.sansSemiBold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  rosterHeader: {
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHeading: {
    ...type.tiny,
    fontFamily: fonts.sansBold,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginLeft: 2,
  },
  rosterSearchRow: {
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: fonts.sansRegular,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  filterPillText: {
    ...type.tiny,
    fontFamily: fonts.sansMedium,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.sansBold,
  },
  attendeeCard: {
    padding: 12,
    marginBottom: 10,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attendeeName: {
    ...type.body,
    fontFamily: fonts.sansSemiBold,
    color: colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  statusChecked: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
  },
  statusPending: {
    backgroundColor: 'rgba(243, 156, 18, 0.15)',
  },
  statusBadgeText: {
    ...type.tiny,
    fontSize: 10,
    fontFamily: fonts.sansBold,
  },
  statusTextChecked: {
    color: colors.success,
  },
  statusTextPending: {
    color: colors.warning,
  },
  attendeeEmail: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },
  passCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  passCodeText: {
    ...type.tiny,
    fontFamily: fonts.sansBold,
    color: colors.textPrimary,
  },
  ticketCount: {
    ...type.tiny,
    color: colors.textSecondary,
  },
  attendeeActions: {
    marginLeft: 10,
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  undoBtnText: {
    ...type.tiny,
    color: colors.textSecondary,
    fontFamily: fonts.sansMedium,
  },
  quickAdmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: colors.gold,
    gap: 4,
  },
  quickAdmitText: {
    ...type.tiny,
    fontFamily: fonts.sansBold,
    color: colors.navy,
  },
});
