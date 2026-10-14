import test from 'node:test';
import assert from 'node:assert';
import {
  evaluateDeviceAccess,
  MIN_DESKTOP_WIDTH,
  MIN_TABLET_LANDSCAPE_WIDTH,
  type DeviceSignals,
} from './devicePolicy.ts';

// Common User Agent Fixtures
const UA_WINDOWS_DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const UA_MAC_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const UA_LINUX_DESKTOP =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const UA_CHROMEBOOK =
  'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const UA_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const UA_ANDROID_PHONE =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';

const UA_IPAD_CLASSIC =
  'Mozilla/5.0 (iPad; CPU OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const UA_IPAD_MODERN =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const UA_ANDROID_TABLET =
  'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

test('Policy Rule 1: Allow desktop PCs and laptops with standard viewports', () => {
  const signals: DeviceSignals = {
    userAgent: UA_WINDOWS_DESKTOP,
    maxTouchPoints: 0,
    viewportWidth: 1920,
    viewportHeight: 1080,
    screenWidth: 1920,
    screenHeight: 1080,
    hoverHover: true,
    pointerCoarse: false,
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, true);
  assert.strictEqual(evalResult.deviceType, 'desktop');
  assert.strictEqual(evalResult.denialReason, null);
});

test('Policy Rule 1: Allow macOS desktop with Retina display', () => {
  const signals: DeviceSignals = {
    userAgent: UA_MAC_DESKTOP,
    maxTouchPoints: 0,
    viewportWidth: 1440,
    viewportHeight: 900,
    screenWidth: 1440,
    screenHeight: 900,
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, true);
  assert.strictEqual(evalResult.deviceType, 'desktop');
});

test('Policy Rule 1: Allow Chromebook laptops with standard widescreen viewport', () => {
  const signals: DeviceSignals = {
    userAgent: UA_CHROMEBOOK,
    maxTouchPoints: 0,
    viewportWidth: 1366,
    viewportHeight: 768,
    screenWidth: 1366,
    screenHeight: 768,
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, true);
  assert.strictEqual(evalResult.deviceType, 'desktop');
  assert.strictEqual(evalResult.denialReason, null);
});

