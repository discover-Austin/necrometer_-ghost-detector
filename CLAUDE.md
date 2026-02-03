# CLAUDE.md - Comprehensive AI Assistant Guide for Necrometer

This document provides exhaustive context for AI assistants working on the Necrometer codebase, including all features, known issues, and development guidelines.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Philosophy](#core-philosophy)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [All Services (24 Total)](#all-services-24-total)
6. [All Components (4 Total)](#all-components-4-total)
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
2. **Anomaly Detection**: Autonomous detection based on sensor readings with 4 gating conditions
3. **System Logbook**: Records and displays detected anomaly events
4. **Credit Store**: In-app purchase simulation for credits and Pro subscription
5. **Toast Notifications**: User feedback system

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
│   ├── app.component.ts              # Root component (117 lines)
│   ├── app.component.html            # Main layout with header/footer/views
│   ├── main.ts                       # Bootstrap with zoneless CD
│   ├── polyfills.ts                  # Browser polyfills
│   ├── types.ts                      # TypeScript interfaces (INCOMPLETE - see issues)
│   ├── styles.css                    # Global styles (218 lines)
│   ├── index.html                    # HTML entry point
│   │
│   ├── components/
│   │   ├── vision/
│   │   │   ├── vision.component.ts   # Camera scanner (156 lines)
│   │   │   ├── vision.component.html # Scanner template
│   │   │   └── vision.component.css  # Anomaly animations (149 lines)
│   │   ├── logbook/
│   │   │   ├── logbook.component.ts  # Event log (33 lines)
│   │   │   └── logbook.component.html
│   │   ├── upgrade/
│   │   │   ├── upgrade.component.ts  # Store/credits (21 lines)
│   │   │   └── upgrade.component.html
│   │   └── toast/
│   │       └── toast.component.ts    # Toast notifications (126 lines)
│   │
│   └── services/                     # 24 services total
│       ├── anomaly-detection.service.ts
│       ├── sensor.service.ts
│       ├── device-state.service.ts
│       ├── gemini.service.ts
│       ├── audio.service.ts
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
│   ├── index.js                      # Main server
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
│   └── .prettierrc
│
└── Documentation:
    ├── README.md
    ├── CONTRIBUTING.md
    ├── SECURITY.md
    └── GEMINI.md
```

---

## All Services (24 Total)

### Core Detection Services

| Service | File | Purpose |
|---------|------|---------|
| **AnomalyDetectionService** | `anomaly-detection.service.ts` | Core autonomous detection with 4 gating conditions: cooldown (90-180s), sensor variance threshold, user stillness, probability gate |
| **SensorService** | `sensor.service.ts` | Device orientation, motion (accelerometer), magnetometer access. Handles iOS permission requests |
| **DeviceStateService** | `device-state.service.ts` | EMF reading computation with baseline adaptation and exponential smoothing |

### AI Services

| Service | File | Purpose |
|---------|------|---------|
| **GeminiService** | `gemini.service.ts` | Google Gemini AI integration for entity profiles, scene analysis, EVP messages, temporal echoes. Supports proxy configuration |

### Media Services

| Service | File | Purpose |
|---------|------|---------|
| **AudioService** | `audio.service.ts` | Sound effects (UI click, detection, success, contain) and static noise. Voice recording via capacitor-voice-recorder |
| **HapticService** | `haptic.service.ts` | Tactile feedback patterns: light/medium/heavy impacts, paranormalPulse(), containmentSuccess() |

### Data Services

| Service | File | Purpose |
|---------|------|---------|
| **PersistenceService** | `persistence.service.ts` | localStorage management for detected entities |
| **CacheService** | `cache.service.ts` | In-memory cache with TTL (5 min default), 100 item max, LRU eviction |
| **ExportImportService** | `export-import.service.ts` | JSON/CSV export and import of detection data |
| **InvestigationSessionService** | `investigation-session.service.ts` | Session management with location, detections, notes, statistics |
| **SchedulerService** | `scheduler.service.ts` | Task scheduling with rrule support for recurring events |

### Platform Services

| Service | File | Purpose |
|---------|------|---------|
| **NetworkService** | `network.service.ts` | Online/offline detection with Capacitor Network plugin |
| **GeolocationService** | `geolocation.service.ts` | Location tracking with Haversine distance calculation |
| **ThemeService** | `theme.service.ts` | Dark/light/auto mode with system preference detection |
| **EnvironmentService** | `environment.service.ts` | Environment detection (dev/prod/native/mobile), storage helpers |
| **ShareService** | `share.service.ts` | Native sharing of entities and reports |

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
| **UpgradeService** | `upgrade.service.ts` | Credit system (starts with 15), Pro subscription simulation |
| **AchievementService** | `achievement.service.ts` | 10 achievements across 4 categories (detection, containment, exploration, mastery) |
| **OfflineQueueService** | `offline-queue.service.ts` | Queues API requests when offline, syncs when restored |

---

## All Components (4 Total)

### AppComponent (Root)
- **File**: `src/app.component.ts`
- **Selector**: `app-root`
- **Views**: vision, logbook, store
- **Features**: View switching with animations, global static/noise overlays, new detection badge

### VisionComponent
- **File**: `src/components/vision/vision.component.ts`
- **Selector**: `app-vision`
- **Features**:
  - Live camera feed via CameraPreview
  - Ambient instability (brightness fluctuation, noise, chromatic aberration)
  - Anomaly manifestations (blur, shadow, distortion, edge-artifact)
  - Minimal HUD with EMF reading
  - Acknowledgment toast after anomaly detection

### LogbookComponent
- **File**: `src/components/logbook/logbook.component.ts`
- **Selector**: `app-logbook`
- **Features**: Event list with collapsible details, timestamp/type/duration/position display

### UpgradeComponent
- **File**: `src/components/upgrade/upgrade.component.ts`
- **Selector**: `app-upgrade`
- **Features**: Credit balance display, credit packs ($0.99/$1.99/$4.99), Pro subscription ($4.99/mo)

### ToastComponent
- **File**: `src/components/toast/toast.component.ts`
- **Selector**: `app-toast`
- **Features**: Slide-in animations, dismissible, auto-timeout, color-coded by type

---

## Build Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run lint             # Run ESLint (CURRENTLY BROKEN - needs angular-eslint)

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

### Critical Build Errors

1. **Font Inlining Failure (403)**
   - **Error**: `Inlining of fonts failed. https://fonts.googleapis.com/css2?family=Chakra+Petch returned status code: 403`
   - **Location**: `src/index.html:12`
   - **Impact**: Production build fails in some CI environments
   - **Fix Options**:
     - Disable font inlining in `angular.json` with `"optimization": { "fonts": false }`
     - Host fonts locally
     - Use different font loading strategy

2. **ESLint Not Configured for Angular**
   - **Error**: `Cannot find "lint" target for the specified project`
   - **Impact**: `npm run lint` fails
   - **Fix**: Run `ng add angular-eslint`

### Missing Type Definitions

The `src/types.ts` file is incomplete. These types are imported by `gemini.service.ts` but don't exist:

```typescript
// Add these to src/types.ts:

export interface TemporalEcho {
  title: string;
  era: string;
  description: string;
}

export interface EVPAnalysis {
  transcription: string;
  confidence: number;
}

export interface CrossReferenceResult {
  match: boolean;
  details: string;
}

export interface EmotionalResonanceResult {
  emotions: string[];
  summary: string;
}

export interface ContainmentRitual {
  steps: string[];
  outcome: string;
}

export interface SceneAnalysisResult {
  objects: SceneObject[];
}

export interface SceneObject {
  name: string;
  polylines: Array<Array<{x: number; y: number}>>;
}

// For scheduler.service.ts:
export interface Schedule {
  id: string;
  name?: string;
  enabled?: boolean;
  rrule?: string;
  intervalMs?: number;
  lastRun?: string;
  nextRun?: string;
}
```

### CI/CD Issues

1. **Duplicate CI Workflow**: `.github/workflows/ci.yml` contains two workflow definitions merged together (lines 1-27 and 28-86) - needs cleanup

### Minor Code Issues

1. **Unused Import**: `Renderer2` imported but not used in `app.component.ts`
2. **Any Types**: Several services use `any` type (e.g., `magnetometerSensor: any` in sensor.service.ts)

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

### Anomaly Detection Gating (4 conditions)

```typescript
// All 4 conditions must pass:
1. Cooldown: 90-180 seconds since last anomaly (randomized)
2. Sensor variance: At least 2 sensors showing variance > 1.5x baseline
3. User stillness: Device motion magnitude < 0.5
4. Probability: Random gate that accumulates 0.01 per check
```

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

**ci.yml** (needs fixing - has duplicate content):
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. TypeScript check (`npx tsc --noEmit`)
5. Run server tests
6. Angular production build

**e2e.yml**:
- Manual trigger for live integration tests
- Requires secrets: `GENAI_API_KEY`, `JWT_ISSUER_SECRET`, `SHARED_ISSUANCE_TOKEN`

---

## Mobile Development

### Android

```bash
npm run build
npm run sync:android
npm run open:android
```

**Required Permissions** (AndroidManifest.xml):
- `android.permission.CAMERA`
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.RECORD_AUDIO`
- `android.permission.VIBRATE`

### iOS

```bash
npm run build
npm run sync:ios
npm run open:ios
```

**Info.plist Keys Required**:
- `NSCameraUsageDescription`
- `NSLocationWhenInUseUsageDescription`
- `NSMicrophoneUsageDescription`

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
| `/issue-token` | POST | Get short-lived JWT |
| `/api/generate-entity-profile` | POST | Entity generation |
| `/api/analyze-scene` | POST | Scene analysis |
| `/api/temporal-echo` | POST | Temporal echo |

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

### DON'T

1. **Don't use `console.log`** - Use LoggerService or console.warn/error
2. **Don't expose API keys** in client code
3. **Don't make detection patterns predictable**
4. **Don't use theatrical language** - Keep it clinical
5. **Don't add Zone.js** - App uses zoneless change detection
6. **Don't skip error handling** - Always catch and log errors

### Priority Fixes Needed

1. **HIGH**: Fix missing type definitions in `src/types.ts`
2. **HIGH**: Run `npm audit fix` for security vulnerabilities
3. **MEDIUM**: Fix font inlining build error
4. **MEDIUM**: Fix duplicate CI workflow in `.github/workflows/ci.yml`
5. **LOW**: Configure angular-eslint for linting
6. **LOW**: Add unit tests for core services

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

# Before committing
npm run build:prod

# Check security
npm audit

# Mobile deployment
npm run build && npm run cap:sync
```

---

*Last updated: 2026-02-03*
