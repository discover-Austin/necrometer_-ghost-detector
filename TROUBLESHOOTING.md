# Troubleshooting Guide

Common issues and their solutions when building and running the Necrometer app.

## Build Issues

### Angular Build Fails

**Error: "Font inlining failed"**
```
✖ Building... [FAILED: Inlining of fonts failed]
```
**Solution:** Already fixed in `angular.json` with `optimization: { fonts: false }`

**Error: "Module not found"**
```
Error: Module '@angular/core' not found
```
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Android Build Fails

**Error: "Android SDK not found"**
```
ERROR: ANDROID_HOME is not set
```
**Solution:**
1. Install Android Studio
2. Set environment variable:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```
3. Add to `~/.bashrc` or `~/.zshrc` for persistence

**Error: "Gradle sync failed"**
```
Could not resolve all dependencies
```
**Solution:**
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

**Error: "Minimum SDK version"**
```
Manifest merger failed: uses-sdk:minSdkVersion X cannot be smaller than version Y
```
**Solution:** Update `android/variables.gradle`:
```gradle
minSdkVersion = 24
```

### Capacitor Sync Issues

**Error: "Platform not added"**
```
android platform has not been added yet
```
**Solution:**
```bash
npx cap add android
```

**Error: "Capacitor not installed"**
```
Command not found: cap
```
**Solution:**
```bash
npm install @capacitor/core @capacitor/cli
```

## Runtime Issues

### Camera Issues

**Error: "Camera permission denied"**
- User denied permission
- Permission not in manifest

**Solution:**
1. Check `AndroidManifest.xml` has:
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   ```
2. Request permission at runtime (already implemented)
3. Guide user to app settings to enable manually

**Error: "Camera preview not showing"**
- Camera hardware not available
- Wrong camera position

