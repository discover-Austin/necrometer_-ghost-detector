# Quick Setup Guide

This is a quick reference for setting up the Necrometer app. For complete details, see [PLAY_STORE_BUILD_GUIDE.md](./PLAY_STORE_BUILD_GUIDE.md).

## 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Save your API key securely

## 2. Choose Your Setup Method

### For Testing (Quick Start)

Edit `src/env.js` and add your API key:

```javascript
window.__env.useProxy = false;
window.__env.apiKey = 'YOUR_API_KEY_HERE';
```

⚠️ **Warning**: Never use this method for production! API keys exposed in the client can be stolen.

### For Production (Recommended)

#### Setup Proxy Server:

1. **Configure server:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```

2. **Edit `server/.env`:**
   ```bash
   API_KEY=your_gemini_api_key_here
   JWT_ISSUER_SECRET=create_a_strong_random_secret_here
   SHARED_ISSUANCE_TOKEN=create_another_strong_random_token_here
   PORT=4000
   ```

3. **Deploy server** to a hosting service:
   - Heroku: `git subtree push --prefix server heroku main`
   - Railway: Connect your repo and set root directory to `server`
   - Google Cloud Run: Use `gcloud run deploy`
   - Or any Node.js hosting service

4. **Configure client** to use proxy:
   
   Edit `src/env.js`:
   ```javascript
   window.__env.useProxy = true;
   window.__env.proxyUrl = 'https://your-deployed-server.com';
   window.__env.issuanceToken = 'same_as_SHARED_ISSUANCE_TOKEN_in_server';
   ```

## 3. Build the App

```bash
# Install dependencies
npm install

# Build for web
npm run build

# Add Android platform (first time only)
npx cap add android

# Build and sync with Android
npm run build:android
```

## 4. Test on Device

```bash
# Open in Android Studio
npm run open:android

# Then click "Run" in Android Studio
# Or build from command line:
npm run android:debug
```

## 5. Build for Play Store

See [PLAY_STORE_BUILD_GUIDE.md](./PLAY_STORE_BUILD_GUIDE.md) for:
- Setting up app signing
- Building release AAB
- Play Store submission

## Common Commands

```bash
# Build web assets
npm run build

# Sync with Android
npm run sync:android

# Open in Android Studio
npm run open:android

# Build debug APK
npm run android:debug

# Build release APK (requires signing setup)
npm run android:release

# Build AAB for Play Store (requires signing setup)
npm run android:bundle
```

## Troubleshooting

### "API key not configured" error
- Check that you've edited `src/env.js` with your configuration
- Make sure the file is being loaded (check browser console)
- Verify your API key is correct

### Camera not working
- Grant camera permissions when prompted
- Check AndroidManifest.xml has camera permissions
- Ensure device has a working camera

### Build fails
- Clear build cache: `cd android && ./gradlew clean`
- Update dependencies: `npm install`
- Check Node.js version (need v18+)

## Need Help?

- Read the full guide: [PLAY_STORE_BUILD_GUIDE.md](./PLAY_STORE_BUILD_GUIDE.md)
- Check server docs: [server/README.server.md](./server/README.server.md)
- Open an issue on GitHub
