import React, { useState, useEffect, useRef } from 'react';
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
import { CameraView, useCameraPermissions } from 'expo-camera';
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

  const [permission, requestPermission] = useCameraPermissions();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(paramEventId || '');
  const [loading, setLoading] = useState(true);
  const [submittingCode, setSubmittingCode] = useState(false);
  const [codeQuery, setCodeQuery] = useState('');
  const [attendeeFilter, setAttendeeFilter] = useState<'all' | 'checked_in' | 'pending'>('all');
  const [searchAttendee, setSearchAttendee] = useState('');

  // Scanner UI States
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('camera');
  const [cameraScanned, setCameraScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const lastScannedTimeRef = useRef<number>(0);

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
      setMetrics(null);
      setAttendees([]);
    }
  };

  const verifyPassCode = async (rawCode: string) => {
    let cleanCode = rawCode.trim();

    // Check if the QR code is JSON or URL encoded
    if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanCode);
        if (parsed.code || parsed.passCode || parsed.id) {
          cleanCode = String(parsed.code || parsed.passCode || parsed.id).trim();
        }
      } catch {}
    } else if (cleanCode.includes('code=')) {
      const match = cleanCode.match(/code=([^&]+)/);
      if (match && match[1]) {
        cleanCode = decodeURIComponent(match[1]).trim();
      }
    }

    cleanCode = cleanCode.toUpperCase();

    if (!cleanCode) {
      showToast('Please enter an RSVP or Passcode', 'error');
      return;
    }

    try {
      setSubmittingCode(true);
      setLastResult(null);
      const res = await adminApi.checkInEventPass(cleanCode, selectedEventId || undefined);

      setLastResult({
        status: 'success',
        title: 'Pass Verified & Checked In',
        message: res.message || 'Attendee granted entry successfully.',
        guestName: res.rsvp?.fullName || 'Verified Guest',
        tickets: res.rsvp?.ticketsCount || 1,
        passCode: res.rsvp?.passCode || cleanCode,
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
        passCode: cleanCode,
      });
      showToast(err.message || 'Pass verification failed', 'error');
    } finally {
      setSubmittingCode(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    const now = Date.now();
    // Throttle duplicate scans within 2 seconds
    if (now - lastScannedTimeRef.current < 2000) return;
    lastScannedTimeRef.current = now;

    setCameraScanned(true);
    verifyPassCode(data);
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

        {/* Mode Switcher: Camera QR Scanner vs Manual Code Entry */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTabBtn, scanMode === 'camera' && styles.modeTabBtnActive]}
            onPress={() => {
              setScanMode('camera');
              setCameraScanned(false);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="camera"
              size={18}
              color={scanMode === 'camera' ? colors.gold : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeTabBtnText,
                scanMode === 'camera' && styles.modeTabBtnTextActive,
              ]}
            >
              Camera QR Scanner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTabBtn, scanMode === 'manual' && styles.modeTabBtnActive]}
            onPress={() => setScanMode('manual')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="keypad-outline"
              size={18}
              color={scanMode === 'manual' ? colors.gold : colors.textSecondary}
            />
            <Text
              style={[
                styles.modeTabBtnText,
                scanMode === 'manual' && styles.modeTabBtnTextActive,
              ]}
            >
              Manual Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* CAMERA SCANNER VIEW */}
        {scanMode === 'camera' && (
          <Card style={styles.cameraContainerCard}>
            {!permission ? (
              <View style={styles.cameraPermissionBox}>
                <ActivityIndicator size="small" color={colors.gold} />
                <Text style={styles.permissionText}>Checking camera access...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.cameraPermissionBox}>
                <View style={styles.cameraIconCircle}>
                  <Ionicons name="camera-reverse-outline" size={32} color={colors.gold} />
                </View>
                <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                <Text style={styles.permissionSub}>
                  DALEEL requires camera access to scan attendee RSVP QR codes at the gate.
                </Text>
                <Button
                  label="Enable Camera Access"
                  onPress={requestPermission}
                  variant="gold"
                  style={styles.grantBtn}
                />
              </View>
            ) : (
              <View style={styles.cameraViewportWrap}>
                <CameraView
                  style={styles.cameraView}
                  facing="back"
                  enableTorch={torchEnabled}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                  onBarcodeScanned={cameraScanned ? undefined : handleBarcodeScanned}
                >
                  {/* Viewfinder Target Graphic */}
                  <View style={styles.cameraOverlay}>
                    <View style={styles.targetFrame}>
                      {/* 4 Golden Corner Reticles */}
                      <View style={[styles.cornerReticle, styles.cornerTL]} />
                      <View style={[styles.cornerReticle, styles.cornerTR]} />
                      <View style={[styles.cornerReticle, styles.cornerBL]} />
                      <View style={[styles.cornerReticle, styles.cornerBR]} />

                      {cameraScanned ? (
                        <View style={styles.scannedSuccessBadge}>
                          <Ionicons name="checkmark-circle" size={48} color={colors.gold} />
                          <Text style={styles.scannedBadgeText}>QR Code Read</Text>
                        </View>
                      ) : (
                        <View style={styles.laserScanLine} />
                      )}
                    </View>
                    <Text style={styles.cameraHint}>
                      Align attendee's DALEEL RSVP QR code inside the frame
                    </Text>
                  </View>
                </CameraView>

                {/* Camera Control Strip */}
                <View style={styles.cameraControlBar}>
                  <TouchableOpacity
                    style={styles.controlIconBtn}
                    onPress={() => setTorchEnabled(!torchEnabled)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={torchEnabled ? 'flash' : 'flash-outline'}
                      size={20}
                      color={torchEnabled ? colors.gold : '#FFFFFF'}
                    />
                    <Text style={styles.controlBtnLabel}>
                      {torchEnabled ? 'Flash ON' : 'Flash OFF'}
                    </Text>
                  </TouchableOpacity>

                  {cameraScanned && (
                    <TouchableOpacity
                      style={styles.resumeScanBtn}
                      onPress={() => setCameraScanned(false)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="scan" size={16} color={colors.navy} />
                      <Text style={styles.resumeScanText}>Scan Next Pass</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* MANUAL PASSCODE ENTRY VIEW */}
        {scanMode === 'manual' && (
          <Card style={styles.verifyCard}>
            <Text style={styles.verifyCardTitle}>MANUAL PASSCODE ENTRY</Text>
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
                onSubmitEditing={() => verifyPassCode(codeQuery)}
              />
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => verifyPassCode(codeQuery)}
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
        )}

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
            {cameraScanned && (
              <TouchableOpacity
                style={styles.nextPassBtn}
                onPress={() => {
                  setCameraScanned(false);
                  setLastResult(null);
                }}
              >
                <Text style={styles.nextPassText}>Next</Text>
              </TouchableOpacity>
            )}
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
                        onPress={() => verifyPassCode(att.passCode)}
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
    fontFamily: fonts.bodyBold,
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
    borderRadius: radius.pill,
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
    fontFamily: fonts.bodyMedium,
  },
  eventPillTextSelected: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  metricLabel: {
    ...type.tiny,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Mode Switcher Tabs
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    gap: 4,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radius.sm,
    gap: 8,
  },
  modeTabBtnActive: {
    backgroundColor: colors.navy,
  },
  modeTabBtnText: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.textSecondary,
  },
  modeTabBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
  },

  // Camera Container Card
  cameraContainerCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000000',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(223, 183, 108, 0.4)',
  },
  cameraPermissionBox: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  cameraIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  permissionTitle: {
    ...type.h3,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  permissionSub: {
    ...type.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
    maxWidth: 280,
  },
  permissionText: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 8,
  },
  grantBtn: {
    minWidth: 200,
  },
  cameraViewportWrap: {
    height: 280,
    position: 'relative',
  },
  cameraView: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 190,
    height: 190,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerReticle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.gold,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 8,
  },
  laserScanLine: {
    width: '80%',
    height: 2,
    backgroundColor: 'rgba(223, 183, 108, 0.75)',
  },
  scannedSuccessBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scannedBadgeText: {
    ...type.caption,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },
  cameraHint: {
    ...type.tiny,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fonts.bodyMedium,
  },
  cameraControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.navyDeep,
  },
  controlIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  controlBtnLabel: {
    ...type.tiny,
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: fonts.bodyMedium,
  },
  resumeScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  resumeScanText: {
    ...type.tiny,
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },

  // Manual Verify Card
  verifyCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.card,
    borderColor: 'rgba(223, 183, 108, 0.4)',
    borderWidth: 1.5,
  },
  verifyCardTitle: {
    ...type.caption,
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // Result Banner
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
    fontFamily: fonts.bodyBold,
    color: colors.textPrimary,
  },
  resultMsg: {
    ...type.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultGuest: {
    ...type.caption,
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
    marginTop: 4,
  },
  nextPassBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.navy,
    borderRadius: radius.sm,
  },
  nextPassText: {
    ...type.tiny,
    fontFamily: fonts.bodyBold,
    color: '#FFFFFF',
  },

  // Roster
  rosterHeader: {
    marginTop: 6,
    marginBottom: 8,
  },
  sectionHeading: {
    ...type.tiny,
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.body,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
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
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.bodySemiBold,
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
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.bodyMedium,
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
    fontFamily: fonts.bodyBold,
    color: colors.navy,
  },
});