**Solution:**
Already handled in code with rear/front fallback. If still failing:
1. Test on physical device (cameras often don't work in emulator)
2. Check camera isn't being used by another app
3. Restart device

**Error: "Requested device not found"**
```
Error starting camera: Requested device not found
```
**Solution:** This is expected in web environment. The app handles this gracefully.

### Microphone Issues

**Error: "Recording permission denied"**
**Solution:**
1. Check permission in manifest:
   ```xml
   <uses-permission android:name="android.permission.RECORD_AUDIO" />
   ```
2. Request at runtime (already implemented)
3. Guide user to enable in settings

**Error: "Recording fails silently"**
**Solution:**
```bash
# Check if microphone hardware exists
adb shell dumpsys media.audio_policy | grep input
```

### API Integration Issues

**Error: "GeminiService not configured"**
```
Error: GeminiService not configured: API key missing
```
**Solution:**
1. Check `src/env.js` is properly configured
2. Verify the file is being loaded (check Network tab in DevTools)
3. For proxy mode:
   - Verify proxy server is running
   - Check proxy URL is correct
   - Verify issuance token matches server
4. For direct API mode:
   - Verify API key is valid
   - Check API key has proper permissions

**Error: "Proxy error: 401"**
```
Proxy error: 401 Unauthorized
```
**Solution:**
1. Check `SHARED_ISSUANCE_TOKEN` matches between client and server
2. Verify JWT hasn't expired (15 min lifetime)
3. Request new token from `/issue-token` endpoint

**Error: "Proxy error: 403"**
```
Proxy error: 403 Forbidden
```
**Solution:**
1. JWT token invalid or expired
2. Request new token from `/issue-token`
3. Check server JWT_ISSUER_SECRET is set

**Error: "Proxy error: 429"**
```
Too Many Requests
```
**Solution:**
Rate limit exceeded. Wait a minute or:
1. Increase rate limit in `server/index.js`
2. Implement request queuing
3. Reduce API call frequency

**Error: "AI analysis failed"**
```
The connection to the spectral plane may be unstable
```
**Solution:**
1. Check network connectivity
2. Verify API key/proxy is working
3. Check Gemini API quota: https://aistudio.google.com/
4. Review server logs for detailed error
5. Test API directly:
   ```bash
   curl -X POST https://your-proxy.com/api/analyze-scene \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"imageBase64":"..."}'
   ```

### Server Issues

**Error: "Server won't start"**
```
Error: API_KEY environment variable is required
```
**Solution:**
```bash
cd server
cp .env.example .env
# Edit .env and add your API_KEY
npm start
```

**Error: "Port already in use"**
```
Error: listen EADDRINUSE: address already in use :::4000
```
**Solution:**
```bash
# Find process using port 4000
lsof -ti:4000 | xargs kill -9
# Or use different port
PORT=5000 npm start
```

**Error: "CORS error"**
```
Access to fetch blocked by CORS policy
```
**Solution:**
CORS is already enabled in server. If still seeing errors:
1. Verify proxy URL doesn't have trailing slash
2. Check browser console for actual error
3. Ensure server is deployed with HTTPS

### Signing Issues

**Error: "Keystore not found"**
```
Could not read keystore
```
**Solution:**
1. Verify `android/keystore.properties` exists
2. Check file path in keystore.properties
3. Ensure keystore file exists at specified path

**Error: "Incorrect keystore password"**
```
Keystore was tampered with, or password was incorrect
```
**Solution:**
1. Verify password in `keystore.properties`
2. Try recovering password
3. If lost, generate new keystore (will need new app on Play Store)

## Performance Issues

### App is Slow

**Symptoms:**
- Long startup time
- Laggy UI
- Slow API responses

**Solutions:**
1. Enable production mode (already set in builds)
2. Check network latency to proxy server
3. Optimize images and assets
4. Profile with Android Studio Profiler
5. Check for memory leaks

### High Battery Usage

**Solutions:**
1. Reduce camera resolution if possible
2. Throttle sensor readings
3. Optimize API call frequency
4. Check for background processes
5. Profile with Battery Historian

### Memory Issues

**Error: "Out of memory"**
```
java.lang.OutOfMemoryError
```
**Solution:**
1. Check for memory leaks
2. Reduce image sizes
3. Clear unused assets
4. Increase heap size in `android/app/build.gradle`:
   ```gradle
   android {
       dexOptions {
           javaMaxHeapSize "4g"
       }
   }
   ```

## Development Issues

### Hot Reload Not Working

**Solution:**
This is an Angular production build, hot reload isn't available. For development:
1. Use `ng serve` for web development
2. Make changes
3. Rebuild and sync for mobile testing

### TypeScript Errors

**Error: "Type 'X' is not assignable to type 'Y'"**
**Solution:**
1. Check type definitions in `src/types.ts`
2. Update tsconfig.json if needed
3. Ensure all dependencies are installed

### Plugin Not Working

**Error: "Plugin not implemented"**
```
Plugin [PluginName] does not have a web implementation
```
**Solution:**
This is expected for some Capacitor plugins in web environment. Test on actual device.

## Testing Issues

### Tests Failing

**Server tests fail:**
```bash
cd server
npm test
```
If failing:
1. Check test environment variables are set
2. Update test expectations if API changed
3. Check for port conflicts

### Can't Install on Device

**Error: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"**
**Solution:**
```bash
adb uninstall com.ghosted_necrometer.app
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**Error: "Device not found"**
**Solution:**
1. Enable USB debugging on device
2. Connect via USB
3. Accept USB debugging prompt
4. Check connection: `adb devices`

## Play Store Issues

### Upload Rejected

**Error: "Version code must be incremented"**
**Solution:**
Edit `android/app/build.gradle`:
```gradle
versionCode 2  // Increment this
```

**Error: "APK not signed"**
**Solution:**
Use AAB instead of APK, and ensure signing is configured.

**Error: "API level too low"**
**Solution:**
Update `android/app/build.gradle`:
```gradle
targetSdkVersion 34  // Use latest
```

## Debug Commands

### Check App Logs
```bash
# View all logs
adb logcat

# Filter for your app
adb logcat | grep "ghosted_necrometer"

# Clear logs
adb logcat -c
```

### Check Build Info
```bash
# Check build configuration
cd android
./gradlew app:dependencies

# Check signing config
./gradlew signingReport
```

### Network Debugging
```bash
# Check network requests from device
adb shell dumpsys connectivity

# Test API endpoint
curl -X POST https://your-proxy.com/health
```

### Clear App Data
```bash
# Clear app data on device
adb shell pm clear com.ghosted_necrometer.app
```

## Getting Help

If you're still stuck:

1. **Check Logs:**
   - Browser console (F12)
   - Android logcat
   - Server logs
   - Network tab in DevTools

2. **Search Issues:**
   - GitHub repository issues
   - Capacitor documentation
   - Angular documentation
   - Stack Overflow

3. **Open an Issue:**
   - Provide full error message
   - Include environment details
   - Share relevant code snippets
   - Describe steps to reproduce

4. **Useful Resources:**
   - [Capacitor Troubleshooting](https://capacitorjs.com/docs/troubleshooting)
   - [Android Developer Guides](https://developer.android.com/)
   - [Google GenAI Docs](https://ai.google.dev/docs)

## Prevention

To avoid issues:

- [ ] Always test on real devices before release
- [ ] Keep dependencies updated
- [ ] Monitor API quotas and usage
- [ ] Use version control properly
- [ ] Back up keystores securely
- [ ] Document environment setup
- [ ] Test on multiple Android versions
- [ ] Validate all user input
- [ ] Handle errors gracefully
- [ ] Log important events
