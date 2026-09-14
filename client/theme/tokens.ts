// DALEEL Design System
// Inspired by premium fintech and diaspora apps

export const colors = {
  // Backgrounds — Off White & Crisp White
  ivory:         '#F7F8FA',   // Off White canvas background
  background:    '#F7F8FA',   // Primary screen background
  backgroundSub: '#EFF2F6',   // Secondary container soft tint
  card:          '#FFFFFF',   // Pristine elevated card surface
  surface:       '#F0F3F8',   // Input & badge soft fill
  surfaceWarm:   '#F8F4EC',   // Warm soft accent fill

  // Brand — Deep Navy (Midnight Luxury)
  navy:          '#07152B',   // Core Deep Navy primary
  navyDeep:      '#050D1A',   // Ultra-deep midnight navy
  navyMedium:    '#0B1B3D',   // Rich navy secondary
  navyLight:     '#13284F',   // Lighter navy accent
  navySoft:      '#EAEFF8',   // Soft navy tint
  navyAlpha:     'rgba(7,21,43,0.06)',
  headerNavy:    '#07152B',   // Unified screen header navy

  // Brand aliases
  green:         '#07152B',
  greenDeep:     '#050D1A',
  greenSoft:     '#EAEFF8',

  // Radiant Warm Gold
  gold:          '#DFB76C',   // Radiant Warm Gold (matching reference UI)
  goldRich:      '#C59B43',   // Deeper warm gold for active states
  goldSoft:      '#F5E8CC',   // Soft golden tint for avatar/icon circles
  goldBorder:    '#E0C582',   // Warm gold border
  goldAlpha:     'rgba(223,183,108,0.16)',
  goldButton:    '#DFB76C',   // Button background gold
  goldText:      '#8C6A21',   // High-contrast gold text

  // Typography — Deep Navy & Slate
  charcoal:      '#07152B',   // Deep navy primary text
  charcoalSub:   '#5A687A',   // Clean readable slate subtext
  charcoalLight: '#8A9AA8',   // Muted secondary label text
  onNavy:        '#FFFFFF',   // Crisp white on navy

  // Legacy aliases
  charcoalSoft:  '#5A687A',

  // Utility — Crisp borders & feedback
  border:        '#E4E9F0',   // Subtle card border
  borderWarm:    '#E0C582',   // Golden divider border
  separator:     '#EAEFF6',
  error:         '#D63031',
  errorSoft:     '#FFF0F0',
  success:       '#16803C',
  successSoft:   '#E8F7ED',
  overlay:       'rgba(5,13,26,0.65)',
} as const;

export const appName = 'DALEEL';

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 72,
} as const;

export const radius = {
  xs: 4, sm: 8, md: 14, lg: 20, xl: 28, pill: 999,
} as const;

export const fonts = {
  heading:      'DMSerifDisplay_400Regular',
  body:         'Inter_400Regular',
  bodyMedium:   'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold:     'Inter_700Bold',
} as const;

export const type = {
  // DM Serif for hero/display headings only
  display:    { fontSize: 38, lineHeight: 46, fontFamily: 'DMSerifDisplay_400Regular' },
  hero:       { fontSize: 30, lineHeight: 38, fontFamily: 'DMSerifDisplay_400Regular' },

  // Inter for everything UI
  h1:         { fontSize: 26, lineHeight: 34, fontFamily: 'Inter_700Bold',     fontWeight: '700' as const },
  h2:         { fontSize: 20, lineHeight: 28, fontFamily: 'Inter_700Bold',     fontWeight: '700' as const },
  h3:         { fontSize: 17, lineHeight: 24, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const },
  body:       { fontSize: 16, lineHeight: 25, fontFamily: 'Inter_400Regular',  fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 25, fontFamily: 'Inter_500Medium',   fontWeight: '500' as const },
  bodySmall:  { fontSize: 14, lineHeight: 22, fontFamily: 'Inter_400Regular',  fontWeight: '400' as const },
  caption:    { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_500Medium',   fontWeight: '500' as const },
  button:     { fontSize: 16, lineHeight: 20, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const },
  label:      { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_600SemiBold', fontWeight: '600' as const },
};

export const shadow = {
  card: {
    shadowColor: '#101935',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  button: {
    shadowColor: '#0E1C40',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modal: {
    shadowColor: '#101935',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -6 },
    elevation: 14,
  },
};
