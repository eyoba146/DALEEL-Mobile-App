import React, { useState } from 'react';
import type { DeviceAccessEvaluation } from '../utils/devicePolicy';
import {
  Laptop,
  Monitor,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface DeviceRestrictionScreenProps {
  evaluation: DeviceAccessEvaluation;
  onReevaluate: () => void;
}

export const DeviceRestrictionScreen: React.FC<DeviceRestrictionScreenProps> = ({
  evaluation,
  onReevaluate,
}) => {
  const { viewportWidth, minRequiredWidth, denialReason } = evaluation;
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.location.href) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      }
    } catch {
      // Fallback
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    onReevaluate();
    setTimeout(() => setIsRefreshing(false), 650);
  };

  const widthProgress = Math.min(100, Math.round((viewportWidth / minRequiredWidth) * 100));

  const isRotateTablet = denialReason === 'TABLET_PORTRAIT_BLOCKED';
  const isNarrowWindow = denialReason === 'VIEWPORT_TOO_NARROW';

  return (
    <div style={styles.page}>
      {/* Background Lighting Meshes */}
      <div style={styles.gridOverlay} />
      <div style={styles.ambientGlowTop} />
      <div style={styles.ambientGlowCenter} />

      {/* Top Brand Navigation Bar */}
      <header style={styles.header}>
        <div style={styles.brandGroup}>
          <div style={styles.logoWrap}>
            <img src="/daleel-logo.png" alt="DALEEL" style={styles.logoImg} />
          </div>
          <div style={styles.brandDivider} />
          <div style={styles.brandTextGroup}>
            <span style={styles.brandTitle}>DALEEL</span>
            <span style={styles.brandSub}>BUSINESS CONSOLE</span>
          </div>
        </div>

        <div style={styles.headerBadge}>
          <span style={styles.statusDot} />
          <span style={styles.statusBadgeText}>
            {isRotateTablet
              ? 'Orientation Required'
              : isNarrowWindow
              ? 'Display Adjustment'
              : 'Desktop Experience'}
          </span>
        </div>
      </header>

      {/* Main Full-Bleed Body Container */}
      <main style={styles.mainContent}>
        <div style={styles.contentColumn}>
          {/* Hero Device Illustration */}
          <div style={styles.illustrationContainer}>
            <div style={styles.glowAura} />

            {isRotateTablet ? (
              /* Tablet Rotation Visual */
              <div style={styles.rotateIllustration}>
                <svg
                  width="180"
                  height="140"
                  viewBox="0 0 180 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ filter: 'drop-shadow(0 12px 30px rgba(0, 0, 0, 0.45))' }}
                >
                  {/* Tablet Frame */}
                  <rect
                    x="45"
                    y="15"
                    width="90"
                    height="110"
                    rx="14"
                    fill="#081426"
                    stroke="#DFB76C"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                  />
                  {/* Screen Content Mockup */}
                  <rect x="52" y="24" width="76" height="92" rx="8" fill="#040A14" />
                  <rect x="58" y="32" width="30" height="6" rx="3" fill="#DFB76C" fillOpacity="0.8" />
                  <rect x="58" y="44" width="64" height="4" rx="2" fill="#1E3250" />
                  <rect x="58" y="52" width="54" height="4" rx="2" fill="#1E3250" />
                  <rect x="58" y="64" width="64" height="36" rx="4" fill="#0E1E34" />
                  {/* Rotation Indicator Curved Arrow */}
                  <path
                    d="M142 42C154 58 154 82 140 100"
                    stroke="#DFB76C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M136 94L140 102L148 98"
                    stroke="#DFB76C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            ) : isNarrowWindow ? (
              /* Viewport Expand Visual */
              <div style={styles.rotateIllustration}>
                <svg
                  width="200"
                  height="130"
                  viewBox="0 0 200 130"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ filter: 'drop-shadow(0 12px 30px rgba(0, 0, 0, 0.45))' }}
                >
                  {/* Window Frame */}
                  <rect
                    x="25"
                    y="15"
                    width="150"
                    height="95"
                    rx="10"
                    fill="#081426"
                    stroke="#DFB76C"
                    strokeWidth="2"
                    strokeOpacity="0.7"
                  />
                  {/* Header Bar */}
                  <rect x="25" y="15" width="150" height="22" rx="10" fill="#0D1E36" />
                  <circle cx="38" cy="26" r="3" fill="#EF4444" fillOpacity="0.7" />
                  <circle cx="48" cy="26" r="3" fill="#DFB76C" fillOpacity="0.7" />
                  <circle cx="58" cy="26" r="3" fill="#10B981" fillOpacity="0.7" />
                  {/* Mock Window Grid */}
                  <rect x="35" y="47" width="34" height="52" rx="4" fill="#0D1E36" />
                  <rect x="76" y="47" width="88" height="22" rx="4" fill="#0E223D" />
                  <rect x="76" y="75" width="88" height="24" rx="4" fill="#0A182C" />
                  {/* Expand Arrows */}
                  <path
                    d="M10 62L2 62M2 62L6 58M2 62L6 66"
                    stroke="#DFB76C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M190 62L198 62M198 62L194 58M198 62L194 66"
                    stroke="#DFB76C"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            ) : (
              /* Desktop Workstation Visual */
              <div style={styles.rotateIllustration}>
                <svg
                  width="220"
                  height="140"
                  viewBox="0 0 220 140"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ filter: 'drop-shadow(0 16px 36px rgba(0, 0, 0, 0.55))' }}
                >
                  {/* Monitor Display Bezel */}
                  <rect
                    x="20"
                    y="10"
                    width="180"
                    height="104"
                    rx="12"
                    fill="#081426"
                    stroke="#DFB76C"
                    strokeWidth="2"
                    strokeOpacity="0.75"
                  />
                  {/* Screen Glass Area */}
                  <rect x="27" y="17" width="166" height="90" rx="7" fill="#040913" />
                  {/* Miniature DALEEL Dashboard Mockup */}
                  {/* Left Mini Sidebar */}
                  <rect x="31" y="21" width="30" height="82" rx="4" fill="#081528" />
                  <rect x="35" y="27" width="12" height="4" rx="2" fill="#DFB76C" />
                  <rect x="35" y="37" width="22" height="3" rx="1.5" fill="#1C3352" />
                  <rect x="35" y="44" width="18" height="3" rx="1.5" fill="#1C3352" />
                  <rect x="35" y="51" width="20" height="3" rx="1.5" fill="#1C3352" />
                  {/* Main Grid Content */}
                  <rect x="67" y="21" width="60" height="36" rx="4" fill="#0A1C33" />
                  <rect x="131" y="21" width="58" height="36" rx="4" fill="#0A1C33" />
                  {/* Gold Mini Accent Cards */}
                  <circle cx="76" cy="30" r="3" fill="#DFB76C" />
                  <rect x="83" y="29" width="32" height="3" rx="1.5" fill="#FFFFFF" fillOpacity="0.8" />
                  <rect x="76" y="39" width="42" height="8" rx="2" fill="#152B4A" />
                  {/* Lower Triage Table Mockup */}
                  <rect x="67" y="62" width="122" height="41" rx="4" fill="#08162A" />
                  <line x1="67" y1="73" x2="189" y2="73" stroke="#162D4D" strokeWidth="1" />
                  <circle cx="75" cy="80" r="2.5" fill="#10B981" />
                  <rect x="83" y="79" width="46" height="3" rx="1.5" fill="#94A3B8" />
                  <rect x="156" y="78" width="24" height="5" rx="2.5" fill="#DFB76C" fillOpacity="0.3" />
                  <circle cx="75" cy="92" r="2.5" fill="#DFB76C" />
                  <rect x="83" y="91" width="38" height="3" rx="1.5" fill="#94A3B8" />
                  {/* Monitor Stand Base */}
                  <path
                    d="M95 114L88 132H132L125 114H95Z"
                    fill="#081426"
                    stroke="#DFB76C"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                  />
                  <rect x="78" y="131" width="64" height="4" rx="2" fill="#DFB76C" fillOpacity="0.7" />
                </svg>
              </div>
            )}
          </div>

          {/* Editorial Category Pill */}
          <div style={styles.kickerWrap}>
            <span style={styles.kickerPill}>
              <Sparkles size={11} color="#DFB76C" style={{ marginRight: 6 }} />
              {isRotateTablet
                ? 'Display Orientation'
                : isNarrowWindow
                ? 'Viewport Required'
                : 'Executive Workspace'}
            </span>
          </div>

          {/* Editorial Headline */}
          <h1 style={styles.heading}>
            {isRotateTablet
              ? 'Please rotate your tablet to landscape'
              : isNarrowWindow
              ? 'Please enlarge your browser window'
              : 'Optimized for widescreen workstations'}
          </h1>

          {/* Narrative Explanation */}
          <p style={styles.leadText}>
            {isRotateTablet
              ? 'The DALEEL administration console supports tablet hardware in landscape orientation. Turn your device 90° horizontally to comfortably view tables, maps, and navigation.'
              : isNarrowWindow
              ? `Your browser width is currently ${viewportWidth}px. Expand horizontal window width past ${minRequiredWidth}px to render multi-column triage desks and regional data.`
              : 'The DALEEL business administration portal delivers high-density triage desks, GPS registry tables, and operational coordination tools designed specifically for desktop PCs, laptops, and landscape tablets.'}
          </p>

          {/* Width Progress Gauge (When viewport is narrow) */}
          {isNarrowWindow && (
            <div style={styles.gaugeContainer}>
              <div style={styles.gaugeHeader}>
                <span style={styles.gaugeLabel}>Current Viewport Width</span>
                <span style={styles.gaugeValue}>
                  {viewportWidth}px <span style={styles.gaugeTarget}>/ {minRequiredWidth}px</span>
                </span>
              </div>
              <div style={styles.progressBarTrack}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${widthProgress}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div style={styles.actionRow}>
            {!isRotateTablet && !isNarrowWindow && (
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  ...styles.primaryActionBtn,
                  backgroundColor: copied ? '#10B981' : '#DFB76C',
                  borderColor: copied ? '#10B981' : '#DFB76C',
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} color="#040D1B" style={{ marginRight: 8 }} />
                    <span>Link Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="#040D1B" style={{ marginRight: 8 }} />
                    <span>Copy Console Link</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleManualRefresh}
              style={
                !isRotateTablet && !isNarrowWindow
                  ? styles.secondaryActionBtn
                  : styles.primaryActionBtn
              }
            >
              <RefreshCw
                size={14}
                color={!isRotateTablet && !isNarrowWindow ? '#DFB76C' : '#040D1B'}
                style={{
                  marginRight: 8,
                  transition: 'transform 0.45s ease',
                  transform: isRefreshing ? 'rotate(180deg)' : 'none',
                }}
              />
              <span>Check Display</span>
            </button>
          </div>

          {/* Seamless Feature Tags */}
          <div style={styles.platformBadgesRow}>
            <div style={styles.platformBadge}>
              <Laptop size={13} color="#DFB76C" style={{ marginRight: 6 }} />
              <span>Desktop & Laptop</span>
            </div>
            <div style={styles.platformBadge}>
              <Monitor size={13} color="#DFB76C" style={{ marginRight: 6 }} />
              <span>Tablet (Landscape)</span>
            </div>
            <div style={styles.platformBadge}>
              <ShieldCheck size={13} color="#DFB76C" style={{ marginRight: 6 }} />
              <span>256-Bit Encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* Grounded Page Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerLeft}>
          <Compass size={13} color="#8A9AA8" style={{ marginRight: 6 }} />
          <span>DALEEL Platform • Diaspora Administration Infrastructure</span>
        </div>
        <div style={styles.footerRight}>
          <span>Executive Access Only</span>
        </div>
      </footer>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#040D1B',
    backgroundImage: `
      radial-gradient(ellipse 90% 60% at 50% -10%, rgba(223, 183, 108, 0.12) 0%, transparent 60%),
      radial-gradient(ellipse 70% 50% at 50% 110%, rgba(11, 27, 61, 0.95) 0%, transparent 80%),
      linear-gradient(180deg, #040D1B 0%, #061327 50%, #030812 100%)
    `,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    color: '#FFFFFF',
    boxSizing: 'border-box',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage:
      'radial-gradient(rgba(223, 183, 108, 0.08) 1px, transparent 1px)',
    backgroundSize: '28px 28px',
    pointerEvents: 'none',
    zIndex: 1,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '800px',
    height: '240px',
    background: 'radial-gradient(ellipse, rgba(223, 183, 108, 0.14) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  ambientGlowCenter: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '500px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(16, 38, 77, 0.5) 0%, transparent 75%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  header: {
    width: '100%',
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(223, 183, 108, 0.14)',
    backgroundColor: 'rgba(4, 13, 27, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    position: 'relative',
    zIndex: 20,
    boxSizing: 'border-box',
  },
  brandGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoWrap: {
    height: '34px',
    width: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    height: '34px',
    width: 'auto',
    maxWidth: '28px',
    objectFit: 'contain',
  },
  brandDivider: {
    width: '1px',
    height: '22px',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  brandTextGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: 1.1,
  },
  brandTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '0.06em',
  },
  brandSub: {
    fontSize: '8.5px',
    fontWeight: 800,
    color: '#DFB76C',
    letterSpacing: '0.12em',
    marginTop: '2px',
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '9999px',
    backgroundColor: 'rgba(223, 183, 108, 0.08)',
    border: '1px solid rgba(223, 183, 108, 0.22)',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#DFB76C',
    boxShadow: '0 0 6px #DFB76C',
  },
  statusBadgeText: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#DFB76C',
    letterSpacing: '0.04em',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    position: 'relative',
    zIndex: 10,
    boxSizing: 'border-box',
  },
  contentColumn: {
    width: '100%',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  illustrationContainer: {
    position: 'relative',
    marginBottom: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowAura: {
    position: 'absolute',
    width: '240px',
    height: '160px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(223, 183, 108, 0.22) 0%, transparent 70%)',
    filter: 'blur(16px)',
    pointerEvents: 'none',
  },
  rotateIllustration: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kickerWrap: {
    marginBottom: '14px',
  },
  kickerPill: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: 750,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#DFB76C',
    backgroundColor: 'rgba(223, 183, 108, 0.09)',
    border: '1px solid rgba(223, 183, 108, 0.24)',
    padding: '5px 14px',
    borderRadius: '9999px',
  },
  heading: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '-0.025em',
    lineHeight: 1.25,
    margin: '0 0 14px 0',
    maxWidth: '480px',
  },
  leadText: {
    fontSize: '14.5px',
    color: '#A0B0C4',
    lineHeight: 1.65,
    margin: '0 0 28px 0',
    maxWidth: '460px',
  },
  gaugeContainer: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '24px',
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
    color: '#94A3B8',
    fontWeight: 650,
  },
  gaugeValue: {
    fontSize: '12.5px',
    fontWeight: 750,
    color: '#FFFFFF',
  },
  gaugeTarget: {
    color: '#64748B',
    fontWeight: 500,
  },
  progressBarTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#DFB76C',
    borderRadius: '999px',
    transition: 'width 0.25s ease',
  },
  actionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    maxWidth: '340px',
    marginBottom: '32px',
  },
  primaryActionBtn: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '13px 22px',
    backgroundColor: '#DFB76C',
    color: '#040D1B',
    border: '1px solid #DFB76C',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 750,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 6px 20px rgba(223, 183, 108, 0.28)',
  },
  secondaryActionBtn: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 22px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: '#DFB76C',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  platformBadgesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  platformBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#94A3B8',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '5px 12px',
    borderRadius: '8px',
  },
  footer: {
    width: '100%',
    padding: '16px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    backgroundColor: 'rgba(4, 13, 27, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: '#64748B',
    position: 'relative',
    zIndex: 20,
    boxSizing: 'border-box',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  footerRight: {
    fontWeight: 600,
    color: '#8A9AA8',
    letterSpacing: '0.04em',
  },
};
