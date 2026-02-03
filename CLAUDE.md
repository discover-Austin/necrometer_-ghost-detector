# CLAUDE.md - AI Assistant Guide for Necrometer

This document provides essential context for AI assistants working on the Necrometer codebase.

## Project Overview

**Necrometer - Ghost Detector** is a paranormal activity simulator web/mobile application built with Angular 20 and Capacitor. It creates an immersive experience through autonomous anomaly detection using device sensors.

### Core Philosophy

- **Ambiguity over explicitness** - Effects should be subtle and non-repeatable
- **Autonomous detection** - System detects anomalies before users notice them
- **Clinical language** - Use restrained, non-theatrical terminology
- **Logs create meaning** - The logbook provides context, not the detection itself

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 20.3 (zoneless change detection) |
| Language | TypeScript 5.8 |
| Styling | Tailwind CSS with custom palettes |
| Mobile | Capacitor 7.4 (iOS/Android) |
| AI | Google Gemini AI (@google/genai) |
| Reactive | RxJS 7.8 |
| Server | Express 4.18 (optional proxy) |

## Directory Structure

```
src/
├── components/          # UI components
│   ├── logbook/        # Anomaly event log display
│   ├── vision/         # Main camera scanner with anomalies
│   ├── toast/          # Toast notifications
│   └── upgrade/        # Pro upgrade interface
├── services/           # 24 business logic services
│   ├── anomaly-detection.service.ts  # Core detection logic
│   ├── sensor.service.ts             # Device sensors
│   ├── device-state.service.ts       # EMF state management
│   ├── gemini.service.ts             # AI integration
│   ├── camera-preview/               # Camera functionality
│   └── ...                           # See full list below
├── app.component.ts    # Root component
├── types.ts            # TypeScript interfaces
├── styles.css          # Global styles + Tailwind
└── main.ts             # Bootstrap (zoneless)

server/                 # Optional Express proxy
├── index.js           # Main server
├── __tests__/         # Unit tests (Jest)
└── tests/             # Integration tests

android/               # Capacitor Android platform
ios/                   # Capacitor iOS platform (when added)
```

## Build Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run lint             # Run ESLint

# Production
npm run build            # Standard build
npm run build:prod       # Optimized production build

# Mobile
npm run sync:android     # Sync to Android
npm run open:android     # Open Android Studio
npm run sync:ios         # Sync to iOS
npm run open:ios         # Open Xcode
npm run cap:sync         # Sync all platforms
```

## Code Conventions

### TypeScript/Angular

- Use **OnPush change detection** for components
- Prefer **Angular signals** for reactive state
- Use **effects** for side effects, **computed** for derived state
- Avoid `any` type (linter warns)
- Prefix unused variables with underscore (`_unused`)
- Use `console.warn` or `console.error` only (no `console.log`)

### Component Structure

```typescript
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExampleComponent {
  // 1. Public properties
  // 2. Private properties
  // 3. Constructor
  // 4. Lifecycle hooks
  // 5. Public methods
  // 6. Private methods
}
```

### Commit Messages

Follow Conventional Commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `test:` Tests
- `chore:` Maintenance

## Key Services

| Service | Purpose |
|---------|---------|
| `anomaly-detection.service` | Core autonomous anomaly detection with 4 gating conditions |
| `sensor.service` | Device orientation, motion, magnetometer access |
| `device-state.service` | EMF reading computation and smoothing |
| `gemini.service` | Google Gemini AI integration |
| `camera-preview/` | Camera feed management |
| `audio.service` | Sound effects and ambient audio |
| `persistence.service` | localStorage data management |
| `cache.service` | Smart caching with TTL |
| `theme.service` | Dark/light mode |
| `network.service` | Offline detection |
| `geolocation.service` | Location tracking |
| `haptic.service` | Device vibration feedback |
| `upgrade.service` | Pro features (credit system) |

## Anomaly Detection System

The core detection implements 4 gating conditions:
1. **Cooldown** - Minimum time between detections
2. **Sensor variance** - Threshold for sensor fluctuation
3. **User stillness** - Device must be relatively stable
4. **Probability** - Random chance factor for authenticity

Anomaly types include: `blur`, `shadow`, `distortion`, `edge-artifact`

## Styling

### Custom Tailwind Palettes

- **spectral** (cyan/teal) - Primary UI elements
- **ectoplasm** (green) - Anomaly indicators
- **obsidian** (dark grays) - Backgrounds

### Fonts

- `Share Tech Mono` - Monospace (scanner displays)
- `Inter` - Sans-serif (general UI)

## Testing

- **Client tests**: Placeholder (`npm test` - "Tests coming soon")
- **Server tests**: Jest in `server/__tests__/` and `server/tests/`
- CI runs TypeScript checks and production builds

## CI/CD

GitHub Actions workflows:
- **ci.yml** - TypeScript check, server tests, Angular build
- **e2e.yml** - Integration tests (manual trigger)

## Important Files

| File | Purpose |
|------|---------|
| `angular.json` | Angular build configuration |
| `capacitor.config.ts` | Mobile app configuration |
| `tailwind.config.js` | Custom color palettes and animations |
| `.eslintrc.json` | Linting rules |
| `.prettierrc` | Formatting (single quotes, 100 char width) |

## Environment & Secrets

- API keys should use the optional server proxy
- Server uses JWT authentication with short-lived tokens
- Environment config via `environment.service.ts`
- Never commit `.env` files or API keys

## Mobile Development

### Android

```bash
npm run build
npm run sync:android
npm run open:android
```

Required permissions (in AndroidManifest.xml):
- Camera
- Location
- Microphone (for voice recording)

### iOS

```bash
npm run build
npm run sync:ios
npm run open:ios
```

## Common Patterns

### Injecting Services

```typescript
constructor(
  private readonly sensorService: SensorService,
  private readonly anomalyDetection: AnomalyDetectionService
) {}
```

### Using Signals

```typescript
readonly emfLevel = signal<number>(0);
readonly isHighReading = computed(() => this.emfLevel() > 0.7);

// In effects
effect(() => {
  if (this.isHighReading()) {
    this.haptic.vibrate();
  }
});
```

### Error Handling

Use `GlobalErrorHandlerService` for centralized error management. Handle permission denials gracefully with user-friendly fallbacks.

## What NOT to Do

- Don't use `console.log` (use `console.warn` or `console.error`)
- Don't bypass the proxy for API calls in production
- Don't add theatrical/dramatic language to anomaly descriptions
- Don't make detection patterns predictable or repeatable
- Don't ignore TypeScript type warnings

## Removed Features (Historical Context)

The 2026 rebuild removed these features in favor of cleaner autonomous detection:
- AR entity overlays
- EVP audio analysis
- Temporal echoes
- Scene analysis
- User-triggered scans

## Quick Reference

```bash
# Start developing
npm install
npm run dev

# Before committing
npm run lint
npm run build:prod

# Deploy to mobile
npm run build && npm run cap:sync
```
