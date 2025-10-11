# Building Necrometer for Google Play Store

This guide will help you build and deploy the Necrometer ghost detector app to the Google Play Store with full Gemini API integration.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Android Studio** (latest version)
3. **Java JDK** (v17 or higher)
4. **Google Gemini API Key** - Get one from [Google AI Studio](https://aistudio.google.com/app/apikey)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install main app dependencies
npm install

# Install server dependencies (if using proxy)
cd server
npm install
cd ..
```

### 2. Configure Gemini API

You have two options for configuring the Gemini API:

#### Option A: Using Proxy Server (Recommended for Production)

This keeps your API key secure on the server side.

1. **Set up the proxy server:**
   
   ```bash
   cd server
   # Create environment file
   cp .env.example .env
   ```

2. **Edit `server/.env` and add your keys:**
   
   ```bash
   API_KEY=your_gemini_api_key_here
   JWT_ISSUER_SECRET=your_strong_random_secret_here
   SHARED_ISSUANCE_TOKEN=your_issuance_token_here
   PORT=4000
   ```

3. **Deploy the server** to a hosting service (Heroku, Railway, Google Cloud, etc.)

4. **Configure the app to use the proxy:**
   
   Update your app initialization code to set the proxy configuration:
   ```typescript
   // In your app initialization (e.g., app.component.ts or main.ts)
   geminiService.setProxyConfig(
     'https://your-proxy-server.com',
     'your_shared_issuance_token'
   );
   ```

#### Option B: Direct API Key (For Testing Only)

**⚠️ WARNING: Never commit API keys to your repository or ship them in production apps!**

For local testing only, you can set the API key directly:

```typescript
geminiService.setApiKey('your_api_key_here', false);
```

### 3. Build the App

```bash
# Build the web assets
npm run build

# Sync with Android platform
npm run sync:android
```

### 4. Configure Android Build

#### Update Version and Build Number

Edit `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.ghosted_necrometer.app"
    minSdkVersion 24
    targetSdkVersion 34
    versionCode 1        // Increment for each Play Store release
    versionName "1.0.0"  // Update version string
    ...
}
```

#### Set Up App Signing

1. **Generate a keystore:**

   ```bash
   keytool -genkey -v -keystore necrometer-release-key.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias necrometer
   ```

2. **Create `android/keystore.properties`:**

   ```properties
   storeFile=../necrometer-release-key.jks
   storePassword=your_keystore_password
   keyAlias=necrometer
   keyPassword=your_key_password
   ```

3. **Update `android/app/build.gradle`** to use the keystore:

   Add before `android {`:
   ```gradle
   def keystorePropertiesFile = rootProject.file("keystore.properties")
   def keystoreProperties = new Properties()
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   ```

   Update the `buildTypes` section:
   ```gradle
   buildTypes {
       release {
           signingConfig signingConfigs.release
           minifyEnabled false
           proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
       }
   }
   
   signingConfigs {
       release {
           if (keystorePropertiesFile.exists()) {
               storeFile file(keystoreProperties['storeFile'])
               storePassword keystoreProperties['storePassword']
               keyAlias keystoreProperties['keyAlias']
               keyPassword keystoreProperties['keyPassword']
           }
       }
   }
   ```

### 5. Build Release APK/AAB

#### For Testing (APK):

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

#### For Play Store (AAB):

```bash
cd android
./gradlew bundleRelease
```

The AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### 6. Test the App

Install the APK on a test device:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Test all features:**
- [ ] Camera preview and AR overlay
- [ ] EVP recorder (voice recording)
- [ ] Entity detection and profile generation
- [ ] Glyph generation
- [ ] Cross-reference feature
- [ ] Temporal echo
- [ ] All Gemini API integrations

### 7. Prepare for Play Store

1. **Create app icons and screenshots:**
   - Feature graphic (1024x500)
   - App icon (512x512)
   - Screenshots (various sizes)
   - Store listing assets

2. **Update app description and metadata:**
   - Write compelling description
   - Add keywords
   - Select appropriate category
   - Set content rating

3. **Privacy Policy:**
   - Create a privacy policy (required)
   - Host it publicly
   - Link in Play Console

4. **Upload to Play Console:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create new app
   - Upload the AAB file
   - Fill in store listing details
   - Submit for review

## Important Security Notes

1. **Never commit sensitive data:**
   - Keep `keystore.properties` private
   - Don't commit `.jks` files
   - Keep API keys on the server
   - Use `.gitignore` for all sensitive files

2. **Use environment variables:**
   - Keep all secrets in environment variables
   - Use different keys for dev/prod

3. **Proxy server security:**
   - Use HTTPS for the proxy server
   - Implement rate limiting (already included)
   - Monitor API usage
   - Rotate tokens regularly

## Troubleshooting

### Build fails with "SDK not found"
- Install Android SDK via Android Studio
- Set `ANDROID_HOME` environment variable

### Gradle sync issues
- Check your internet connection
- Update Gradle wrapper: `./gradlew wrapper --gradle-version=8.2`
- Invalidate caches in Android Studio

### App crashes on startup
- Check Logcat for errors: `adb logcat`
- Verify all permissions in AndroidManifest.xml
- Test on different API levels

### Gemini API not working
- Verify API key is correct
- Check proxy server logs
- Ensure proper CORS configuration
- Monitor rate limits

## Support

For issues or questions:
- Check the [Capacitor documentation](https://capacitorjs.com/docs)
- Review [Google GenAI docs](https://ai.google.dev/docs)
- Open an issue in this repository

## License

[Your License Here]
