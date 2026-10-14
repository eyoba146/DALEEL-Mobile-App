# DALEEL Administration Portal — Device-Access Restriction System Handoff

**Platform:** DALEEL Diaspora & Foreign Resident Administration Console  
**Frontend:** React 19 + TypeScript + Vite (`admin-web/client`)  
**Backend:** Node.js + Express + Prisma + PostgreSQL (`server/`)  
**Status:** Implemented, Tested, and Verified  

---

## 1. Access Policy Overview

The business administration portal enforces a strict, multi-factor device and viewport access policy designed to protect data integrity, prevent layout breakage, and ensure dense triage workflows are operated only on suitable displays:

| Rule | Device Class / State | Policy Decision | Minimum Required Width | Denial Reason Code |
| :--- | :--- | :--- | :--- | :--- |
| **Rule 1** | **Desktop PCs & Laptops** | **ALLOWED** | `1024px` | — |
| **Rule 2** | **Tablets in Landscape** | **ALLOWED** | `768px` | — |
| **Rule 3** | **Mobile Phones (Portrait)** | **BLOCKED** | — | `PHONE_BLOCKED` |
| **Rule 3** | **Mobile Phones (Landscape)** | **BLOCKED** | — | `PHONE_BLOCKED` |
| **Rule 3** | **Mobile Phones in Desktop Mode** | **BLOCKED** | — | `PHONE_BLOCKED` |
| **Rule 4** | **Tablets in Portrait** | **BLOCKED** | `768px` (Requires Rotation) | `TABLET_PORTRAIT_BLOCKED` |
| **Rule 5** | **Narrow Viewports (< 1024px PC / < 768px Tablet)** | **BLOCKED** | `1024px` (PC) / `768px` (Tablet) | `VIEWPORT_TOO_NARROW` |
| **Rule 6** | **Runtime Re-evaluation** | **DYNAMIC** | Window Resize, Orientation Change, bfcache | — |

---

## 2. Architecture & File Structure

All changes are integrated directly into the existing React application without introducing external UI dependencies or modifying backend schemas:

```
admin-web/client/
├── package.json                              # Added npm test script (node:test)
├── src/
│   ├── App.tsx                               # Wrapped with DeviceAccessProvider & DeviceAccessGuard
│   ├── context/
│   │   └── DeviceAccessContext.tsx           # React Context & useDeviceAccess hook with live listeners
│   ├── components/
│   │   ├── DeviceAccessGuard.tsx             # Reusable guard preventing flash of protected UI
│   │   └── DeviceRestrictionScreen.tsx       # Branded luxury restriction screen with telemetry
│   └── utils/
│       ├── devicePolicy.ts                   # Core pure evaluation engine & signal extraction
│       └── devicePolicy.test.ts              # 17 automated unit tests covering all rules
```

---

## 3. Detection Strategy & Multi-Factor Signals

Browser device detection is inherently heuristic because User-Agent strings can be spoofed. The DALEEL policy engine uses multi-factor signal triangulation rather than relying on any single attribute:

### A. Touchscreen Disambiguation (Laptops vs Mobile)
* **Touch Laptops (Windows Surface, Lenovo Yoga, Touch Monitors):** These devices have `navigator.maxTouchPoints > 0`, but report a desktop User-Agent (`Windows NT`, `X11`, `CrOS`), have high physical screen dimensions (`>= 1080px`), and support `pointer: fine` and `hover: hover`.
* **Policy Guarantee:** Touch support alone is **never** used to classify a device as a phone. Touch laptops are properly classified as **Desktop** and granted full access when `viewportWidth >= 1024px`.

### B. Mobile Phone Desktop-Mode Spoofing Defense
* When mobile Chrome or Safari users enable **"Request Desktop Website"**, the browser alters the User-Agent header (pretending to be Linux x86_64 or Macintosh).
* **Countermeasure:** Hardware-bound physical screen metrics cannot be overridden by desktop mode toggles:
  - `Math.min(window.screen.width, window.screen.height)` on mobile smartphones is `<= 480 CSS pixels` (e.g. iPhone 16 Pro Max is 430px; Galaxy S24 Ultra is 412px; Pixel 8 Pro is 412px).
  - Even budget 7-inch tablets start at `600 CSS pixels`, and iPad Mini starts at `744 CSS pixels`.
  - When `shortScreenDimension < 580` combined with `hasTouch: true` or `navigator.userAgentData?.mobile === true`, the device is identified as a **mobile phone in desktop mode** and blocked under Rule 3.

### C. Tablet Identification
* **iPad on iOS/iPadOS 13+:** Reports `Macintosh` in `navigator.userAgent` by default. Disambiguated by detecting `hasTouch: true` + physical screen short dimension `>= 700 CSS pixels`.
* **Android Tablets:** Identified by `Android` in UA without the `Mobile` token (standard Google Android tablet convention).
* **Landscape vs Portrait:** Detected via `screen.orientation.type`, `window.matchMedia('(orientation: landscape)')`, and `window.innerWidth >= window.innerHeight`.

