<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Necrometer - Ghost Detector App

A sophisticated paranormal activity scanner powered by Google Gemini AI. Detect, analyze, and catalog supernatural entities using advanced AI-driven features including real-time entity detection, EVP analysis, temporal echoes, and more.

## 🌟 Features

- **Real-time Entity Detection**: Scan your environment for paranormal activity
- **AI-Powered Entity Profiles**: Generate detailed backstories and classifications using Gemini AI
- **AR Camera Overlay**: See spectral entities overlaid on your camera view
- **EVP Recorder**: Record and analyze Electronic Voice Phenomena
- **Temporal Echoes**: Discover historical paranormal events
- **Cross-Reference Database**: Match entities against a global spectral database
- **Entity Logbook**: Track and contain detected entities
- **Upgrades System**: Unlock pro features with in-app credits

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **Android Studio** (for Android builds)
- **Google Gemini API Key** - Get one from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/discover-Austin/necrometer_-ghost-detector.git
   cd necrometer_-ghost-detector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Access**

   You have two options:

   **Option A: Using Proxy Server (Recommended for Production)**
   
   The proxy server keeps your API key secure on the backend.

   ```bash
   # Set up server
   cd server
   npm install
   cp .env.example .env
   # Edit .env and add your keys
   ```

   Edit `src/env.js` to point to your deployed proxy server:
   ```javascript
   window.__env.useProxy = true;
   window.__env.proxyUrl = 'https://your-proxy-server.com';
   window.__env.issuanceToken = 'your_shared_issuance_token';
   ```

   **Option B: Direct API Key (Testing Only)**
   
   ⚠️ Only for local development - never commit API keys!

   Edit `src/env.js`:
   ```javascript
   window.__env.useProxy = false;
   window.__env.apiKey = 'your_gemini_api_key_here';
   ```

4. **Build the app**
   ```bash
   npm run build
   ```

5. **Run on Android**
   ```bash
   npm run sync:android
   npm run open:android
   ```

## 📱 Building for Google Play Store

See the comprehensive [Play Store Build Guide](./PLAY_STORE_BUILD_GUIDE.md) for detailed instructions on:
- Setting up Android platform
- Configuring app signing
- Building release APK/AAB
- Preparing for Play Store submission
- Security best practices

## 🏃 Development

### Run locally (web)
```bash
npm run build
# Then serve the dist folder with any static server
```

### Run on Android device
```bash
npm run build
npm run sync:android
npm run open:android
```

## 📚 Documentation

- [Play Store Build Guide](./PLAY_STORE_BUILD_GUIDE.md) - Complete guide for building and deploying to Play Store
- [Server Documentation](./server/README.server.md) - Proxy server setup and API documentation
- [Environment Configuration](./.env.example) - Environment variables reference

## 🔧 Tech Stack

- **Frontend**: Angular 20, TypeScript, Tailwind CSS
- **Mobile**: Capacitor (iOS & Android)
- **AI**: Google Gemini AI (Gemini 2.5 Flash, Imagen 3.0)
- **Backend**: Express.js proxy server
- **Plugins**: Camera Preview, Voice Recorder, Sensors

## 🛡️ Security

- ✅ API keys are never stored in the client code (use proxy server)
- ✅ JWT-based authentication for API access
- ✅ Rate limiting enabled on all endpoints
- ✅ HTTPS required for all API communications
- ✅ Proper Android permissions configuration

**Never commit:**
- API keys
- Keystore files
- Environment files (.env, .env.local)

## 📦 Project Structure

```
necrometer_-ghost-detector/
├── src/                      # Angular app source
│   ├── components/          # UI components
│   ├── services/            # Angular services
│   ├── env.js              # Environment configuration
│   └── types.ts            # TypeScript types
├── server/                  # Proxy server
│   ├── index.js            # Express server
│   └── README.server.md    # Server documentation
├── android/                 # Android platform (auto-generated)
├── capacitor.config.ts     # Capacitor configuration
├── angular.json            # Angular configuration
└── PLAY_STORE_BUILD_GUIDE.md  # Build guide

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for powering the entity detection and analysis
- The Capacitor team for excellent mobile tooling
- All contributors and testers

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check the [documentation](./PLAY_STORE_BUILD_GUIDE.md)
- Review the [server setup guide](./server/README.server.md)

---

**View this app in AI Studio**: https://ai.studio/apps/drive/1gnEU5O4icie00ZCOoaeAK0WdqDdMs9r5
