
# 👻 Necrometer - Ghost Detector

> **🔄 REBUILT VERSION (2026)**: This app has been completely rebuilt to focus on subtle, autonomous anomaly detection. Previous features like user-triggered scans, AR entities, EVP analysis, and temporal echoes have been removed in favor of a more believable, restrained experience.

A sophisticated paranormal activity scanner that simulates anomaly detection using device sensors. The app autonomously monitors environmental changes and presents visual irregularities in a clinical, ambiguous manner.

[![Angular](https://img.shields.io/badge/Angular-20.3-red.svg)](https://angular.io)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.4-blue.svg)](https://capacitorjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org)

## ⚠️ Product Philosophy

This app is **not** a real ghost detector. It is an **experiential scanner** designed to create ambiguity and restraint:

- The app notices things **before** the user does
- Nothing is explicit, repeatable, or user-triggered
- Ambiguity > clarity
- Logs create meaning, not detection
- If it feels "gamey," it's wrong

## ✨ Core Features (Rebuilt + Toolkit)

### Primary Interface
- **📸 Visual Scanner**: Live camera feed with subtle ambient instability
  - Always-on brightness fluctuations (±2-4%)
  - Light digital noise overlay
  - Subtle chromatic aberration at edges
  - Autonomous anomaly manifestation (no user triggers)
- **🧭 Field Toolkit**: EMF graph + analog needle, spirit box word stream, audio spectrum, session controls
- **📟 EMF Visualization**: Smoothed magnetometer values with peak tracking and radar overlay
- **🧪 Session Recorder**: Timeline of EMF spikes, motion interference, and spirit box words
- **🗂️ Export**: JSON session archive (credit/unlock gated)
- **🧰 Settings**: Theme mode + permission status overview

### Anomaly Detection System
- **🔍 Background Monitoring**: Continuous sensor analysis
  - Magnetometer variance tracking
  - Accelerometer/gyroscope monitoring
  - Motion detection with baseline modeling
  - Multi-sensor correlation required for anomalies

### Gating Conditions (All Required)
1. **Cooldown**: 90-180 seconds since last anomaly
2. **Sensor Variance**: 2+ sensors showing elevated variance
3. **User Stillness**: Minimal accelerometer movement
4. **Random Gate**: Probability increases slowly over time

### Visual Anomaly Types
- **Localized Blur**: Drifting blur patches (300-1200ms)
- **Shadow Silhouette**: Brief shadow-like forms
- **Distortion Ripple**: Lagging visual distortion

### App Acknowledgment
- **Delayed Response**: 500-1200ms after anomaly disappears
- **Subtle Indicators**: Corner light pulses + status bar text
- **Clinical Language**: "Unclassified visual irregularity observed"

### Logbook
- **📖 System Log**: Narrative anomaly event log
  - Timestamp + description
  - Duration estimate
  - Clinical, non-theatrical language
  - No raw sensor values exposed
 - **📅 Session Timeline**: Summaries of recent sessions with peak EMF and word counts

## 💸 Monetization Layers

- **Free base**: Scanner, EMF graph, session logging, and logbook
- **Credit unlocks**: Spirit box, audio analyzer, export logs, premium themes
- **Pro tier**: Credits stipend + premium themes
- **Optional sponsor unlocks**: Timed access for audio analyzer

## 🧭 Architecture Overview

See [`src/architecture.md`](src/architecture.md) for a module diagram of the sensor pipeline, toolkit UI, and monetization flow.

## 🖼️ Screenshots

- Field Toolkit View: ![Toolkit view](https://github.com/user-attachments/assets/ec904b69-e584-428b-9ece-6d8cfcc8776b)

## ❌ Removed Features

The following features have been intentionally removed:
- ~~Scanner with EMF waveform~~
- ~~EVP Analyzer~~
- ~~Temporal Echoes (Chrono Scan)~~
- ~~AR Entity Detection~~
- ~~Scene Analysis~~
- ~~AI-Generated Entity Profiles~~
- ~~Containment Rituals~~
- ~~Cross-Reference Database~~
- ~~User-triggered scans~~

## ✨ Advanced Features (Still Available)
- **🎯 Toast Notifications**: Real-time, context-aware notifications for all app events
- **📳 Haptic Feedback**: Tactile feedback for detections, containments, and UI interactions
- **📶 Network Monitoring**: Automatic offline detection with queued request syncing
- **💾 Advanced Caching**: Smart caching with TTL and automatic cleanup
- **📊 Analytics & Telemetry**: Track usage patterns, performance metrics, and detection statistics
- **🌓 Dark Mode**: Auto, light, or dark theme with system preference detection
- **📤 Share Detections**: Share individual or multiple detections via native share
- **📍 Geolocation Tracking**: Track investigation locations with distance calculations
- **💿 Export/Import**: Backup and restore data in JSON or CSV format
- **🎬 Investigation Sessions**: Organize detections into tracked investigation sessions
- **⚡ Performance Monitoring**: Real-time performance tracking and Core Web Vitals
- **🏆 Achievements**: Unlock achievements and track your paranormal investigation progress
- **🌐 PWA Support**: Install as a Progressive Web App with offline capabilities
- **🔧 ESLint & Prettier**: Consistent code quality and formatting
- **🎨 Enhanced UI**: Improved animations, transitions, and visual effects

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd necrometer_-ghost-detector
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure your API key**:
   - Open `.env.local` and replace `your_gemini_api_key_here` with your actual Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   - Alternatively, you can configure the API key at runtime through the app's settings

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

## 📱 Mobile Development

### Android

1. **Build the web app**:
   ```bash
   npm run build
   ```

2. **Sync with Android**:
   ```bash
   npm run sync:android
   ```

3. **Open in Android Studio**:
   ```bash
   npm run open:android
   ```

### iOS

1. **Build the web app**:
   ```bash
   npm run build
   ```

2. **Sync with iOS**:
   ```bash
   npm run sync:ios
   ```

3. **Open in Xcode**:
   ```bash
   npm run open:ios
   ```

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run build:prod` | Build with production optimizations |
| `npm run sync:android` | Sync web assets to Android platform |
| `npm run open:android` | Open project in Android Studio |
| `npm run sync:ios` | Sync web assets to iOS platform |
| `npm run open:ios` | Open project in Xcode |
| `npm run cap:sync` | Sync all Capacitor platforms |
| `npm test` | Run tests (coming soon) |

## 🧰 Sensor Tuning

- EMF smoothing: `DeviceStateService` low-pass filter (100ms tick)
- Sensor variance gating: `SensorService.deviationCount()` (15% variance)
- Spirit box gate: `SpiritBoxService` (EMF variance + cooldown)

## 🏗️ Project Structure

```
necrometer_-ghost-detector/
├── src/
│   ├── components/          # UI components
│   │   ├── scanner/         # Main detection scanner
│   │   ├── vision/          # AI vision analysis
│   │   ├── evp/             # EVP analyzer
│   │   ├── echoes/          # Temporal echoes
│   │   ├── logbook/         # Entity logbook
│   │   ├── spectral-map/    # Paranormal mapping
│   │   ├── geo-triangulator/# Location triangulation
│   │   └── upgrade/         # Pro upgrade management
│   ├── services/            # Business logic
│   │   ├── gemini.service.ts       # AI integration
│   │   ├── audio.service.ts        # Audio effects
│   │   ├── sensor.service.ts       # Device sensors
│   │   ├── persistence.service.ts  # Data storage
│   │   ├── environment.service.ts  # Environment config
│   │   ├── logger.service.ts       # Logging
│   │   └── upgrade.service.ts      # Pro features
│   ├── types.ts             # TypeScript definitions
│   ├── styles.css           # Global styles
│   └── app.component.ts     # Root component
├── android/                 # Android platform
├── ios/                     # iOS platform (if added)
├── dist/                    # Build output
├── index.html              # App entry point
├── index.tsx               # App bootstrap
├── angular.json            # Angular configuration
├── capacitor.config.ts     # Capacitor configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
└── README.md              # This file
```

## 🛠️ Technologies Used

- **[Angular 20](https://angular.io)**: Modern web framework with zoneless change detection
- **[Capacitor 7](https://capacitorjs.com)**: Native mobile capabilities
- **[Google Gemini AI](https://ai.google.dev)**: AI-powered entity analysis and image generation
- **[RxJS 7](https://rxjs.dev)**: Reactive programming
- **[Tailwind CSS](https://tailwindcss.com)**: Utility-first styling
- **[TypeScript 5.8](https://www.typescriptlang.org)**: Type-safe development

## 🎮 How to Use

1. **Grant Permissions**: Allow camera and sensor access when prompted
2. **Configure API**: If not set via `.env.local`, tap the settings icon to configure your Gemini API key
3. **Start Scanning**: The scanner will automatically begin detecting paranormal activity
4. **Explore Modes**:
   - 📡 **Scanner**: Real-time EMF detection
   - 👁️ **Vision**: AI-powered scene analysis
   - 🎤 **EVP**: Voice phenomenon detection
   - ⏰ **Echoes**: Historical event discovery
   - 📖 **Logbook**: View all detected entities
   - 🛒 **Store**: Upgrade to Pro mode

## 🔧 Configuration

### Environment Variables

Create or edit `.env.local`:

```env
# Required: Your Gemini API key
GEMINI_API_KEY=your_api_key_here

# Optional: Server proxy configuration (advanced)
# PROXY_BASE_URL=https://your-server.com
# PROXY_TOKEN=your_token
```

### Runtime Configuration

You can also configure the API key at runtime:
- Click the ⚙️ settings icon in the app
- Enter your Gemini API key when prompted
- The key will be stored securely in localStorage

## 🐛 Troubleshooting

### Camera Permission Issues
- **Web**: Ensure you're using HTTPS or localhost
- **Mobile**: Check app permissions in device settings
- The app will attempt rear camera first, then fallback to front camera

### API Key Issues
- Verify your key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check the browser console for detailed error messages
- Try clearing localStorage and re-entering the key

### Build Errors
- Ensure Node.js version is 18 or higher
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Angular cache: `rm -rf .angular`

## 📄 License

This project is provided as-is for educational and entertainment purposes.

## 🙏 Acknowledgments

- Built with [Google AI Studio](https://ai.studio)
- Powered by [Gemini AI](https://ai.google.dev)
- Paranormal research inspired by real EMF detection principles

## 🔮 Future Enhancements

- [ ] Real-time collaboration mode
- [ ] Cloud sync for detections
- [ ] Advanced spectral analysis
- [ ] Integration with real EMF sensors
- [ ] Multi-language support
- [ ] Augmented reality overlays
- [ ] Offline mode improvements

---

**⚠️ Disclaimer**: This app is for entertainment purposes. Any paranormal detections should not be taken as scientific evidence of supernatural activity.
