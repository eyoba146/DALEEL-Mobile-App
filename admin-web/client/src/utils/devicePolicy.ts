/**
 * DALEEL Business Administration Portal - Device Access Policy Engine
 * 
 * Access Policy Rules:
 * 1. Allow desktop PCs and laptops (viewport width >= 1024px).
 * 2. Allow tablets only in landscape orientation (viewport width >= 768px).
 * 3. Block mobile phones in both portrait and landscape orientations, including
 *    devices requesting desktop mode when they can be identified as mobile.
 * 4. Block tablets in portrait orientation.
 * 5. Block any viewport that is too narrow for the administration interface.
 * 6. Dynamic re-evaluation on window resize, orientation change, and bfcache restoration.
 */

export type DeviceType = 'desktop' | 'tablet' | 'phone';
export type Orientation = 'portrait' | 'landscape';

export type DenialReason =
  | 'PHONE_BLOCKED'
  | 'TABLET_PORTRAIT_BLOCKED'
  | 'VIEWPORT_TOO_NARROW';

export interface DeviceSignals {
  userAgent: string;
  maxTouchPoints: number;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  screenAvailWidth?: number;
  screenAvailHeight?: number;
  devicePixelRatio?: number;
  orientationType?: string;
  isLandscapeMedia?: boolean;
  pointerCoarse?: boolean;
  hoverHover?: boolean;
  userAgentDataMobile?: boolean;
  userAgentDataPlatform?: string;
}

export interface DeviceAccessEvaluation {
  allowed: boolean;
  deviceType: DeviceType;
  orientation: Orientation;
  viewportWidth: number;
  viewportHeight: number;
  minRequiredWidth: number;
  denialReason: DenialReason | null;
  policyMessage: string;
  evidence: {
    isExplicitPhoneUA: boolean;
    isExplicitTabletUA: boolean;
    isExplicitDesktopUA: boolean;
    isDesktopModeSpoof: boolean;
    hasTouch: boolean;
    shortScreenDimension: number;
    pointerCoarse: boolean;
    hoverHover: boolean;
    platform: string;
  };
}

// Sensible minimum viewport thresholds
export const MIN_DESKTOP_WIDTH = 1024;
export const MIN_TABLET_LANDSCAPE_WIDTH = 768;

// Physical screen short-dimension threshold distinguishing phones from tablets/PCs
// The largest standard smartphone screens (e.g. iPhone 16 Pro Max, Galaxy S24 Ultra)
// have a portrait width (short edge) of 412 - 440 CSS pixels.
// Budget 7" tablets start at 600 CSS pixels, and iPad Mini starts at 744 CSS pixels.
export const PHONE_MAX_SHORT_SCREEN_DIMENSION = 580;

/**
 * Determines device orientation based on viewport dimensions, screen orientation API,
 * and CSS media queries.
 */
export function detectOrientation(signals: DeviceSignals): Orientation {
  if (signals.orientationType) {
    if (signals.orientationType.includes('landscape')) return 'landscape';
    if (signals.orientationType.includes('portrait')) return 'portrait';
  }
  if (typeof signals.isLandscapeMedia === 'boolean') {
    return signals.isLandscapeMedia ? 'landscape' : 'portrait';
  }
  return signals.viewportWidth >= signals.viewportHeight ? 'landscape' : 'portrait';
}

/**
 * Classifies the device into 'phone', 'tablet', or 'desktop'.
 * Applies multi-factor signal analysis including UA strings, touch points,
 * physical screen metrics, and desktop-mode spoofing checks.
 */
