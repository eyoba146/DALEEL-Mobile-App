import React, { useState } from 'react';
import type { DeviceAccessEvaluation } from '../utils/devicePolicy';
import {
  Monitor,
  Laptop,
  RotateCcw,
  Maximize2,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
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
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const widthProgress = Math.min(100, Math.round((viewportWidth / minRequiredWidth) * 100));

  // Determine elegant contextual content
  const getContent = () => {
    switch (denialReason) {
      case 'TABLET_PORTRAIT_BLOCKED':
        return {
          pill: 'Orientation Required',
          title: 'Rotate to landscape',
          subtitle:
            'Rotate your tablet 90° into landscape orientation to unlock the administrative console.',
          icon: <RotateCcw size={32} color="#DFB76C" />,
          illustration: 'tablet-rotate',
          actionText: 'The console unlocks automatically upon rotating your device.',
        };

      case 'VIEWPORT_TOO_NARROW':
        return {
          pill: 'Display Adjustment',
          title: 'Enlarge your browser window',
          subtitle: `The portal requires at least ${minRequiredWidth}px of horizontal space for multi-column triage tables and navigation.`,
          icon: <Maximize2 size={32} color="#DFB76C" />,
          illustration: 'expand-window',
          actionText: `Drag your window edge or maximize to expand past ${minRequiredWidth}px.`,
        };

      case 'PHONE_BLOCKED':
      default:
        return {
          pill: 'Desktop Experience',
          title: 'Designed for larger screens',
          subtitle:
            'The DALEEL administration portal is built for desktop and landscape tablet displays to comfortably manage live maps, triage desks, and member registries.',
          icon: <Monitor size={32} color="#DFB76C" />,
          illustration: 'desktop-laptop',
          actionText: 'Open this link on your PC, laptop, or tablet in landscape mode.',
        };
    }
  };

  const content = getContent();

  return (
    <div style={styles.container}>
      {/* Ambient Radial Backlights */}
      <div style={styles.ambientGlowPrimary} />
      <div style={styles.ambientGlowSecondary} />

      <div style={styles.card}>
        {/* Brand Crest Header */}
        <div style={styles.brandRow}>
          <div style={styles.logoWrap}>
            <img
              src="/daleel-logo.png"
              alt="DALEEL"
              style={styles.logoImg}
            />
          </div>
          <div style={styles.brandMeta}>
            <span style={styles.brandTitle}>DALEEL</span>
            <span style={styles.brandSubtitle}>EXECUTIVE CONSOLE</span>
          </div>
        </div>

        {/* Hero Visual Graphic with Soft Glow */}
        <div style={styles.heroVisualWrap}>
          <div style={styles.iconAura} />
          <div style={styles.iconCircle}>
            {content.icon}
          </div>
        </div>

        {/* Status Pill */}
        <div style={styles.pillWrap}>
          <span style={styles.statusPill}>
            <Sparkles size={12} color="#DFB76C" style={{ marginRight: 6 }} />
            {content.pill}
          </span>
        </div>

        {/* Heading & Subtitle */}
        <h1 style={styles.headline}>{content.title}</h1>
        <p style={styles.subtitle}>{content.subtitle}</p>

        {/* Interactive Width Progress Gauge (Only when viewport is narrow on desktop/tablet) */}
        {denialReason === 'VIEWPORT_TOO_NARROW' && (
          <div style={styles.gaugeBox}>
            <div style={styles.gaugeHeader}>
              <span style={styles.gaugeLabel}>Current width</span>
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

        {/* Action Prompt */}
        <div style={styles.actionPromptBox}>
          <span style={styles.actionPromptText}>{content.actionText}</span>
        </div>

        {/* Primary Action Button */}
        <div style={styles.actionButtonGroup}>
          {denialReason === 'PHONE_BLOCKED' && (
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                ...styles.primaryBtn,
                backgroundColor: copied ? '#10B981' : '#DFB76C',
                borderColor: copied ? '#10B981' : '#DFB76C',
              }}
            >
              {copied ? (
                <>
                  <Check size={16} color="#07152B" style={{ marginRight: 8 }} />
                  <span>Link Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy size={16} color="#07152B" style={{ marginRight: 8 }} />
                  <span>Copy Portal Link</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleManualRefresh}
            style={denialReason === 'PHONE_BLOCKED' ? styles.secondaryBtn : styles.primaryBtn}
          >
            <RefreshCw
              size={14}
              color={denialReason === 'PHONE_BLOCKED' ? '#DFB76C' : '#07152B'}
              style={{
                marginRight: 8,
                transition: 'transform 0.4s ease',
                transform: isRefreshing ? 'rotate(180deg)' : 'none',
              }}
            />
            <span>Check Display</span>
          </button>
        </div>

        {/* Minimal Supported Platforms Footer */}
        <div style={styles.supportedFooter}>
          <div style={styles.supportedItem}>
            <Laptop size={13} color="#94A3B8" style={{ marginRight: 5 }} />
            <span>Desktop & Laptop</span>
          </div>
          <span style={styles.supportedDot}>•</span>
          <div style={styles.supportedItem}>
            <Monitor size={13} color="#94A3B8" style={{ marginRight: 5 }} />
            <span>Tablet (Landscape)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#050D1A',
    backgroundImage: `
      radial-gradient(circle at 50% 0%, rgba(223, 183, 108, 0.08) 0%, transparent 60%),
      radial-gradient(circle at 80% 100%, rgba(11, 27, 61, 0.8) 0%, transparent 60%)
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
  ambientGlowPrimary: {
    position: 'absolute',
    top: '-20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '500px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(223, 183, 108, 0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  ambientGlowSecondary: {
    position: 'absolute',
    bottom: '-15%',
    right: '-10%',
    width: '450px',
    height: '350px',
    background: 'radial-gradient(circle, rgba(19, 40, 79, 0.6) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 1,
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'rgba(7, 21, 43, 0.78)',
    border: '1px solid rgba(223, 183, 108, 0.18)',
    borderRadius: '24px',
    padding: '36px 28px',
    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(223, 183, 108, 0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
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
    gap: '12px',
    marginBottom: '28px',
  },
  logoWrap: {
    height: '36px',
    width: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    height: '36px',
    width: 'auto',
    maxWidth: '30px',
    objectFit: 'contain',
  },
  brandMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '0.06em',
    lineHeight: 1.1,
  },
  brandSubtitle: {
    fontSize: '9px',
    fontWeight: 750,
    color: '#DFB76C',
    letterSpacing: '0.12em',
    marginTop: '2px',
  },
  heroVisualWrap: {
    position: 'relative',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconAura: {
    position: 'absolute',
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(223, 183, 108, 0.22) 0%, transparent 70%)',
    filter: 'blur(8px)',
  },
  iconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(223, 183, 108, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    position: 'relative',
    zIndex: 2,
  },
  pillWrap: {
    marginBottom: '16px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    color: '#DFB76C',
    backgroundColor: 'rgba(223, 183, 108, 0.1)',
    border: '1px solid rgba(223, 183, 108, 0.22)',
    padding: '4px 14px',
    borderRadius: '9999px',
  },
  headline: {
    fontSize: '22px',
    fontWeight: 750,
    color: '#FFFFFF',
    letterSpacing: '-0.02em',
    margin: '0 0 10px 0',
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: '13.5px',
    color: '#94A3B8',
    lineHeight: 1.6,
    margin: '0 0 24px 0',
    maxWidth: '380px',
  },
  gaugeBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '12px',
    padding: '12px 16px',
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
    fontSize: '11.5px',
    color: '#94A3B8',
    fontWeight: 600,
  },
  gaugeValue: {
    fontSize: '12.5px',
    fontWeight: 700,
    color: '#FFFFFF',
  },
  gaugeTarget: {
    color: '#64748B',
    fontWeight: 500,
  },
  progressBarTrack: {
    width: '100%',
    height: '5px',
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
  actionPromptBox: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    marginBottom: '24px',
    boxSizing: 'border-box',
  },
  actionPromptText: {
    fontSize: '12.5px',
    color: '#CBD5E1',
    lineHeight: 1.5,
  },
  actionButtonGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '24px',
  },
  primaryBtn: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    backgroundColor: '#DFB76C',
    color: '#07152B',
    border: '1px solid #DFB76C',
    borderRadius: '12px',
    fontSize: '13.5px',
    fontWeight: 750,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    boxShadow: '0 4px 16px rgba(223, 183, 108, 0.22)',
  },
  secondaryBtn: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '11px 20px',
    backgroundColor: 'transparent',
    color: '#DFB76C',
    border: '1px solid rgba(223, 183, 108, 0.3)',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  },
  supportedFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  supportedItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11.5px',
    color: '#94A3B8',
    fontWeight: 500,
  },
  supportedDot: {
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: '10px',
  },
};
