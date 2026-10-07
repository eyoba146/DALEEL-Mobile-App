// DALEEL Admin Design System
// Inherits the exact customer mobile design language: Deep Navy · Warm Gold · Off White

export const colors = {
  // ── Backgrounds ──────────────────────────────────────
  ivory:         '#F7F8FA',   // Off White canvas background
  background:    '#F7F8FA',   // Primary screen background
  backgroundSub: '#EFF2F6',   // Secondary container tint
  card:          '#FFFFFF',   // Elevated card surface
  surface:       '#F0F3F8',   // Input & badge soft fill
  surfaceWarm:   '#F8F4EC',   // Warm soft accent fill

  // ── Brand — Deep Navy ────────────────────────────────
  navy:          '#07152B',   // Core Deep Navy primary
  navyDeep:      '#050D1A',   // Ultra-deep midnight navy (headers & drawer)
  navyMedium:    '#0B1B3D',   // Rich navy secondary
  navyLight:     '#13284F',   // Lighter navy accent
  navySoft:      '#EAEFF8',   // Soft navy tint
  navyAlpha:     'rgba(7,21,43,0.06)',
  headerNavy:    '#07152B',   // Screen header navy

  // Brand aliases (legacy compat)
  green:         '#07152B',
  greenDeep:     '#050D1A',
  greenSoft:     '#EAEFF8',

  // ── Brand — Warm Gold ────────────────────────────────
  gold:          '#DFB76C',   // Radiant Warm Gold accent
  goldRich:      '#C59B43',   // Deeper gold for active states
  goldSoft:      '#F5E8CC',   // Soft golden tint fills
  goldBorder:    '#E0C582',   // Warm gold border
  goldAlpha:     'rgba(223,183,108,0.16)',
  goldButton:    '#DFB76C',   // Button background gold
  goldText:      '#8C6A21',   // High-contrast gold text

  // ── Typography ───────────────────────────────────────
  textPrimary:   '#07152B',   // Deep Navy primary text
  textSecondary: '#5A687A',   // Slate secondary text
  textTertiary:  '#8A9AA8',   // Muted label/placeholder text
  textInverse:   '#FFFFFF',   // White text on dark surfaces

  // Legacy text aliases
  charcoal:      '#07152B',
  charcoalSub:   '#5A687A',
  charcoalLight: '#8A9AA8',
  charcoalSoft:  '#5A687A',
  onNavy:        '#FFFFFF',

  // ── Borders & Dividers ──────────────────────────────
  border:        '#E4E9F0',   // Subtle card/input border
  borderStrong:  '#D0D7E2',   // Emphasized borders
  borderWarm:    '#E0C582',   // Golden divider border
  separator:     '#EAEFF6',   // Light section separator

  // ── Semantic / Status / Triage Feedback ─────────────
  error:         '#D63031',
  danger:        '#D63031',
  errorSoft:     '#FFF0F0',
  success:       '#16803C',
  successSoft:   '#E8F7ED',
  warning:       '#E67E22',
  warningSoft:   '#FFF8E7',
  info:          '#2563EB',
  infoSoft:      '#EFF6FF',

  // Status badges
  statusActive:     '#2563EB',
  statusActiveSoft: '#EFF6FF',
  statusConfirmed:  '#16803C',
  statusConfirmedSoft: '#E8F7ED',
  statusCancelled:  '#D63031',
  statusCancelledSoft: '#FFF0F0',
  statusPending:    '#8C6A21',
  statusPendingSoft:'#FDF8E8',

  // ── Overlay ─────────────────────────────────────────
  overlay:       'rgba(5,13,26,0.65)',
  overlayLight:  'rgba(5,13,26,0.35)',

  // ── Interactive States ──────────────────────────────
  pressed:       'rgba(7,21,43,0.08)',
  disabled:      '#C3CCD9',
} as const;

export const appName = 'DALEEL Admin';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
  full: 999,
} as const;

export const fonts = {
  heading:      'DMSerifDisplay_400Regular',
  body:         'Inter_400Regular',
  bodyMedium:   'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold:     'Inter_700Bold',

  // Semantic aliases
  serifBold:    'DMSerifDisplay_400Regular',
  sansRegular:  'Inter_400Regular',
  sansMedium:   'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold:     'Inter_700Bold',
} as const;

export const type = {
  display:    { fontSize: 36, lineHeight: 44, fontFamily: 'DMSerifDisplay_400Regular' },
  hero:       { fontSize: 28, lineHeight: 36, fontFamily: 'DMSerifDisplay_400Regular' },
  h1:         { fontSize: 24, lineHeight: 32, fontFamily: 'Inter_700Bold',     fontWeight: '700' as const },
  h2:         { fontSize: 19, lineHeight: 26, fontFamily: 'Inter_700Bold',     fontWeight: '700' as const },
  h3:         { fontSize: 16, lineHeight: 22, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const },
  body:       { fontSize: 14.5, lineHeight: 22, fontFamily: 'Inter_400Regular',  fontWeight: '400' as const },
  bodyMedium: { fontSize: 14.5, lineHeight: 22, fontFamily: 'Inter_500Medium',   fontWeight: '500' as const },
  bodySmall:  { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular',  fontWeight: '400' as const },
  caption:    { fontSize: 12, lineHeight: 17, fontFamily: 'Inter_500Medium',   fontWeight: '500' as const },
  overline:   { fontSize: 11, lineHeight: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const, letterSpacing: 0.8 },
  button:     { fontSize: 14.5, lineHeight: 20, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const },
  label:      { fontSize: 12, lineHeight: 17, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const },
  tiny:       { fontSize: 10.5, lineHeight: 14, fontFamily: 'Inter_500Medium', fontWeight: '500' as const },
};

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  card: {
    shadowColor: '#101935',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#101935',
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  button: {
    shadowColor: '#0E1C40',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  modal: {
    shadowColor: '#101935',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
  header: {
    shadowColor: '#050D1A',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
};