---

## 4. Re-evaluation Triggers (Rule 6)

The `DeviceAccessContext` binds listeners for real-time state adaptation:

1. **Window Resizing:**  
   Listens to `window.addEventListener('resize')` with `requestAnimationFrame` debouncing. When an administrator resizes their desktop browser below `1024px`, the restriction screen immediately displays with a live progress bar. Expanding the window past `1024px` instantly restores the console.
2. **Device Orientation Change:**  
   Listens to `window.screen?.orientation?.addEventListener('change')` and `window.addEventListener('orientationchange')`. Rotating a tablet from portrait to landscape immediately unlocks the interface.
3. **Back-Forward Cache (bfcache) Restoration:**  
   Listens to `window.addEventListener('pageshow')` and inspects `event.persisted`. Restoring a page from browser history triggers an immediate policy re-evaluation.
4. **Tab Visibility:**  
   Listens to `document.addEventListener('visibilitychange')` to re-verify state when returning to the tab.

---

## 5. Prevention of Protected UI Flashing

* `DeviceAccessProvider` initializes state **synchronously** during component construction (`useState(() => evaluateDeviceAccess(collectDeviceSignals()))`).
* If access is denied on first render, `<DeviceAccessGuard>` renders `<DeviceRestrictionScreen>` immediately.
* `<AuthProvider>`, `<LoginView>`, and `<Layout>` are never mounted or rendered while access is denied, eliminating layout shifts and protecting sensitive operational views.

---

## 6. Branded Restriction Screen Features

The restriction screen matches DALEEL's luxury deep navy (`#040D1B` / `#07152B`) and gold (`#DFB76C`) styling:

1. **Contextual Denial Headers:**
   - **Phones:** Red/gold badge with smartphone icon, directing users to desktop/laptop or the native mobile app.
   - **Portrait Tablets:** Gold rotating device animation, instructing user to rotate 90° into landscape.
   - **Narrow Viewports:** Maximize icon with a dynamic live gauge showing current width vs required minimum (e.g. `840px / 1024px`).
2. **Access Policy Matrix:** Clear table summarizing PC, Tablet, and Mobile permissions.
3. **Live Telemetry Box:** Displays detected device class, orientation, and current viewport dimensions.
4. **Manual Re-evaluate Button:** Instant re-check trigger for testing and rapid verification.

---

## 7. Limitations & Security Boundaries

> [!IMPORTANT]
> **Client-Side Device Detection is a Layout & Usability Boundary, NOT a Cryptographic Security Boundary.**
>
> 1. **Client-Side Spoofing:** A technically advanced user can open Chrome DevTools on a laptop and emulate an iPhone User-Agent or device dimensions. Conversely, a rooted mobile phone can spoof screen dimensions via specialized software or debuggers.
> 2. **Backend Protection:** Device access restrictions must **never** replace backend authentication. The DALEEL Express API continues to enforce 256-bit signed JWT authentication (`verifyToken`), role-based access control (RBAC), and database-level validation on every API request regardless of client device.

---

## 8. Verification & Test Suite

The test suite is located in `admin-web/client/src/utils/devicePolicy.test.ts`.

Run tests at any time using:
```bash
cd admin-web/client
npm test
```

### Automated Test Coverage (17 Tests, 100% Passing):
* ✔ Desktop PC with standard viewport (1920x1080) -> ALLOWED
* ✔ Mac desktop with Retina display (1440x900) -> ALLOWED
* ✔ Chromebook laptop (1366x768) -> ALLOWED
* ✔ Classic iPad in landscape (1024x768) -> ALLOWED
* ✔ Touchscreen Windows laptop (Surface Pro, 1920x1080) -> ALLOWED
* ✔ Desktop PC resized below 1024px (980x800) -> BLOCKED (`VIEWPORT_TOO_NARROW`)
* ✔ Modern iPad in landscape (1180x820) -> ALLOWED
* ✔ Android tablet in landscape (1280x800) -> ALLOWED
* ✔ Modern iPad in portrait (820x1180) -> BLOCKED (`TABLET_PORTRAIT_BLOCKED`)
* ✔ Android tablet in portrait (800x1280) -> BLOCKED (`TABLET_PORTRAIT_BLOCKED`)
* ✔ Tablet in landscape split-screen (504x820) -> BLOCKED (`VIEWPORT_TOO_NARROW`)
* ✔ iPhone in portrait (393x852) -> BLOCKED (`PHONE_BLOCKED`)
* ✔ iPhone in landscape (852x393) -> BLOCKED (`PHONE_BLOCKED`)
* ✔ Android phone in portrait (412x915) -> BLOCKED (`PHONE_BLOCKED`)
* ✔ Android phone in landscape (915x412) -> BLOCKED (`PHONE_BLOCKED`)
* ✔ Android phone in Desktop Mode (Linux UA spoof) -> BLOCKED (`PHONE_BLOCKED`)
* ✔ iPhone in Desktop Mode (Macintosh UA spoof) -> BLOCKED (`PHONE_BLOCKED`)