export function detectDeviceType(signals: DeviceSignals): {
  deviceType: DeviceType;
  isExplicitPhoneUA: boolean;
  isExplicitTabletUA: boolean;
  isExplicitDesktopUA: boolean;
  isDesktopModeSpoof: boolean;
} {
  const ua = signals.userAgent || '';
  const shortScreen = Math.min(signals.screenWidth || 0, signals.screenHeight || 0);
  const hasTouch = (signals.maxTouchPoints || 0) > 0;
  const isChromiumMobile = signals.userAgentDataMobile === true;

  // 1. Explicit phone patterns in User-Agent
  // Note: Android phones include "Mobile", while Android tablets omit "Mobile"
  const isExplicitPhoneUA =
    Boolean(
      /(iPhone|iPod|Windows Phone|IEMobile|BlackBerry|BB10|Opera Mini|webOS)/i.test(ua) ||
      (/(Android|Adr)/i.test(ua) && /Mobile/i.test(ua))
    );

  // 2. Explicit tablet patterns in User-Agent
  // iPadOS 13+ reports Macintosh by default, but has touch support and tablet screen dimensions
  const isIPadModern = /Macintosh/i.test(ua) && hasTouch && shortScreen >= 700;
  const isExplicitTabletUA =
    Boolean(
      /iPad/i.test(ua) ||
      isIPadModern ||
      (/(Android|Adr)/i.test(ua) && !/Mobile/i.test(ua)) ||
      /(Tablet|Silk|Kindle|PlayBook)/i.test(ua)
    );

  // 3. Desktop patterns in User-Agent
  const isExplicitDesktopUA =
    Boolean(
      (/Windows NT/i.test(ua) && !/Windows Phone/i.test(ua)) ||
      (/Macintosh/i.test(ua) && !isIPadModern) ||
      (/CrOS/i.test(ua)) ||
      (/X11;.*(Linux|Ubuntu|Fedora|BSD)/i.test(ua) && !/Android/i.test(ua))
    );

  // 4. Desktop-mode spoof detection on mobile phones:
  // When a user toggles "Request Desktop Website", mobile Chrome sends a Linux/X11 or Mac UA,
  // and mobile Safari sends a Mac UA.
  // However, screen.width / screen.height are hardware/OS properties that remain phone-sized (< 580 CSS px).
  const isDesktopModeSpoof = Boolean(
    !isExplicitPhoneUA &&
    (isChromiumMobile || (hasTouch && shortScreen > 0 && shortScreen < PHONE_MAX_SHORT_SCREEN_DIMENSION))
  );

  if (isExplicitPhoneUA || isDesktopModeSpoof) {
    return {
      deviceType: 'phone',
      isExplicitPhoneUA,
      isExplicitTabletUA,
      isExplicitDesktopUA,
      isDesktopModeSpoof,
    };
  }

  if (isExplicitTabletUA) {
    return {
      deviceType: 'tablet',
      isExplicitPhoneUA,
      isExplicitTabletUA,
      isExplicitDesktopUA,
      isDesktopModeSpoof: false,
    };
  }

  // If UA has no phone/tablet markers and screen is tablet/desktop sized
  if (isExplicitDesktopUA) {
    return {
      deviceType: 'desktop',
      isExplicitPhoneUA: false,
      isExplicitTabletUA: false,
      isExplicitDesktopUA: true,
      isDesktopModeSpoof: false,
    };
  }

  // Fallback heuristic based on screen dimension & touch
  if (hasTouch && shortScreen < 768) {
    return {
      deviceType: 'tablet',
      isExplicitPhoneUA: false,
      isExplicitTabletUA: false,
      isExplicitDesktopUA: false,
      isDesktopModeSpoof: false,
    };
  }

  return {
    deviceType: 'desktop',
    isExplicitPhoneUA: false,
    isExplicitTabletUA: false,
    isExplicitDesktopUA: false,
    isDesktopModeSpoof: false,
  };
}

/**
 * Pure evaluation function implementing the complete 6-rule Access Policy.
 */