test('Policy Rule 2: Allow classic iPad in landscape orientation', () => {
  const signals: DeviceSignals = {
    userAgent: UA_IPAD_CLASSIC,
    maxTouchPoints: 5,
    viewportWidth: 1024,
    viewportHeight: 768,
    screenWidth: 1024,
    screenHeight: 768,
    orientationType: 'landscape-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, true);
  assert.strictEqual(evalResult.deviceType, 'tablet');
  assert.strictEqual(evalResult.orientation, 'landscape');
});

test('Policy Rule 1 & Touch Laptops: Touchscreen Windows laptops are classified as desktop and allowed', () => {
  const signals: DeviceSignals = {
    userAgent: UA_WINDOWS_DESKTOP,
    maxTouchPoints: 10, // Touchscreen laptop like Surface Pro or Lenovo Yoga
    viewportWidth: 1920,
    viewportHeight: 1080,
    screenWidth: 1920,
    screenHeight: 1080,
    hoverHover: true,
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, true);
  assert.strictEqual(evalResult.deviceType, 'desktop');
  assert.strictEqual(evalResult.denialReason, null);
});

test('Policy Rule 5: Block desktop PC if viewport is resized below 1024px', () => {
  const signals: DeviceSignals = {
    userAgent: UA_WINDOWS_DESKTOP,
    maxTouchPoints: 0,
    viewportWidth: 980, // Less than MIN_DESKTOP_WIDTH (1024)
    viewportHeight: 800,
    screenWidth: 1920,
    screenHeight: 1080,
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'desktop');
  assert.strictEqual(evalResult.denialReason, 'VIEWPORT_TOO_NARROW');
  assert.strictEqual(evalResult.minRequiredWidth, MIN_DESKTOP_WIDTH);
});

test('Policy Rule 2: Allow tablets only in landscape orientation (iPad modern in landscape)', () => {
  const signals: DeviceSignals = {
    userAgent: UA_IPAD_MODERN,
    maxTouchPoints: 5,
    viewportWidth: 1180,
    viewportHeight: 820,
    screenWidth: 1180,
    screenHeight: 820,
    orientationType: 'landscape-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, true);
  assert.strictEqual(evalResult.deviceType, 'tablet');
  assert.strictEqual(evalResult.orientation, 'landscape');
  assert.strictEqual(evalResult.denialReason, null);
});

test('Policy Rule 2: Allow Android tablet in landscape with >= 768px width', () => {
  const signals: DeviceSignals = {
    userAgent: UA_ANDROID_TABLET,
    maxTouchPoints: 10,
    viewportWidth: 1280,
    viewportHeight: 800,
    screenWidth: 1280,
    screenHeight: 800,
    orientationType: 'landscape-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, true);
  assert.strictEqual(evalResult.deviceType, 'tablet');
  assert.strictEqual(evalResult.orientation, 'landscape');
});

test('Policy Rule 4: Block tablets in portrait orientation (iPad in portrait)', () => {
  const signals: DeviceSignals = {
    userAgent: UA_IPAD_MODERN,
    maxTouchPoints: 5,
    viewportWidth: 820,
    viewportHeight: 1180, // Portrait
    screenWidth: 820,
    screenHeight: 1180,
    orientationType: 'portrait-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'tablet');
  assert.strictEqual(evalResult.orientation, 'portrait');
  assert.strictEqual(evalResult.denialReason, 'TABLET_PORTRAIT_BLOCKED');
});

test('Policy Rule 4: Block Android tablet in portrait orientation', () => {
  const signals: DeviceSignals = {
    userAgent: UA_ANDROID_TABLET,
    maxTouchPoints: 10,
    viewportWidth: 800,
    viewportHeight: 1280,
    screenWidth: 800,
    screenHeight: 1280,
    orientationType: 'portrait-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'tablet');
  assert.strictEqual(evalResult.orientation, 'portrait');
  assert.strictEqual(evalResult.denialReason, 'TABLET_PORTRAIT_BLOCKED');
});

test('Policy Rule 5 & Tablet: Block landscape tablet if viewport is too narrow (e.g. split view < 768px)', () => {
  const signals: DeviceSignals = {
    userAgent: UA_IPAD_MODERN,
    maxTouchPoints: 5,
    viewportWidth: 504, // Split-view slideover on iPad
    viewportHeight: 820,
    screenWidth: 1180,
    screenHeight: 820,
    orientationType: 'landscape-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'tablet');
  assert.strictEqual(evalResult.denialReason, 'VIEWPORT_TOO_NARROW');
  assert.strictEqual(evalResult.minRequiredWidth, MIN_TABLET_LANDSCAPE_WIDTH);
});

test('Policy Rule 3: Block iPhone in portrait orientation', () => {
  const signals: DeviceSignals = {
    userAgent: UA_IPHONE,
    maxTouchPoints: 5,
    viewportWidth: 393,
    viewportHeight: 852,
    screenWidth: 393,
    screenHeight: 852,
    orientationType: 'portrait-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'phone');
  assert.strictEqual(evalResult.denialReason, 'PHONE_BLOCKED');
});

test('Policy Rule 3: Block iPhone in landscape orientation', () => {
  const signals: DeviceSignals = {
    userAgent: UA_IPHONE,
    maxTouchPoints: 5,
    viewportWidth: 852,
    viewportHeight: 393, // Landscape
    screenWidth: 852,
    screenHeight: 393,
    orientationType: 'landscape-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'phone');
  assert.strictEqual(evalResult.denialReason, 'PHONE_BLOCKED');
});

test('Policy Rule 3: Block Android phone in portrait orientation', () => {
  const signals: DeviceSignals = {
    userAgent: UA_ANDROID_PHONE,
    maxTouchPoints: 10,
    viewportWidth: 412,
    viewportHeight: 915,
    screenWidth: 412,
    screenHeight: 915,
    orientationType: 'portrait-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'phone');
  assert.strictEqual(evalResult.denialReason, 'PHONE_BLOCKED');
});

test('Policy Rule 3: Block Android phone in landscape orientation', () => {
  const signals: DeviceSignals = {
    userAgent: UA_ANDROID_PHONE,
    maxTouchPoints: 10,
    viewportWidth: 915,
    viewportHeight: 412,
    screenWidth: 915,
    screenHeight: 412,
    orientationType: 'landscape-primary',
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'phone');
  assert.strictEqual(evalResult.denialReason, 'PHONE_BLOCKED');
});

test('Policy Rule 3 & Desktop Mode: Block Android phone requesting Desktop Website (Linux UA spoof)', () => {
  // Mobile Chrome Desktop Mode sends Linux x86_64 User-Agent, but screen dimensions are still physical phone size
  const signals: DeviceSignals = {
    userAgent: UA_LINUX_DESKTOP,
    maxTouchPoints: 5,
    viewportWidth: 980, // Spoofed desktop viewport
    viewportHeight: 1800,
    screenWidth: 412, // Hardware screen short dimension
    screenHeight: 915,
    userAgentDataMobile: true,
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'phone');
  assert.strictEqual(evalResult.denialReason, 'PHONE_BLOCKED');
  assert.strictEqual(evalResult.evidence.isDesktopModeSpoof, true);
});

test('Policy Rule 3 & Desktop Mode: Block iPhone requesting Desktop Website (Macintosh UA spoof)', () => {
  // iOS Safari Desktop Mode sends Mac OS X User-Agent, but screen.width is 393 CSS pixels
  const signals: DeviceSignals = {
    userAgent: UA_MAC_DESKTOP,
    maxTouchPoints: 5,
    viewportWidth: 1024, // Spoofed desktop viewport
    viewportHeight: 768,
    screenWidth: 393, // Hardware screen short dimension (< 580)
    screenHeight: 852,
  };

  const evalResult = evaluateDeviceAccess(signals);
  assert.strictEqual(evalResult.allowed, false);
  assert.strictEqual(evalResult.deviceType, 'phone');
  assert.strictEqual(evalResult.denialReason, 'PHONE_BLOCKED');
  assert.strictEqual(evalResult.evidence.isDesktopModeSpoof, true);
});
