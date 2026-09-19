import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  RefreshCw,
  ArrowLeft,
  Clock,
  Ticket,
  Check,
  Undo2,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { adminApi } from '../api';
import { useToast } from '../context/ToastContext';

interface EventCheckInDeskProps {
  initialEventId?: string | null;
  onBack?: () => void;
}

interface AttendanceMetrics {
  totalRsvps: number;
  totalTickets: number;
  checkedInCount: number;
  checkedInTickets: number;
  remainingTickets: number;
  confirmedCount: number;
  pendingCount: number;
  cancelledCount: number;
  attendanceRate: number;
  capacity: number | null;
}

interface AttendeeItem {
  id: string;
  passCode: string;
  fullName: string;
  email: string;
  phone?: string | null;
  ticketsCount: number;
  notes?: string | null;
  status: string;
  createdAt: string;
}

interface ScanResult {
  status: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  rsvp?: any;
  timestamp: string;
}

// Synthesized audio feedback via Web Audio API (no external file dependencies)
function playFeedbackAudio(type: 'success' | 'warning' | 'error') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.35);
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

export const EventCheckInDesk: React.FC<EventCheckInDeskProps> = ({
  initialEventId,
  onBack,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || '');
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [metrics, setMetrics] = useState<AttendanceMetrics>({
    totalRsvps: 0,
    totalTickets: 0,
    checkedInCount: 0,
    checkedInTickets: 0,
    remainingTickets: 0,
    confirmedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    attendanceRate: 0,
    capacity: null,
  });
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual Check-In Input
  const [manualCode, setManualCode] = useState('');
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef(false);

  // Scan Result Banner
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Attendee Table Search & Filter
  const [tableSearch, setTableSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'checked_in' | 'awaiting'>('all');

  // Load all events for selector
  useEffect(() => {
    async function loadEventsList() {
      try {
        const data = await adminApi.getEvents();
        setEvents(data || []);
        if (!selectedEventId && data && data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    }
    loadEventsList();
  }, []);

  // Fetch Attendance Data when selectedEventId changes
  const fetchAttendance = useCallback(async () => {
    if (!selectedEventId) return;
    try {
      setIsRefreshing(true);
      const res = await adminApi.getEventAttendance(selectedEventId);
      if (res) {
        setEventDetails(res.event);
        setMetrics(res.metrics);
        setAttendees(res.attendees || []);
      }
    } catch (err: any) {
      console.error('Error fetching attendance:', err);
      toastError(err.message || 'Failed to fetch attendance data');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedEventId, toastError]);

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendance();
    }
  }, [selectedEventId, fetchAttendance]);

  // Handle Pass Verification (Used by both camera & manual input)
  const handleProcessCheckIn = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setIsSubmittingCheckIn(true);
    const now = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });

    try {
      const res = await adminApi.checkInEventPass(codeToVerify.trim(), selectedEventId);
      if (res && res.success) {
        playFeedbackAudio('success');
        setScanResult({
          status: 'success',
          title: 'ADMISSION GRANTED • PASS VERIFIED',
          message: `${res.rsvp?.fullName || 'Guest'} (${res.rsvp?.ticketsCount || 1} Tickets)`,
          rsvp: res.rsvp,
          timestamp: now,
        });
        toastSuccess(`Checked in: ${res.rsvp?.fullName} (${res.rsvp?.ticketsCount || 1} tickets)`);
        setManualCode('');
        fetchAttendance();
      }
    } catch (err: any) {
      console.error('Check-in error response:', err);
      const message = err.message || 'Check-in failed';

      if (message.toLowerCase().includes('already checked in')) {
        playFeedbackAudio('warning');
        setScanResult({
          status: 'warning',
          title: 'ALREADY ADMITTED • DUPLICATE ENTRY',
          message: message,
          rsvp: err.rsvp,
          timestamp: now,
        });
      } else {
        playFeedbackAudio('error');
        setScanResult({
          status: 'error',
          title: 'ADMISSION REJECTED',
          message: message,
          timestamp: now,
        });
      }
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  // Camera Scanner Lifecycle
  const startCamera = async () => {
    setCameraError(null);
    setIsStartingCamera(true);

    // Clean up any lingering previous scanner instance safely
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
      html5QrCodeRef.current = null;
    }

    try {
      // 1. Verify Browser Support & Secure Context
      if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        throw new Error('Camera access requires a Secure Context (HTTPS or http://localhost). If you are accessing via an IP address, please navigate to http://localhost:5173.');
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device API is not supported or has been disabled in this browser.');
      }

      // 2. Discover available camera hardware
      let devices: { id: string; label: string }[] = [];
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (camErr: any) {
        console.warn('Html5Qrcode.getCameras warning:', camErr);
      }

      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
      }

      // Determine camera constraint:
      // Desktop webcams reject facingMode: 'environment' before asking for permissions.
      // We prioritize exact hardware ID or ideal environment for mobile back cameras.
      let cameraConfig: any;
      if (selectedCameraId) {
        cameraConfig = selectedCameraId;
      } else if (devices && devices.length > 0) {
        const rear = devices.find((d) => /back|rear|environment/i.test(d.label));
        const chosen = rear || devices[0];
        cameraConfig = chosen.id;
        setSelectedCameraId(chosen.id);
      } else {
        cameraConfig = { facingMode: { ideal: 'environment' } };
      }

      const html5QrCode = new Html5Qrcode('gate-qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!isScanningRef.current) {
            isScanningRef.current = true;
            handleProcessCheckIn(decodedText);
            setTimeout(() => {
              isScanningRef.current = false;
            }, 2500);
          }
        },
        () => {}
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera activation failed:', err);
      let humanMsg = err.message || 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        humanMsg = 'Camera permission was blocked. Click the lock/camera icon in your browser address bar and switch Camera to "Allow", then retry.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || humanMsg.toLowerCase().includes('no camera') || humanMsg.toLowerCase().includes('not found')) {
        humanMsg = 'No camera device detected on this computer. Please connect a webcam or use express pass search below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        humanMsg = 'Camera is in use by another program (e.g. Zoom, Teams, Skype). Please close the other program and retry.';
      } else if (err.name === 'OverconstrainedError') {
        humanMsg = 'The requested camera mode is not supported by your hardware.';
      }
      setCameraError(humanMsg);
      setIsCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
      html5QrCodeRef.current = null;
      setIsCameraActive(false);
    }
  };

  // Upload and scan QR image file directly
  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode('gate-qr-reader');
        html5QrCodeRef.current = scanner;
      }
      const decodedText = await scanner.scanFile(file, false);
      if (decodedText) {
        setCameraError(null);
        handleProcessCheckIn(decodedText);
      }
    } catch (err: any) {
      console.error('File scan error:', err);
      toastError('No valid QR pass code found in that image. Try entering the code manually.');
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Handle Undo Check-In
  const handleUndoCheckIn = async (rsvpId: string, name: string) => {
    if (!window.confirm(`Revert check-in for ${name}? Pass will be returned to Confirmed.`)) return;
    try {
      await adminApi.undoEventCheckIn(rsvpId);
      toastSuccess(`Check-in reverted for ${name}`);
      if (scanResult?.rsvp?.id === rsvpId) {
        setScanResult(null);
      }
      fetchAttendance();
    } catch (err: any) {
      toastError(err.message || 'Failed to revert check-in');
    }
  };

  // Filter Attendees
  const filteredAttendees = attendees.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      a.email.toLowerCase().includes(tableSearch.toLowerCase()) ||
      a.passCode.toLowerCase().includes(tableSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (tableFilter === 'checked_in') {
      return a.status.toLowerCase() === 'checked_in';
    }
    if (tableFilter === 'awaiting') {
      return a.status.toLowerCase() !== 'checked_in' && a.status.toLowerCase() !== 'cancelled';
    }
    return true;
  });

  return (
    <div style={styles.container}>
      {/* Top Header Card */}
      <div style={styles.headerCard}>
        <div style={styles.headerLeft}>
          {onBack && (
            <button
              onClick={() => {
                stopCamera();
                onBack();
              }}
              style={styles.backBtn}
              title="Return to Events Catalog"
            >
              <ArrowLeft size={17} color="#07152B" />
              <span>Back to Catalog</span>
            </button>
          )}

          <div style={styles.brandingBlock}>
            <div style={styles.brandIconCircle}>
              <QrCode size={22} color="#DFB76C" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={styles.brandTitle}>Gate Check-In & Scanner Desk</h2>
                <span style={styles.liveGateBadge}>LIVE GATE</span>
              </div>
              <p style={styles.brandSubtitle}>
                Verify attendee admission passes, scan digital QR codes, and monitor venue capacity
              </p>
            </div>
          </div>
        </div>

        {/* Event Switcher Dropdown */}
        <div style={styles.headerRight}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={styles.selectorLabel}>ACTIVE EVENT VENUE</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={styles.eventSelect}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.city})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchAttendance}
            disabled={isRefreshing}
            style={styles.refreshBtn}
            title="Refresh Attendance Stats"
          >
            <RefreshCw size={17} color={isRefreshing ? '#8C6A21' : '#07152B'} />
          </button>
        </div>
      </div>

      {/* Attendance Telemetry Ribbon */}
      <div style={styles.telemetryGrid}>
        {/* Metric 1: Admitted Guests */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryTopRow}>
            <span style={styles.telemetryLabel}>ADMITTED GUESTS</span>
            <div style={{ ...styles.iconCircleSmall, backgroundColor: '#E8F7ED', color: '#16803C' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={styles.telemetryBigNumRow}>
            <span style={styles.telemetryBigNum}>{metrics.checkedInTickets}</span>
            <span style={styles.telemetrySubNum}>/ {metrics.totalTickets} Expected</span>
          </div>
          <div style={styles.progressBarTrack}>
            <div
              style={{
                ...styles.progressBarFill,
                width: `${Math.min(100, metrics.attendanceRate)}%`,
                backgroundColor: '#16803C',
              }}
            />
          </div>
        </div>

        {/* Metric 2: Attendance Rate */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryTopRow}>
            <span style={styles.telemetryLabel}>ATTENDANCE RATE</span>
            <div style={{ ...styles.iconCircleSmall, backgroundColor: '#F5E8CC', color: '#8C6A21' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={styles.telemetryBigNumRow}>
            <span style={styles.telemetryBigNum}>{metrics.attendanceRate}%</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#16803C' }}>
              {metrics.checkedInCount} Parties In
            </span>
          </div>
          <p style={styles.telemetryFootnote}>
            {metrics.capacity ? `Venue Capacity: ${metrics.capacity} Pax` : 'Open Hall / Festival Area'}
          </p>
        </div>

        {/* Metric 3: Awaiting Arrival */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryTopRow}>
            <span style={styles.telemetryLabel}>AWAITING ARRIVAL</span>
            <div style={{ ...styles.iconCircleSmall, backgroundColor: '#FEF3C7', color: '#B45309' }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={styles.telemetryBigNumRow}>
            <span style={{ ...styles.telemetryBigNum, color: '#B45309' }}>
              {metrics.remainingTickets}
            </span>
            <span style={styles.telemetrySubNum}>Tickets</span>
          </div>
          <p style={styles.telemetryFootnote}>
            {metrics.confirmedCount} Confirmed Parties En Route
          </p>
        </div>

        {/* Metric 4: Total RSVPs */}
        <div style={styles.telemetryCard}>
          <div style={styles.telemetryTopRow}>
            <span style={styles.telemetryLabel}>TOTAL REGISTRATIONS</span>
            <div style={{ ...styles.iconCircleSmall, backgroundColor: '#EFF6FF', color: '#1D4ED8' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={styles.telemetryBigNumRow}>
            <span style={styles.telemetryBigNum}>{metrics.totalRsvps}</span>
            <span style={styles.telemetrySubNum}>Parties</span>
          </div>
          <p style={styles.telemetryFootnote}>
            {eventDetails?.venue ? `${eventDetails.venue}` : 'Venue Gate Reception'}
          </p>
        </div>
      </div>

      {/* Main Check-In 2-Column Interface */}
      <div className="gate-desk-main-grid">
        {/* Left Column: Camera Scanner & Quick Input */}
        <div style={styles.leftCol}>
          <div style={styles.scannerCard}>
            <div style={styles.scannerHeaderRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#8C6A21" />
                <h3 style={styles.sectionHeading}>QR Camera Scanner</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {availableCameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (isCameraActive) {
                        stopCamera().then(() => startCamera());
                      }
                    }}
                    style={styles.cameraSelect}
                    title="Switch Camera Device"
                  >
                    {availableCameras.map((cam) => (
                      <option key={cam.id} value={cam.id}>
                        {cam.label || `Camera ${cam.id.slice(0, 6)}`}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={isCameraActive ? stopCamera : startCamera}
                  style={isCameraActive ? styles.stopCameraBtn : styles.startCameraBtn}
                >
                  {isCameraActive ? (
                    <>
                      <CameraOff size={14} />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <Camera size={14} />
                      <span>Launch Camera</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Camera Viewport */}
            <div style={styles.cameraViewport}>
              <div
                id="gate-qr-reader"
                style={{
                  width: '100%',
                  minHeight: '270px',
                  display: 'block',
                }}
              />

              {!isCameraActive && (
                <div style={styles.cameraIdleOverlay}>
                  <div style={styles.cameraIdleIconCircle}>
                    <QrCode size={30} color="#DFB76C" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '14px', margin: '0 0 4px 0' }}>
                      Camera Scanner Idle
                    </p>
                    <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0, maxWidth: '290px', lineHeight: '16px' }}>
                      Click "Start Camera" to scan attendee mobile passes via your device webcam or tablet camera
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    disabled={isStartingCamera}
                    style={{
                      ...styles.primaryGoldBtn,
                      opacity: isStartingCamera ? 0.7 : 1,
                      cursor: isStartingCamera ? 'wait' : 'pointer',
                    }}
                  >
                    {isStartingCamera ? 'Connecting Camera...' : 'Start Camera'}
                  </button>

                  <label style={styles.uploadPassBtn}>
                    <Upload size={13} style={{ marginRight: 5 }} />
                    <span>Or Select QR Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleScanFile}
                    />
                  </label>
                </div>
              )}

              {cameraError && (
                <div style={styles.cameraErrorOverlay}>
                  <AlertTriangle size={24} color="#F87171" />
                  <p style={{ color: '#FECACA', fontSize: '12px', fontWeight: 600, margin: '6px 0 0 0', textAlign: 'center', lineHeight: '17px', maxWidth: '320px' }}>
                    {cameraError}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={startCamera} style={styles.retryBtn}>
                      Retry Camera
                    </button>
                    <label style={styles.errorUploadBtn}>
                      <Upload size={12} style={{ marginRight: 4 }} />
                      <span>Upload QR File</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleScanFile}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Express Manual Input */}
            <div style={styles.manualInputSection}>
              <label style={styles.manualInputLabel}>
                Express Pass Search / Barcode Gun Input
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProcessCheckIn(manualCode);
                }}
                style={styles.manualForm}
              >
                <div style={styles.inputWithIconWrap}>
                  <Ticket size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter DAL-EVT-XXXX or name..."
                    style={styles.manualTextInput}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingCheckIn || !manualCode.trim()}
                  className="gate-verify-btn"
                  style={{
                    ...styles.verifyBtn,
                    opacity: isSubmittingCheckIn || !manualCode.trim() ? 0.5 : 1,
                  }}
                >
                  {isSubmittingCheckIn ? (
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Verify</span>
                    </>
                  )}
                </button>
              </form>
              <p style={styles.barcodeTipText}>
                Tip: Hardware USB/Bluetooth scanners automatically submit here upon scanning.
              </p>
            </div>
          </div>

          {/* Instant Verification Banner */}
          {scanResult && (
            <div
              style={{
                ...styles.resultBanner,
                ...(scanResult.status === 'success'
                  ? styles.resultSuccess
                  : scanResult.status === 'warning'
                  ? styles.resultWarning
                  : styles.resultError),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      ...styles.resultIconCircle,
                      backgroundColor:
                        scanResult.status === 'success'
                          ? '#10B981'
                          : scanResult.status === 'warning'
                          ? '#F59E0B'
                          : '#EF4444',
                    }}
                  >
                    {scanResult.status === 'success' && <CheckCircle2 size={22} color="#FFFFFF" />}
                    {scanResult.status === 'warning' && <AlertTriangle size={22} color="#FFFFFF" />}
                    {scanResult.status === 'error' && <XCircle size={22} color="#FFFFFF" />}
                  </div>

                  <div>
                    <h4 style={styles.resultTitle}>{scanResult.title}</h4>
                    <p style={styles.resultMessage}>{scanResult.message}</p>
                    {scanResult.rsvp && (
                      <div style={styles.resultMetaRow}>
                        <span style={styles.resultPassPill}>
                          {scanResult.rsvp.passCode || `DAL-EVT-${scanResult.rsvp.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'inherit', opacity: 0.8 }}>
                          Scanned at {scanResult.timestamp}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {scanResult.rsvp && (
                  <button
                    onClick={() =>
                      handleUndoCheckIn(scanResult.rsvp.id, scanResult.rsvp.fullName || 'Guest')
                    }
                    style={styles.resultUndoBtn}
                    title="Undo Check-In"
                  >
                    <Undo2 size={13} />
                    <span>Undo</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Attendee Roster Table */}
        <div style={styles.rosterCard}>
          <div style={styles.rosterHeaderRow}>
            <div>
              <h3 style={styles.sectionHeading}>Live Attendee Roster</h3>
              <p style={{ fontSize: '12px', color: '#5A687A', margin: '2px 0 0 0' }}>
                {attendees.length} Registered Parties ({metrics.totalTickets} Tickets)
              </p>
            </div>

            {/* Segmented Filter Pills */}
            <div style={styles.filterPillsRow}>
              <button
                type="button"
                style={{
                  ...styles.filterPillBtn,
                  ...(tableFilter === 'all' ? styles.filterPillBtnActive : {}),
                }}
                onClick={() => setTableFilter('all')}
              >
                All ({attendees.length})
              </button>
              <button
                type="button"
                style={{
                  ...styles.filterPillBtn,
                  ...(tableFilter === 'checked_in'
                    ? { backgroundColor: '#16803C', color: '#FFFFFF', borderColor: '#16803C' }
                    : {}),
                }}
                onClick={() => setTableFilter('checked_in')}
              >
                Checked In ({metrics.checkedInCount})
              </button>
              <button
                type="button"
                style={{
                  ...styles.filterPillBtn,
                  ...(tableFilter === 'awaiting'
                    ? { backgroundColor: '#B45309', color: '#FFFFFF', borderColor: '#B45309' }
                    : {}),
                }}
                onClick={() => setTableFilter('awaiting')}
              >
                Awaiting ({metrics.confirmedCount + metrics.pendingCount})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div style={styles.rosterSearchWrap}>
            <Search size={16} color="#8A9AA8" style={{ position: 'absolute', left: '12px' }} />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search by attendee name, email, or pass code..."
              style={styles.rosterSearchInput}
            />
          </div>

          {/* Table Container */}
          <div style={styles.tableContainer}>
            <table style={styles.rosterTable}>
              <thead>
                <tr style={styles.tableHeadRow}>
                  <th style={styles.th}>Pass Code</th>
                  <th style={styles.th}>Attendee</th>
                  <th style={styles.th}>Tickets</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={styles.emptyTd}>
                      No attendees found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map((att) => {
                    const isCheckedIn = att.status.toLowerCase() === 'checked_in';
                    const isCancelled =
                      att.status.toLowerCase() === 'cancelled' ||
                      att.status.toLowerCase() === 'rejected';

                    return (
                      <tr
                        key={att.id}
                        className="gate-roster-row"
                        style={{
                          ...styles.tableRow,
                          backgroundColor: isCheckedIn ? 'rgba(22, 128, 60, 0.03)' : '#FFFFFF',
                        }}
                      >
                        <td style={styles.tdCode}>{att.passCode}</td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 700, color: '#07152B' }}>{att.fullName}</div>
                          <div style={{ fontSize: '11px', color: '#8A9AA8' }}>{att.email}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ fontWeight: 700, color: '#07152B' }}>{att.ticketsCount}</span>{' '}
                          <span style={{ color: '#8A9AA8' }}>Pax</span>
                        </td>
                        <td style={styles.td}>
                          {isCheckedIn ? (
                            <span style={styles.badgeCheckedIn}>
                              <CheckCircle2 size={12} />
                              <span>Checked In</span>
                            </span>
                          ) : isCancelled ? (
                            <span style={styles.badgeCancelled}>
                              <XCircle size={12} />
                              <span>Cancelled</span>
                            </span>
                          ) : (
                            <span style={styles.badgeConfirmed}>
                              <Clock size={12} />
                              <span>Confirmed</span>
                            </span>
                          )}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          {isCheckedIn ? (
                            <button
                              onClick={() => handleUndoCheckIn(att.id, att.fullName)}
                              style={styles.undoBtn}
                              title="Revert check-in status"
                            >
                              Undo
                            </button>
                          ) : isCancelled ? (
                            <span style={{ color: '#8A9AA8', fontSize: '11.5px', fontStyle: 'italic' }}>
                              Denied
                            </span>
                          ) : (
                            <button
                              onClick={() => handleProcessCheckIn(att.id)}
                              className="gate-admit-btn"
                              style={styles.admitBtn}
                            >
                              Admit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerCard: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.04)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    minWidth: '280px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#07152B',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  brandingBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  brandIconCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    backgroundColor: '#07152B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(7, 21, 43, 0.15)',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#07152B',
    margin: 0,
    letterSpacing: '-0.01em',
  },
  liveGateBadge: {
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '10.5px',
    fontWeight: 800,
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    color: '#8C6A21',
    border: '1px solid rgba(223, 183, 108, 0.4)',
    letterSpacing: '0.04em',
  },
  brandSubtitle: {
    fontSize: '12px',
    color: '#5A687A',
    margin: '2px 0 0 0',
    fontWeight: 500,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
  },
  selectorLabel: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#8A9AA8',
    letterSpacing: '0.06em',
  },
  eventSelect: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    padding: '9px 14px',
    fontSize: '13.5px',
    fontWeight: 650,
    color: '#07152B',
    cursor: 'pointer',
    minWidth: '240px',
    outline: 'none',
  },
  refreshBtn: {
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #E4E9F0',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  telemetryCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.04)',
    display: 'flex',
    flexDirection: 'column',
  },
  telemetryTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  telemetryLabel: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    color: '#8A9AA8',
  },
  iconCircleSmall: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryBigNumRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  telemetryBigNum: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#07152B',
  },
  telemetrySubNum: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#8A9AA8',
  },
  progressBarTrack: {
    width: '100%',
    height: '6px',
    borderRadius: '999px',
    backgroundColor: '#F1F5F9',
    marginTop: '12px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.4s ease',
  },
  telemetryFootnote: {
    fontSize: '12px',
    color: '#5A687A',
    margin: '10px 0 0 0',
    fontWeight: 500,
  },
  mainGrid: {
    display: 'grid',
    gap: '24px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  scannerCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '16px',
    padding: '22px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  scannerHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeading: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#07152B',
    margin: 0,
  },
  cameraSelect: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '11.5px',
    fontWeight: 650,
    color: '#07152B',
    outline: 'none',
    maxWidth: '170px',
  },
  startCameraBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#07152B',
    color: '#DFB76C',
    padding: '7px 13px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  stopCameraBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#FFF0F0',
    color: '#D63031',
    border: '1px solid #FED7D7',
    padding: '7px 13px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  cameraViewport: {
    position: 'relative',
    borderRadius: '14px',
    overflow: 'hidden',
    backgroundColor: '#07152B',
    border: '1.5px dashed #CBD5E1',
    minHeight: '260px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIdleOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: '#07152B',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '20px',
    zIndex: 2,
  },
  cameraIdleContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '24px',
  },
  uploadPassBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#E2E8F0',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '8px',
    padding: '6px 14px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background-color 0.2s',
  },
  errorUploadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#FFFFFF',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '11.5px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cameraIdleIconCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryGoldBtn: {
    backgroundColor: '#DFB76C',
    color: '#07152B',
    padding: '8px 18px',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: 800,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(223, 183, 108, 0.3)',
  },
  cameraErrorOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  retryBtn: {
    marginTop: '10px',
    backgroundColor: '#FFFFFF',
    color: '#D63031',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '11.5px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  manualInputSection: {
    borderTop: '1px solid #F1F5F9',
    paddingTop: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  manualInputLabel: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#07152B',
  },
  manualForm: {
    display: 'flex',
    gap: '8px',
  },
  inputWithIconWrap: {
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  manualTextInput: {
    width: '100%',
    padding: '9px 14px 9px 36px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    fontSize: '13.5px',
    fontFamily: 'monospace',
    color: '#07152B',
    fontWeight: 700,
    outline: 'none',
  },
  verifyBtn: {
    backgroundColor: '#07152B',
    color: '#DFB76C',
    padding: '9px 16px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '12.5px',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  barcodeTipText: {
    fontSize: '11px',
    color: '#8A9AA8',
    margin: 0,
  },
  resultBanner: {
    borderRadius: '14px',
    padding: '18px 20px',
    boxShadow: '0 2px 10px rgba(7, 21, 43, 0.06)',
  },
  resultSuccess: {
    backgroundColor: '#ECFDF5',
    border: '1.5px solid #10B981',
    color: '#064E3B',
  },
  resultWarning: {
    backgroundColor: '#FFFBEB',
    border: '1.5px solid #F59E0B',
    color: '#78350F',
  },
  resultError: {
    backgroundColor: '#FEF2F2',
    border: '1.5px solid #EF4444',
    color: '#7F1D1D',
  },
  resultIconCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resultTitle: {
    fontSize: '13px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    margin: 0,
  },
  resultMessage: {
    fontSize: '13.5px',
    fontWeight: 650,
    margin: '3px 0 0 0',
  },
  resultMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '6px',
  },
  resultPassPill: {
    fontFamily: 'monospace',
    fontWeight: 800,
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid currentColor',
  },
  resultUndoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    backgroundColor: '#FFFFFF',
    color: '#07152B',
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  },
  rosterCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E4E9F0',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(7, 21, 43, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  rosterHeaderRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  filterPillsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    padding: '4px',
  },
  filterPillBtn: {
    padding: '5px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#5A687A',
    transition: 'all 0.2s',
  },
  filterPillBtnActive: {
    backgroundColor: '#07152B',
    color: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(7, 21, 43, 0.1)',
  },
  rosterSearchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  rosterSearchInput: {
    width: '100%',
    padding: '9px 14px 9px 36px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E4E9F0',
    borderRadius: '10px',
    fontSize: '13px',
    color: '#07152B',
    outline: 'none',
  },
  tableContainer: {
    maxHeight: '480px',
    overflowY: 'auto',
    border: '1px solid #E4E9F0',
    borderRadius: '12px',
  },
  rosterTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '12.5px',
  },
  tableHeadRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E4E9F0',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  th: {
    padding: '12px 16px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#8A9AA8',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '12px 16px',
    color: '#07152B',
  },
  tdCode: {
    padding: '12px 16px',
    fontFamily: 'monospace',
    fontWeight: 800,
    color: '#8C6A21',
  },
  emptyTd: {
    padding: '36px',
    textAlign: 'center',
    color: '#8A9AA8',
    fontSize: '13px',
  },
  badgeCheckedIn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 9px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  badgeConfirmed: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 9px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  badgeCancelled: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 9px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  admitBtn: {
    backgroundColor: '#07152B',
    color: '#DFB76C',
    padding: '5px 12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '11.5px',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(7, 21, 43, 0.15)',
  },
  undoBtn: {
    backgroundColor: '#F8FAFC',
    color: '#5A687A',
    padding: '4px 10px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
