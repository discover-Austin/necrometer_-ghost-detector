# CLAUDE.md - Comprehensive AI Assistant Guide for Necrometer

This document provides exhaustive context for AI assistants working on the Necrometer codebase, including all features, known issues, and development guidelines.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Philosophy](#core-philosophy)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [All Services (31 Total)](#all-services-31-total)
6. [All Components (5 Total)](#all-components-5-total)
7. [Build Commands](#build-commands)
8. [Known Issues and Errors](#known-issues-and-errors)
9. [Security Vulnerabilities](#security-vulnerabilities)
10. [Code Conventions](#code-conventions)
11. [Patterns and Best Practices](#patterns-and-best-practices)
12. [Testing Status](#testing-status)
13. [CI/CD Pipeline](#cicd-pipeline)
14. [Mobile Development](#mobile-development)
15. [API and External Services](#api-and-external-services)
16. [Guidelines for AI Assistants](#guidelines-for-ai-assistants)

---

## Project Overview

**Necrometer - Ghost Detector** is a paranormal activity simulator web/mobile application. It creates an immersive, ambiguous experience through autonomous anomaly detection using real device sensors (magnetometer, accelerometer, gyroscope).

**App ID**: `com.ghosted_necrometer.app`
**App Name**: `Ghosted-Necrometer`
**Version**: 1.0.0

### What This App Does

1. **Vision Scanner**: Live camera feed with subtle visual anomalies (blur, shadow, distortion, edge artifacts)
2. **Anomaly Detection**: Autonomous detection based on sensor readings with 6 gating conditions
3. **Toolkit**: EMF monitoring, spirit box, audio analyzer, session controls, and settings
4. **System Logbook**: Records and displays detected anomaly events and investigation sessions
5. **Credit Store**: In-app purchase simulation for credits, Pro subscription, and feature unlocks
6. **Toast Notifications**: User feedback system

### Navigation (4 Views)

```
vision   -> VisionComponent   (camera + ambient instability + anomaly display)
toolkit  -> ToolkitComponent  (EMF, spirit box, audio analyzer, sessions, settings)
logbook  -> LogbookComponent  (anomaly events + session timeline + export)
store    -> UpgradeComponent  (credits + Pro subscription + feature unlocks)
```

---

## Core Philosophy

These principles guide all development decisions:

1. **Ambiguity over explicitness** - Effects should be subtle, not theatrical
2. **Autonomous detection** - System detects anomalies before users notice them
3. **Clinical language** - Use restrained, technical-sounding terminology
4. **Logs create meaning** - The logbook provides context, not the detection itself
5. **Non-repeatable** - Avoid predictable patterns that users can exploit

**Example descriptions** (clinical, not theatrical):
- "Unclassified visual irregularity observed"
- "Anomalous pattern flagged"
- "Transient anomaly recorded"

---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend Framework | Angular | 20.3 |
| Language | TypeScript | 5.8 |
| Styling | Tailwind CSS | latest |
| Reactive | RxJS | 7.8 |
| Mobile | Capacitor | 7.4 |
| AI Integration | Google Gemini AI | @google/genai 1.22 |
| Camera | @capacitor-community/camera-preview | 7.0 |
| Voice | capacitor-voice-recorder | 6.1.0-2 |

### Key Angular Features Used

- **Zoneless change detection** (`provideZonelessChangeDetection()`)
- **Signals** for reactive state management
- **Effects** for side effects
- **Computed** for derived state
- **OnPush change detection** on all components

---

## Directory Structure

```
necrometer_-ghost-detector/
├── src/
│   ├── app.component.ts              # Root component (187 lines)
│   ├── app.component.html            # Main layout with header/footer/views/onboarding
│   ├── main.ts                       # Bootstrap with zoneless CD + HttpClient
│   ├── polyfills.ts                  # Browser polyfills
│   ├── types.ts                      # TypeScript interfaces (complete)
│   ├── styles.css                    # Global styles
│   ├── index.html                    # HTML entry point
│   │
│   ├── components/
│   │   ├── vision/
│   │   │   ├── vision.component.ts   # Camera scanner (163 lines)
│   │   │   ├── vision.component.html # Scanner template
│   │   │   └── vision.component.css  # Anomaly animations
│   │   ├── toolkit/
│   │   │   ├── toolkit.component.ts  # Toolkit panels (101 lines)
│   │   │   ├── toolkit.component.html
│   │   │   └── toolkit.component.css
│   │   ├── logbook/
│   │   │   ├── logbook.component.ts  # Event log + sessions (69 lines)
│   │   │   └── logbook.component.html
│   │   ├── upgrade/
│   │   │   ├── upgrade.component.ts  # Store/credits (27 lines)
│   │   │   └── upgrade.component.html
│   │   └── toast/
│   │       └── toast.component.ts    # Toast notifications (126 lines)
│   │
│   └── services/                     # 31 services total
│       ├── anomaly-detection.service.ts
│       ├── sensor.service.ts
│       ├── device-state.service.ts
│       ├── camera-analysis.service.ts   # NEW
│       ├── gemini.service.ts
│       ├── audio.service.ts
│       ├── audio-analyzer.service.ts    # NEW
│       ├── spirit-box.service.ts        # NEW
│       ├── emf-log.service.ts           # NEW
│       ├── session-log.service.ts       # NEW
│       ├── monetization.service.ts      # NEW
│       ├── permission.service.ts        # NEW
│       ├── persistence.service.ts
│       ├── cache.service.ts
│       ├── theme.service.ts
│       ├── network.service.ts
│       ├── geolocation.service.ts
│       ├── performance.service.ts
│       ├── logger.service.ts
│       ├── haptic.service.ts
│       ├── share.service.ts
│       ├── export-import.service.ts
│       ├── investigation-session.service.ts
│       ├── achievement.service.ts
│       ├── analytics.service.ts
│       ├── upgrade.service.ts
│       ├── environment.service.ts
│       ├── offline-queue.service.ts
│       ├── global-error-handler.service.ts
│       ├── scheduler.service.ts
│       └── toast.service.ts
│
├── server/                           # Express.js proxy server
│   ├── index.js                      # Main server (rate limiting, JWT auth)
│   ├── issue-token-cli.js            # JWT CLI tool
│   ├── package.json                  # Server dependencies
│   ├── __tests__/                    # Jest unit tests
│   └── tests/                        # Integration tests
│
├── android/                          # Capacitor Android platform
├── public/                           # PWA assets (manifest.json)
├── scripts/                          # Build scripts
│
├── Configuration Files:
│   ├── package.json
│   ├── tsconfig.json
│   ├── angular.json
│   ├── capacitor.config.ts
│   ├── tailwind.config.js
│   ├── .eslintrc.json
│   ├── .prettierrc
│   └── metadata.json
│
└── Documentation:
    ├── README.md
    ├── CONTRIBUTING.md
    ├── SECURITY.md
    └── GEMINI.md
```

---

## All Services (31 Total)

### Core Detection Services

| Service | File | Purpose |
|---------|------|---------|
| **AnomalyDetectionService** | `anomaly-detection.service.ts` | Core autonomous detection with 6 gating conditions (see Patterns section). Runs 500ms check loop |
| **SensorService** | `sensor.service.ts` | Device orientation, motion (accelerometer), magnetometer access. Tracks deviation count and stability score. Handles iOS permission requests |
| **DeviceStateService** | `device-state.service.ts` | EMF reading computation with baseline adaptation and exponential smoothing. Tracks highest EMF |
| **CameraAnalysisService** | `camera-analysis.service.ts` | Visual noise scoring via frame analysis (brightness change, edge density). Captures frames every 500ms. Smoothed score (0-1) feeds into anomaly gate 5 |

### AI Services

| Service | File | Purpose |
|---------|------|---------|
| **GeminiService** | `gemini.service.ts` | Google Gemini AI integration for entity profiles, scene analysis, EVP messages, temporal echoes. Supports proxy configuration |

### Media Services

| Service | File | Purpose |
|---------|------|---------|
| **AudioService** | `audio.service.ts` | Sound effects (UI click, detection, success, contain) and static noise. Static level tied to EMF reading. Voice recording via capacitor-voice-recorder |
| **AudioAnalyzerService** | `audio-analyzer.service.ts` | Web Audio API integration. Captures microphone input and computes frequency spectrum (low/mid/high bands). Feature-gated by MonetizationService |
| **SpiritBoxService** | `spirit-box.service.ts` | AI-free word generation from 42-word dictionary. EMF-gated emission: higher EMF = higher chance and shorter cooldown. Word log persisted in localStorage (max 40 entries) |
| **HapticService** | `haptic.service.ts` | Tactile feedback patterns: light/medium/heavy impacts, paranormalPulse(), containmentSuccess() |

### Session & Logging Services

| Service | File | Purpose |
|---------|------|---------|
| **SessionLogService** | `session-log.service.ts` | Investigation session management. Tracks EMF spikes (>65), motion interference (<0.6 stability), spirit box words. Stores up to 20 sessions. 2.5s watcher interval |
| **EmfLogService** | `emf-log.service.ts` | EMF history tracking with 2-second intervals. Stores up to 120 entries. Peak EMF calculation. Persisted to localStorage |
| **InvestigationSessionService** | `investigation-session.service.ts` | Session management with location, detections, notes, statistics |

### Monetization Services

| Service | File | Purpose |
|---------|------|---------|
| **MonetizationService** | `monetization.service.ts` | Feature unlock system with credits. Features: spiritBox (20 NC), audioAnalyzer (15 NC), exportLogs (10 NC), premiumThemes (10 NC). Supports permanent credit unlocks and temporary 20-minute ad unlocks. Pro subscription grants all features |
| **UpgradeService** | `upgrade.service.ts` | Credit system (starts with 15 NC), Pro subscription simulation, credit spending/adding |

### Data Services

| Service | File | Purpose |
|---------|------|---------|
| **PersistenceService** | `persistence.service.ts` | localStorage management for detected entities |
| **CacheService** | `cache.service.ts` | In-memory cache with TTL (5 min default), 100 item max, LRU eviction |
| **ExportImportService** | `export-import.service.ts` | JSON/CSV export and import of detection data. Export gated by MonetizationService |
| **SchedulerService** | `scheduler.service.ts` | Task scheduling with rrule support for recurring events |

### Platform Services

| Service | File | Purpose |
|---------|------|---------|
| **NetworkService** | `network.service.ts` | Online/offline detection with Capacitor Network plugin |
| **GeolocationService** | `geolocation.service.ts` | Location tracking with Haversine distance calculation |
| **ThemeService** | `theme.service.ts` | Dark/light/auto mode with system preference detection. Non-auto modes gated by premiumThemes feature |
| **EnvironmentService** | `environment.service.ts` | Environment detection (dev/prod/native/mobile), storage helpers with `necrometer.` prefix |
| **ShareService** | `share.service.ts` | Native sharing of entities and reports |
| **PermissionService** | `permission.service.ts` | Tracks permission states (sensors/camera/microphone) and onboarding completion. Persisted to localStorage |

### Monitoring Services

| Service | File | Purpose |
|---------|------|---------|
| **LoggerService** | `logger.service.ts` | Structured logging with levels (DEBUG, INFO, WARN, ERROR), performance timers |
| **PerformanceService** | `performance.service.ts` | Performance marks/measures, Core Web Vitals (LCP, FID), long task monitoring |
| **AnalyticsService** | `analytics.service.ts` | Event tracking for detections, containments, features, API calls |
| **GlobalErrorHandler** | `global-error-handler.service.ts` | Catches unhandled errors, user-friendly messages |

### User Experience Services

| Service | File | Purpose |
|---------|------|---------|
| **ToastService** | `toast.service.ts` | Toast notifications (success, error, warning, info) with auto-dismiss |
| **AchievementService** | `achievement.service.ts` | 10 achievements across 4 categories (detection, containment, exploration, mastery) |
| **OfflineQueueService** | `offline-queue.service.ts` | Queues API requests when offline, syncs when restored |

---

## All Components (5 Total)

### AppComponent (Root)
- **File**: `src/app.component.ts` (187 lines)
- **Selector**: `app-root`
- **Views**: vision, toolkit, logbook, store
- **Features**: View switching with fade animations, keyboard navigation (Arrow keys, Enter/Space), new detection badge, onboarding overlay, audio initialization on first interaction, skip-to-main accessibility link

### VisionComponent
- **File**: `src/components/vision/vision.component.ts` (163 lines)
- **Selector**: `app-vision`
- **Features**:
  - Live camera feed via CameraPreview (rear camera)
  - Ambient instability (brightness fluctuation, noise opacity, chromatic aberration at ~60fps)
  - Anomaly manifestations (blur, shadow, distortion, edge-artifact)
  - Minimal HUD with EMF reading
  - App state listener to restart camera on resume
  - Permission status updates for camera

### ToolkitComponent
- **File**: `src/components/toolkit/toolkit.component.ts` (101 lines)
- **Selector**: `app-toolkit`
- **Panels**: emf, spirit, audio, session, settings
- **Features**:
  - EMF panel: Real-time EMF readings from EmfLogService
  - Spirit box panel: Word emission display, feature-gated (20 NC or ad unlock)
  - Audio analyzer panel: Frequency spectrum (low/mid/high), feature-gated (15 NC)
  - Session panel: Start/end investigation sessions, session status
  - Settings panel: Theme switching (auto free, light/dark gated as premiumThemes)
  - Auto-starts session and EMF logging on init

### LogbookComponent
- **File**: `src/components/logbook/logbook.component.ts` (69 lines)
- **Selector**: `app-logbook`
- **Features**: Two tabs (anomalies/sessions), event list with collapsible details, timestamp/type/duration/position display, session timeline, export functionality (gated by exportLogs feature)

### UpgradeComponent
- **File**: `src/components/upgrade/upgrade.component.ts` (27 lines)
- **Selector**: `app-upgrade`
- **Features**: Credit balance display, credit packs ($0.99/$1.99/$4.99), Pro subscription ($4.99/mo), individual feature unlock buttons via MonetizationService

### ToastComponent
- **File**: `src/components/toast/toast.component.ts` (126 lines)
- **Selector**: `app-toast`
- **Features**: Slide-in animations, dismissible, auto-timeout, color-coded by type (success/error/warning/info), icon support

---

## Build Commands

```bash
# Development
npm run dev              # Start dev server
npm run lint             # Run ESLint (working - uses typescript-eslint)

# Production
npm run build            # Standard build
npm run build:prod       # Optimized production build

# Mobile
npm run sync:android     # Sync to Android
npm run open:android     # Open Android Studio
npm run sync:ios         # Sync to iOS
npm run open:ios         # Open Xcode
npm run cap:sync         # Sync all platforms

# TypeScript
npx tsc --noEmit         # Type check only (passes)
```

---

## Known Issues and Errors

### Build Warnings

1. **Font Inlining Failure (403)**
   - **Error**: `Inlining of fonts failed. https://fonts.googleapis.com/css2?family=Chakra+Petch returned status code: 403`
   - **Location**: `src/index.html:12`
   - **Impact**: Production build may warn/fail in some CI environments
   - **Fix Options**:
     - Disable font inlining in `angular.json` with `"optimization": { "fonts": false }`
     - Host fonts locally
     - Use different font loading strategy

### Minor Code Issues

1. **Any Types**: Several services use `any` type (e.g., `magnetometerSensor: any` in sensor.service.ts, `analysisInterval: any` in camera-analysis.service.ts)

### Resolved Issues

The following issues from previous versions have been fixed:

- ~~Missing type definitions in `src/types.ts`~~ - All types now complete
- ~~ESLint not configured~~ - Now working with `@typescript-eslint` and `eslint-config-prettier`
- ~~Duplicate CI workflow~~ - `ci.yml` is now clean with proper job structure
- ~~Unused Renderer2 import~~ - Removed from `app.component.ts`

---

## Security Vulnerabilities

**22 total vulnerabilities (6 moderate, 16 high)** from `npm audit`:

### High Severity

| Package | Vulnerability | Advisory |
|---------|--------------|----------|
| @angular/compiler | XSS via SVG/MathML attributes | GHSA-v4hv-rgfq-gp49 |
| @angular/compiler | XSS via unsanitized SVG attributes | GHSA-jrmj-c5cx-3cw6 |
| @angular/common | XSRF token leakage via protocol-relative URLs | GHSA-58c5-g7wp-6w37 |
| body-parser | DoS when url encoding is used | GHSA-wqch-xfxh-vrr4 |
| glob | Command injection via -c/--cmd | GHSA-5j98-mcp5-4vw2 |
| jws | HMAC signature verification bypass | GHSA-869p-cjfg-cm3x |
| node-forge | ASN.1 vulnerabilities (multiple) | GHSA-554w-wpv2-vw27 |
| qs | arrayLimit bypass causing DoS | GHSA-6rw7-vpxm-498p |
| tar | Path traversal, symlink poisoning | GHSA-29xp-372q-xqph |
| @modelcontextprotocol/sdk | DNS rebinding, ReDoS | GHSA-w48q-cv73-mx4w |

### Resolution

```bash
# Safe fixes (non-breaking)
npm audit fix

# All fixes (may have breaking changes)
npm audit fix --force
```

---

## Code Conventions

### TypeScript/Angular

```typescript
// Use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Use signals for reactive state
readonly count = signal(0);
readonly doubled = computed(() => this.count() * 2);

// Use effects for side effects
effect(() => {
  console.warn('Count changed:', this.count());
});

// Inject services (preferred modern syntax)
private readonly service = inject(ServiceName);
```

### ESLint Rules

- `@typescript-eslint/no-explicit-any`: warn
- `no-console`: warn (allow `warn` and `error` only)
- `prefer-const`: warn
- `no-var`: error
- Unused vars with `_` prefix are ignored

### Prettier Config

- Single quotes
- Semicolons enabled
- 100 character line width
- 2 space indentation

### Commit Messages (Conventional Commits)

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code restructuring
test: add/update tests
chore: maintenance tasks
```

---

## Patterns and Best Practices

### Anomaly Detection Gating (6 conditions)

All 6 conditions must pass for an anomaly to trigger:

```typescript
// Gate 1: Cooldown - 90-180 seconds since last anomaly (randomized)
// Gate 2: Attention level - Accumulated threshold (>0.55), increments +0.004 per tick
// Gate 3: Stability score - Device stillness from SensorService (>0.72)
// Gate 4: Deviation count - 2+ sensors with variance (>0.15 deviation)
// Gate 5: Visual noise - CameraAnalysisService score between 0.12-0.45
// Gate 6: Random probability - attentionLevel * 0.035 chance per tick
```

After triggering:
1. Render delay: 220-680ms before showing anomaly
2. Display duration: 700-1100ms
3. Acknowledgment delay: 350-650ms after display ends
4. Attention drops by 0.65, cooldown starts (90-180s random)

### Monetization Gating Pattern

```typescript
// Check feature access before enabling functionality
if (!this.monetization.isFeatureUnlocked('spiritBox')) {
  this.toast.warning('Feature locked.');
  return;
}

// Unlock methods:
// 1. Credit purchase (permanent): monetization.unlockFeatureWithCredits(feature)
// 2. Ad unlock (20 minutes): monetization.unlockFeatureWithAd(feature)
// 3. Pro subscription (all features): upgrade.subscribeToPro()
```

### Feature Costs (Necro-Credits)

| Feature | Cost (NC) | Description |
|---------|-----------|-------------|
| spiritBox | 20 | Spirit Box word emission |
| audioAnalyzer | 15 | Audio frequency spectrum |
| exportLogs | 10 | Session/log export |
| premiumThemes | 10 | Light/dark theme modes |

### Service Injection Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  private readonly logger = inject(LoggerService);
  private readonly env = inject(EnvironmentService);
}
```

### Error Handling Pattern

```typescript
try {
  // Operation
} catch (error) {
  this.logger.error('Operation failed', error);
  this.toast.error('User-friendly message');
}
```

### Storage Pattern

```typescript
// Use EnvironmentService for prefixed storage
this.env.setStorageItem('key', value);  // Stores as 'necrometer.key'
this.env.getStorageItem('key');
```

### Anomaly Types and CSS

| Type | Visual Effect | CSS Class |
|------|--------------|-----------|
| blur | Localized blur that drifts | `.anomaly-blur` |
| shadow | Brief shadow silhouette | `.anomaly-shadow` |
| distortion | Expanding ripple | `.anomaly-distortion` |
| edge-artifact | Edge lighting contradiction | `.anomaly-edge-artifact` |

### Spirit Box Dictionary

42 unique words used for spirit box emission (clinical/ambiguous tone):
`whisper`, `through`, `signal`, `behind`, `silence`, `listen`, `cold`, `north`, `stay`, `leave`, `beneath`, `close`, `echo`, `hold`, `drift`, `open`, `follow`, `wait`, `near`, `lost`, `return`, `veil`, `hollow`, `memory`, `trace`, `still`, `latch`, `below`, `static`, `quiet`, `faint`, `shadow`, `remain`, `lumen`, `glance`, `hush`, `crawl`, `sight`, `soft`, `frozen`, `edge`, `radius`

---

## Testing Status

### Client-Side
- **Status**: No tests implemented
- **Script**: `npm test` outputs "Tests coming soon"
- **Need**: Unit tests for services and components

### Server-Side
- **Status**: Jest tests exist
- **Location**: `server/__tests__/`, `server/tests/`
- **Run**: `cd server && npm test`

---

## CI/CD Pipeline

### GitHub Actions Workflows

**ci.yml** (2 jobs, clean structure):
1. **server-tests**: Install server deps, run Jest tests with dummy env vars
2. **client-build** (depends on server-tests): Install root deps, TypeScript check, ESLint, Angular build

**e2e.yml**:
- Manual trigger + PR-based for live integration tests
- Requires secrets: `GENAI_API_KEY`, `JWT_ISSUER_SECRET`, `SHARED_ISSUANCE_TOKEN`

---

## Mobile Development

### Android

```bash
npm run build
npm run sync:android
npm run open:android
```

**AndroidManifest.xml Permissions** (minimal set for Play Store compliance):
- `android.permission.INTERNET` - API communication
- `android.permission.CAMERA` - Visual effects overlay
- `android.permission.RECORD_AUDIO` - Sound-reactive features

**Hardware Feature Declarations** (all optional):
```xml
<uses-feature android:name="android.hardware.camera" android:required="false"/>
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false"/>
<uses-feature android:name="android.hardware.microphone" android:required="false"/>
```

**SDK Versions** (variables.gradle):
- `minSdkVersion = 23`
- `compileSdkVersion = 35`
- `targetSdkVersion = 35`

### iOS

```bash
npm run build
npm run sync:ios
npm run open:ios
```

**Info.plist Keys Required**:
- `NSCameraUsageDescription` - "Creates visual atmosphere effects"
- `NSMicrophoneUsageDescription` - "Optional sound-reactive animations"

---

## Play Store Compliance

This section documents critical requirements for Google Play Store approval.

### Entertainment Disclaimer (REQUIRED)

The app MUST clearly state it's for entertainment only:

1. **In-app modal** (implemented in onboarding): Shows before permissions
2. **Store description**: Must include disclaimer text
3. **Privacy policy**: Required for apps using camera/microphone

**Required store description text**:
> This app is intended for entertainment purposes only and does not provide real paranormal detection.

### Permissions Policy

**DO NOT add these permissions** (will cause rejection):
- `WRITE_EXTERNAL_STORAGE` - Not needed, blocked on Android 11+
- `MODIFY_AUDIO_SETTINGS` - Flags "audio manipulation"
- `ACCESS_FINE_LOCATION` - Only if actually needed

**Pre-permission rationale UI**: Required for sensitive permissions (camera, microphone). Implemented in onboarding overlay explaining:
- Camera → visual effects only
- Microphone → sound-reactive animation only

### Data Safety Form

When submitting to Play Console, declare:
- Data collected: NONE
- Data shared: NONE
- Audio recorded: NO (not stored)
- Images stored: NO (not stored)

### Package Name

Current: `com.ghosted_necrometer.app`

Note: Contains "ghost" which may flag paranormal review pipeline. Consider neutral alternative for future releases.

---

## API and External Services

### Google Gemini AI

**Direct Client Usage**:
```typescript
const gemini = inject(GeminiService);
gemini.setApiKey('your-api-key');
```

**Proxy Configuration** (recommended for production):
```typescript
gemini.setProxyConfig('https://your-proxy.com', 'shared-token');
```

**Available Methods**:
- `getEntityProfile(strength)` - Generate entity with glyph
- `analyzeScene(imageBase64)` - Identify objects in image
- `getEVPMessage()` - Generate EVP transcription
- `getTemporalEcho()` - Generate historical echo
- `crossReferenceEntity(entity)` - Check spectral database
- `getEmotionalResonance(entity)` - Analyze entity emotions
- `getContainmentRitual(entity)` - Generate containment steps

### Server Proxy Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/issue-token` | POST | Get short-lived JWT (15 min) |
| `/health` | GET | Health check |
| `/api/generate-entity-profile` | POST | Entity generation |
| `/api/analyze-scene` | POST | Scene analysis |
| `/api/temporal-echo` | POST | Temporal echo |
| `/transcribe` | POST | Audio transcription (501 not implemented) |

**Server Features**: Rate limiting (60 req/min/IP), JWT-based auth middleware, CORS, Helmet security headers.

---

## Guidelines for AI Assistants

### DO

1. **Read files before modifying** - Never propose changes to unread code
2. **Use OnPush change detection** on all components
3. **Use signals** for reactive state, effects for side effects
4. **Follow clinical language** for anomaly descriptions
5. **Check for security vulnerabilities** when adding dependencies
6. **Add missing types** to `src/types.ts` when needed
7. **Use EnvironmentService** for storage operations
8. **Handle permissions gracefully** with fallbacks
9. **Use MonetizationService** to gate premium features
10. **Use LoggerService** for structured logging

### DON'T

1. **Don't use `console.log`** - Use LoggerService or console.warn/error
2. **Don't expose API keys** in client code
3. **Don't make detection patterns predictable**
4. **Don't use theatrical language** - Keep it clinical
5. **Don't add Zone.js** - App uses zoneless change detection
6. **Don't skip error handling** - Always catch and log errors
7. **Don't bypass monetization gates** - Respect the feature unlock system

### Priority Fixes Needed

1. **HIGH**: Run `npm audit fix` for security vulnerabilities
2. **MEDIUM**: Fix font inlining build warning
3. **LOW**: Add unit tests for core services
4. **LOW**: Replace remaining `any` types with proper types

### Custom Tailwind Classes

```css
/* Color Palettes */
spectral-{50-950}   /* Cyan/teal - primary UI */
ectoplasm-{400-500} /* Green - anomaly indicators */
obsidian-{800-950}  /* Dark grays - backgrounds */
warning-{400-500}   /* Amber - credits/warnings */

/* Custom Classes in styles.css */
.glass-panel       /* Frosted glass effect */
.neon-text         /* Glowing text */
.pulse-glow        /* Pulsing animation */
.scanlines         /* CRT scanline overlay */
.view-fade-in      /* View transition */
```

---

## Removed Features (Historical Context)

The 2026 rebuild removed these features for cleaner autonomous detection:

- AR entity overlays
- EVP audio analysis (methods remain in GeminiService but unused)
- Temporal echoes (methods remain in GeminiService but unused)
- Scene analysis (methods remain in GeminiService but unused)
- User-triggered scans
- Chrono-scan feature

---

## Quick Reference

```bash
# Install and run
npm install
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Before committing
npm run build:prod

# Check security
npm audit

# Mobile deployment
npm run build && npm run cap:sync
```

---

*Last updated: 2026-02-06*
