import React from 'react';
import type { DeviceAccessEvaluation } from '../utils/devicePolicy';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  Maximize2,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface DeviceRestrictionScreenProps {
  evaluation: DeviceAccessEvaluation;
  onReevaluate: () => void;
}

export const DeviceRestrictionScreen: React.FC<DeviceRestrictionScreenProps> = ({
  evaluation,
  onReevaluate,
}) => {
  const { deviceType, orientation, viewportWidth, viewportHeight, minRequiredWidth, denialReason } =
    evaluation;

  const widthProgress = Math.min(100, Math.round((viewportWidth / minRequiredWidth) * 100));

  const renderDenialGuidance = () => {
    switch (denialReason) {
      case 'PHONE_BLOCKED':
        return {
          badge: 'ACCESS RESTRICTED • MOBILE PHONE DETECTED',
          badgeColor: '#EF4444',
          badgeBg: 'rgba(239, 68, 68, 0.12)',
          icon: <Smartphone size={44} color="#EF4444" />,
          title: 'Desktop or Landscape Tablet Required',
          instruction:
            'The DALEEL Business Administration Console is designed for operational governance, multi-column triage desks, live catalog management, and regional GPS coordination. These dense administrative interfaces cannot be safely operated on a smartphone screen.',
          actionHeadline: 'Required Action:',
          actionText:
            'Please switch to a desktop PC, laptop, or tablet in landscape mode to access the management portal.',
          recommendationNotice:
            'Looking for on-the-go access? Use the dedicated DALEEL Native Mobile Apps for field triage and member services.',
        };

      case 'TABLET_PORTRAIT_BLOCKED':
        return {
          badge: 'ORIENTATION REQUIRED • TABLET DETECTED',
          badgeColor: '#DFB76C',
          badgeBg: 'rgba(223, 183, 108, 0.15)',
          icon: <RotateCw size={44} color="#DFB76C" className="animate-spin-slow" />,
          title: 'Please Rotate Your Tablet to Landscape',
          instruction:
            'Tablet hardware is supported, but portrait orientation does not provide sufficient horizontal width for multi-column data tables, side navigation, and interactive mapping coordinates.',
          actionHeadline: 'Required Action:',
          actionText:
            'Rotate your tablet 90° into landscape orientation. This screen will automatically refresh and grant access as soon as your device orientation changes.',
          recommendationNotice: null,
        };

      case 'VIEWPORT_TOO_NARROW':
      default:
        return {
          badge: 'DISPLAY ADJUSTMENT • VIEWPORT TOO NARROW',
          badgeColor: '#DFB76C',
          badgeBg: 'rgba(223, 183, 108, 0.15)',
          icon: <Maximize2 size={44} color="#DFB76C" />,
          title: 'Please Enlarge Your Browser Window',
          instruction: `Your current browser window width is ${viewportWidth}px, which is below the minimum required width of ${minRequiredWidth}px for the ${
            deviceType === 'tablet' ? 'landscape tablet' : 'desktop'
          } interface.`,
          actionHeadline: 'Required Action:',
          actionText: `Maximize your browser window or drag the window edge outward to expand width past ${minRequiredWidth}px. Access will be granted automatically.`,
          recommendationNotice: null,
        };
    }
  };

  const guidance = renderDenialGuidance();

  return (
    <div style={styles.container}>
      {/* Background Accent Gradients */}
      <div style={styles.bgGlowTop} />
      <div style={styles.bgGlowBottom} />

      <div style={styles.card}>
        {/* Brand Crest Header */}
        <div style={styles.brandRow}>
          <div style={styles.logoWrap}>
            <img
              src="/daleel-logo.png"
              alt="DALEEL"
              className="logo-on-dark"
              style={styles.logoImg}
            />
          </div>
          <div>
            <div style={styles.brandTitle}>DALEEL</div>
            <div style={styles.brandSubtitle}>EXECUTIVE CONSOLE ACCESS CONTROL</div>
          </div>
        </div>

        {/* Status Pill */}
        <div style={styles.badgeWrapper}>
          <span
            style={{
              ...styles.statusBadge,
              color: guidance.badgeColor,
              backgroundColor: guidance.badgeBg,
              borderColor: guidance.badgeColor,
            }}
          >
            <ShieldAlert size={13} style={{ marginRight: 6 }} />
            {guidance.badge}
          </span>
        </div>

        {/* Hero Visual Icon */}
        <div style={styles.iconCircle}>{guidance.icon}</div>

        {/* Main Title & Action Instruction */}
        <h1 style={styles.headline}>{guidance.title}</h1>
        <p style={styles.description}>{guidance.instruction}</p>

        {/* Action Callout Box */}
        <div style={styles.actionBox}>
          <div style={styles.actionHeader}>
            <ArrowRight size={15} color="#DFB76C" />
            <span style={styles.actionHeaderText}>{guidance.actionHeadline}</span>
          </div>
          <div style={styles.actionBodyText}>{guidance.actionText}</div>
        </div>

        {/* Width Progress Bar (When Viewport is Narrow) */}
        {denialReason === 'VIEWPORT_TOO_NARROW' && (
          <div style={styles.gaugeContainer}>
            <div style={styles.gaugeHeader}>
              <span style={styles.gaugeLabel}>Current Viewport Width</span>
              <span style={styles.gaugeValue}>
                {viewportWidth}px / {minRequiredWidth}px
              </span>
            </div>
            <div style={styles.progressBarTrack}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width: `${widthProgress}%`,
                  backgroundColor: widthProgress >= 100 ? '#10B981' : '#DFB76C',
                }}
              />
            </div>
            <div style={styles.gaugeSubtext}>
              Expand window width by {Math.max(0, minRequiredWidth - viewportWidth)}px to unlock the interface.
            </div>
          </div>
        )}

        {/* Device Policy Summary Matrix */}
        <div style={styles.matrixCard}>
          <div style={styles.matrixHeader}>Access Policy Requirements</div>
          <div style={styles.matrixRow}>
            <div style={styles.matrixItem}>
              <div style={styles.matrixItemTitle}>
                <Monitor size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <span>Desktop / Laptop</span>
              </div>
              <div style={styles.matrixStatus}>
                <CheckCircle2 size={13} color="#10B981" style={{ marginRight: 4 }} />
                <span style={{ color: '#10B981' }}>Supported (≥ 1024px)</span>
              </div>
            </div>

            <div style={styles.matrixItem}>
              <div style={styles.matrixItemTitle}>
                <Tablet size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <span>Tablet</span>
              </div>
              <div style={styles.matrixStatus}>
                <CheckCircle2 size={13} color="#DFB76C" style={{ marginRight: 4 }} />
                <span style={{ color: '#DFB76C' }}>Landscape Only (≥ 768px)</span>
              </div>
            </div>

            <div style={styles.matrixItem}>
              <div style={styles.matrixItemTitle}>
                <Smartphone size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <span>Mobile Phone</span>
              </div>
              <div style={styles.matrixStatus}>
                <XCircle size={13} color="#EF4444" style={{ marginRight: 4 }} />
                <span style={{ color: '#EF4444' }}>Not Permitted</span>
              </div>
            </div>
          </div>
        </div>

        {/* Device Telemetry Details */}
        <div style={styles.telemetryStrip}>
          <div style={styles.telemetryItem}>
            <span style={styles.telemetryKey}>Detected Device</span>
            <span style={styles.telemetryVal}>{deviceType.toUpperCase()}</span>
          </div>
          <div style={styles.telemetryDivider} />
          <div style={styles.telemetryItem}>
            <span style={styles.telemetryKey}>Orientation</span>
            <span style={styles.telemetryVal}>{orientation.toUpperCase()}</span>
          </div>
          <div style={styles.telemetryDivider} />
          <div style={styles.telemetryItem}>
            <span style={styles.telemetryKey}>Viewport</span>
            <span style={styles.telemetryVal}>
              {viewportWidth} × {viewportHeight}
            </span>
          </div>
        </div>

        {/* Manual Recheck Action */}
        <div style={styles.footerActions}>
          <button type="button" onClick={onReevaluate} style={styles.refreshBtn}>
            <RefreshCw size={14} color="#07152B" style={{ marginRight: 6 }} />
            <span>Re-evaluate Display</span>
          </button>
        </div>

        {/* Security & Cryptographic Boundary Notice */}
        <div style={styles.securityNote}>
          Device access policy is enforced for interface usability and layout suitability. Cryptographic
          authentication remains governed by signed 256-bit JWT authorization tokens.
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#040D1B',
    backgroundImage: `
      radial-gradient(circle at 10% 15%, rgba(223, 183, 108, 0.08) 0%, transparent 40%),
      radial-gradient(circle at 90% 85%, rgba(11, 27, 61, 0.8) 0%, transparent 50%)
    `,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlowTop: {
    position: 'absolute',
    top: -120,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 600,
    height: 300,
    background: 'radial-gradient(ellipse, rgba(223, 183, 108, 0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 500,
    height: 400,
    background: 'radial-gradient(circle, rgba(7, 21, 43, 0.9) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    borderRadius: '20px',
    padding: '36px 32px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(223, 183, 108, 0.08)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    zIndex: 10,
    boxSizing: 'border-box',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  logoWrap: {
    height: '46px',
    width: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    height: '46px',
    width: 'auto',
    maxWidth: '36px',
    objectFit: 'contain',
  },
  brandTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: '22px',
    color: '#FFFFFF',
    letterSpacing: '0.06em',
    lineHeight: 1.1,
    textAlign: 'left',
  },
  brandSubtitle: {
    fontSize: '9px',
    fontWeight: 800,
    color: '#DFB76C',
    letterSpacing: '0.12em',
    marginTop: '2px',
    textAlign: 'left',
  },
  badgeWrapper: {
    marginBottom: '20px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '10.5px',
    fontWeight: 800,
    letterSpacing: '0.08em',
    padding: '5px 14px',
    borderRadius: '9999px',
    border: '1px solid',
  },
  iconCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(223, 183, 108, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
  },
  headline: {
    fontSize: '21px',
    fontWeight: 750,
    color: '#FFFFFF',
    letterSpacing: '-0.01em',
    margin: '0 0 10px 0',
    lineHeight: 1.3,
  },
  description: {
    fontSize: '13px',
    color: '#A0B0C4',
    lineHeight: 1.6,
    margin: '0 0 22px 0',
    maxWidth: '460px',
  },
  actionBox: {
    width: '100%',
    backgroundColor: 'rgba(223, 183, 108, 0.08)',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    borderRadius: '12px',
    padding: '14px 16px',
    textAlign: 'left',
    marginBottom: '20px',
    boxSizing: 'border-box',
  },
  actionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
  },
  actionHeaderText: {
    fontSize: '11.5px',
    fontWeight: 750,
    color: '#DFB76C',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  actionBodyText: {
    fontSize: '12.5px',
    color: '#E2E8F0',
    lineHeight: 1.5,
  },
  gaugeContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '20px',
    boxSizing: 'border-box',
  },
  gaugeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  gaugeLabel: {
    fontSize: '11px',
    fontWeight: 650,
    color: '#94A3B8',
  },
  gaugeValue: {
    fontSize: '12px',
    fontWeight: 750,
    color: '#FFFFFF',
  },
  progressBarTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '6px',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.2s ease, background-color 0.2s ease',
  },
  gaugeSubtext: {
    fontSize: '10.5px',
    color: '#8A9AA8',
    textAlign: 'left',
  },
  matrixCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '18px',
    boxSizing: 'border-box',
  },
  matrixHeader: {
    fontSize: '10.5px',
    fontWeight: 750,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'left',
    marginBottom: '8px',
  },
  matrixRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  matrixItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11.5px',
  },
  matrixItemTitle: {
    display: 'flex',
    alignItems: 'center',
    color: '#E2E8F0',
    fontWeight: 600,
  },
  matrixStatus: {
    display: 'flex',
    alignItems: 'center',
    fontWeight: 700,
    fontSize: '11px',
  },
  telemetryStrip: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '10px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    marginBottom: '20px',
    boxSizing: 'border-box',
  },
  telemetryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  telemetryKey: {
    fontSize: '9.5px',
    fontWeight: 700,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  telemetryVal: {
    fontSize: '12px',
    fontWeight: 750,
    color: '#DFB76C',
  },
  telemetryDivider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerActions: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '9px 20px',
    backgroundColor: '#DFB76C',
    color: '#07152B',
    border: '1px solid #DFB76C',
    borderRadius: '8px',
    fontSize: '12.5px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    boxShadow: '0 4px 12px rgba(223, 183, 108, 0.25)',
  },
  securityNote: {
    fontSize: '10px',
    color: '#5A687A',
    lineHeight: 1.4,
    maxWidth: '440px',
  },
};