export function evaluateDeviceAccess(signals: DeviceSignals): DeviceAccessEvaluation {
  const orientation = detectOrientation(signals);
  const { deviceType, isExplicitPhoneUA, isExplicitTabletUA, isExplicitDesktopUA, isDesktopModeSpoof } =
    detectDeviceType(signals);

  const shortScreen = Math.min(signals.screenWidth || 0, signals.screenHeight || 0);
  const evidence = {
    isExplicitPhoneUA,
    isExplicitTabletUA,
    isExplicitDesktopUA,
    isDesktopModeSpoof,
    hasTouch: (signals.maxTouchPoints || 0) > 0,
    shortScreenDimension: shortScreen,
    pointerCoarse: Boolean(signals.pointerCoarse),
    hoverHover: Boolean(signals.hoverHover),
    platform: signals.userAgentDataPlatform || (typeof navigator !== 'undefined' ? navigator.platform : 'unknown'),
  };

  // Rule 3: Block mobile phones in all orientations (portrait and landscape)
  if (deviceType === 'phone') {
    return {
      allowed: false,
      deviceType: 'phone',
      orientation,
      viewportWidth: signals.viewportWidth,
      viewportHeight: signals.viewportHeight,
      minRequiredWidth: MIN_DESKTOP_WIDTH,
      denialReason: 'PHONE_BLOCKED',
      policyMessage:
        'Mobile phone access is prohibited. The DALEEL Administration Console requires a desktop PC, laptop, or tablet in landscape mode.',
      evidence,
    };
  }

  // Rule 4: Block tablets in portrait orientation
  if (deviceType === 'tablet' && orientation === 'portrait') {
    return {
      allowed: false,
      deviceType: 'tablet',
      orientation: 'portrait',
      viewportWidth: signals.viewportWidth,
      viewportHeight: signals.viewportHeight,
      minRequiredWidth: MIN_TABLET_LANDSCAPE_WIDTH,
      denialReason: 'TABLET_PORTRAIT_BLOCKED',
      policyMessage:
        'Tablet access is only permitted in landscape orientation. Please rotate your device horizontally to continue.',
      evidence,
    };
  }

  // Rule 2: Allow tablets only in landscape orientation (with adequate width)
  if (deviceType === 'tablet') {
    if (signals.viewportWidth < MIN_TABLET_LANDSCAPE_WIDTH) {
      return {
        allowed: false,
        deviceType: 'tablet',
        orientation: 'landscape',
        viewportWidth: signals.viewportWidth,
        viewportHeight: signals.viewportHeight,
        minRequiredWidth: MIN_TABLET_LANDSCAPE_WIDTH,
        denialReason: 'VIEWPORT_TOO_NARROW',
        policyMessage: `Tablet viewport width (${signals.viewportWidth}px) is too narrow. Minimum required width in landscape is ${MIN_TABLET_LANDSCAPE_WIDTH}px.`,
        evidence,
      };
    }

    return {
      allowed: true,
      deviceType: 'tablet',
      orientation: 'landscape',
      viewportWidth: signals.viewportWidth,
      viewportHeight: signals.viewportHeight,
      minRequiredWidth: MIN_TABLET_LANDSCAPE_WIDTH,
      denialReason: null,
      policyMessage: 'Access granted: Landscape tablet layout suitable.',
      evidence,
    };
  }

  // Rule 1 & Rule 5: Desktop PCs and laptops
  if (signals.viewportWidth < MIN_DESKTOP_WIDTH) {
    return {
      allowed: false,
      deviceType: 'desktop',
      orientation,
      viewportWidth: signals.viewportWidth,
      viewportHeight: signals.viewportHeight,
      minRequiredWidth: MIN_DESKTOP_WIDTH,
      denialReason: 'VIEWPORT_TOO_NARROW',
      policyMessage: `Browser window is too narrow (${signals.viewportWidth}px). Please widen your browser window to at least ${MIN_DESKTOP_WIDTH}px to view the console.`,
      evidence,
    };
  }

  return {
    allowed: true,
    deviceType: 'desktop',
    orientation,
    viewportWidth: signals.viewportWidth,
    viewportHeight: signals.viewportHeight,
    minRequiredWidth: MIN_DESKTOP_WIDTH,
    denialReason: null,
    policyMessage: 'Access granted: Desktop environment verified.',
    evidence,
  };
}

/**
 * Gathers runtime signals safely from the active browser window.
 * Returns safe fallback values if executed in an SSR or non-browser environment.
 */
export function collectDeviceSignals(): DeviceSignals {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      maxTouchPoints: 0,
      viewportWidth: 1280,
      viewportHeight: 800,
      screenWidth: 1280,
      screenHeight: 800,
    };
  }

  const nav = window.navigator as any;
  const screen = window.screen || ({} as Screen);

  const orientationType = screen.orientation?.type || undefined;
  const isLandscapeMedia = window.matchMedia ? window.matchMedia('(orientation: landscape)').matches : undefined;
  const pointerCoarse = window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : undefined;
  const hoverHover = window.matchMedia ? window.matchMedia('(hover: hover)').matches : undefined;

  return {
    userAgent: nav.userAgent || '',
    maxTouchPoints: nav.maxTouchPoints || 0,
    viewportWidth: window.innerWidth || document.documentElement.clientWidth || 0,
    viewportHeight: window.innerHeight || document.documentElement.clientHeight || 0,
    screenWidth: screen.width || 0,
    screenHeight: screen.height || 0,
    screenAvailWidth: screen.availWidth || 0,
    screenAvailHeight: screen.availHeight || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    orientationType,
    isLandscapeMedia,
    pointerCoarse,
    hoverHover,
    userAgentDataMobile: nav.userAgentData?.mobile,
    userAgentDataPlatform: nav.userAgentData?.platform,
  };
}
