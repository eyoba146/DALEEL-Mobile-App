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
      // Pleasant double chime (C5 -> G5)
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
      // Amber alert double pulse
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
      // Low buzz error
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
    try {
      const html5QrCode = new Html5Qrcode('gate-qr-reader');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (!isScanningRef.current) {
            isScanningRef.current = true;
            handleProcessCheckIn(decodedText);
            // Delay to avoid multi-trigger
            setTimeout(() => {
              isScanningRef.current = false;
            }, 2500);
          }
        },
        () => {}
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Failed to start camera:', err);
      setCameraError('Unable to access camera. Please allow camera permissions or use manual search.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
      setIsCameraActive(false);
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
    <div className="space-y-6">
      {/* Top Breadcrumb & Event Selection Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={() => {
                stopCamera();
                onBack();
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Return to Events Catalog"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#07152B] flex items-center justify-center text-[#DFB76C] shadow-md">
              <QrCode size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#07152B] tracking-tight">
                  Gate Check-In & Scanner Desk
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DFB76C]/20 text-[#8C6A21] border border-[#DFB76C]/40">
                  LIVE GATE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Verify digital admission passes, scan QR codes, and monitor venue capacity
              </p>
            </div>
          </div>
        </div>

        {/* Event Switcher Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[260px]">
            <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1">
              Active Event Venue
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#07152B] focus:outline-none focus:ring-2 focus:ring-[#DFB76C] focus:border-transparent transition-all cursor-pointer"
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
            className="p-2.5 mt-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
            title="Refresh Attendance Stats"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-[#8C6A21]' : ''} />
          </button>
        </div>
      </div>

      {/* Attendance Telemetry Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Admitted Guests */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Admitted Guests
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#07152B]">
              {metrics.checkedInTickets}
            </span>
            <span className="text-sm font-semibold text-slate-400">
              / {metrics.totalTickets} Expected
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.attendanceRate)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Attendance Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#DFB76C]/20 text-[#8C6A21] flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#07152B]">
              {metrics.attendanceRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {metrics.checkedInCount} Parties Checked In
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {metrics.capacity ? `Venue Capacity: ${metrics.capacity} Pax` : 'Open Venue Capacity'}
          </p>
        </div>

        {/* Metric 3: Awaiting Arrival */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Awaiting Arrival
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">
              {metrics.remainingTickets}
            </span>
            <span className="text-sm font-semibold text-slate-400">Tickets</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {metrics.confirmedCount} Confirmed Parties En Route
          </p>
        </div>

        {/* Metric 4: Total RSVPs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Registrations
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#07152B]">
              {metrics.totalRsvps}
            </span>
            <span className="text-sm font-semibold text-slate-400">Parties</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {eventDetails?.venue ? `${eventDetails.venue}` : 'Venue Reception'}
          </p>
        </div>
      </div>

      {/* Main Check-In Scanning Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Camera Scanner & Quick Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-[#8C6A21]" />
                <h2 className="text-base font-bold text-[#07152B]">QR Camera Scanner</h2>
              </div>
              <button
                onClick={isCameraActive ? stopCamera : startCamera}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isCameraActive
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : 'bg-[#07152B] text-[#DFB76C] hover:bg-[#0B1F3D]'
                }`}
              >
                {isCameraActive ? (
                  <>
                    <CameraOff size={14} /> Stop Camera
                  </>
                ) : (
                  <>
                    <Camera size={14} /> Launch Camera
                  </>
                )}
              </button>
            </div>

            {/* Camera Viewport / Placeholder */}
            <div className="relative rounded-xl overflow-hidden bg-slate-900 border-2 border-dashed border-slate-200 min-h-[260px] flex items-center justify-center">
              <div
                id="gate-qr-reader"
                className={`w-full h-full ${!isCameraActive ? 'hidden' : ''}`}
              />

              {!isCameraActive && (
                <div className="p-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#DFB76C] flex items-center justify-center mx-auto">
                    <QrCode size={30} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Camera Scanner Idle</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                      Click "Launch Camera" to scan attendee mobile passes through your device camera
                    </p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-[#DFB76C] text-[#07152B] text-xs font-bold hover:bg-[#c99f57] transition-all shadow-md"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-rose-950/90 flex flex-col items-center justify-center p-4 text-center text-rose-200 space-y-2">
                  <AlertTriangle size={24} className="text-rose-400" />
                  <p className="text-xs font-semibold">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="mt-2 px-3 py-1 bg-white text-rose-900 rounded-lg text-xs font-bold"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Express Manual Pass Verification Bar */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-[#07152B]">
                Express Pass Search / Barcode Gun Input
              </label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProcessCheckIn(manualCode);
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Ticket
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter DAL-EVT-XXXX or name..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-[#07152B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DFB76C] transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingCheckIn || !manualCode.trim()}
                  className="px-4 py-2.5 rounded-xl bg-[#07152B] text-[#DFB76C] font-bold text-xs hover:bg-[#0B1F3D] transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmittingCheckIn ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Check size={14} /> Verify
                    </>
                  )}
                </button>
              </form>
              <p className="text-[11px] text-slate-400">
                Tip: Hardware USB/Bluetooth scanners automatically submit here upon scanning.
              </p>
            </div>
          </div>

          {/* Instant Scan Result Verification Banner */}
          {scanResult && (
            <div
              className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
                scanResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : scanResult.status === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      scanResult.status === 'success'
                        ? 'bg-emerald-600 text-white shadow-emerald-200 shadow-md'
                        : scanResult.status === 'warning'
                        ? 'bg-amber-600 text-white shadow-amber-200 shadow-md'
                        : 'bg-rose-600 text-white shadow-rose-200 shadow-md'
                    }`}
                  >
                    {scanResult.status === 'success' && <CheckCircle2 size={22} />}
                    {scanResult.status === 'warning' && <AlertTriangle size={22} />}
                    {scanResult.status === 'error' && <XCircle size={22} />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm tracking-wide uppercase">
                      {scanResult.title}
                    </h3>
                    <p className="text-sm font-semibold mt-0.5">{scanResult.message}</p>
                    {scanResult.rsvp && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono bg-white/80 px-2 py-0.5 rounded border border-current font-bold">
                          {scanResult.rsvp.passCode || `DAL-EVT-${scanResult.rsvp.id.slice(0, 8).toUpperCase()}`}
                        </span>
                        <span className="font-medium opacity-80">
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
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white/80 hover:bg-white text-slate-700 flex items-center gap-1 shadow-xs transition-colors shrink-0"
                    title="Undo Check-In"
                  >
                    <Undo2 size={12} /> Undo
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Live Attendee Roster Table */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-[#07152B]">
                Live Attendee Roster
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {attendees.length} Total Registered Parties ({metrics.totalTickets} Tickets)
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setTableFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  tableFilter === 'all'
                    ? 'bg-white text-[#07152B] shadow-xs'
                    : 'text-slate-600 hover:text-[#07152B]'
                }`}
              >
                All ({attendees.length})
              </button>
              <button
                onClick={() => setTableFilter('checked_in')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  tableFilter === 'checked_in'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#07152B]'
                }`}
              >
                Checked In ({metrics.checkedInCount})
              </button>
              <button
                onClick={() => setTableFilter('awaiting')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  tableFilter === 'awaiting'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#07152B]'
                }`}
              >
                Awaiting ({metrics.confirmedCount + metrics.pendingCount})
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search by attendee name, email, or pass code..."
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#07152B] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DFB76C] transition-all"
            />
          </div>

          {/* Attendees Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pass Code</th>
                  <th className="py-3 px-4">Attendee</th>
                  <th className="py-3 px-4">Tickets</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
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
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isCheckedIn ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#8C6A21]">
                          {att.passCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#07152B]">{att.fullName}</div>
                          <div className="text-[11px] text-slate-400">{att.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#07152B]">{att.ticketsCount}</span>{' '}
                          <span className="text-slate-400">Pax</span>
                        </td>
                        <td className="py-3 px-4">
                          {isCheckedIn ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 size={12} /> Checked In
                            </span>
                          ) : isCancelled ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <XCircle size={12} /> Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <Clock size={12} /> Confirmed
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isCheckedIn ? (
                            <button
                              onClick={() => handleUndoCheckIn(att.id, att.fullName)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Revert check-in status"
                            >
                              Undo
                            </button>
                          ) : isCancelled ? (
                            <span className="text-slate-400 text-xs italic">Denied</span>
                          ) : (
                            <button
                              onClick={() => handleProcessCheckIn(att.id)}
                              className="px-3 py-1 text-xs font-bold rounded-lg bg-[#07152B] text-[#DFB76C] hover:bg-[#0B1F3D] transition-colors shadow-xs"
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
