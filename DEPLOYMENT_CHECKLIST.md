# Necrometer Deployment Checklist

Use this checklist when preparing to deploy the Necrometer app to the Google Play Store.

## Pre-Build Checklist

### Environment Setup
- [ ] Node.js v18+ installed
- [ ] Android Studio installed and configured
- [ ] Java JDK 17+ installed
- [ ] Google Gemini API key obtained from [AI Studio](https://aistudio.google.com/app/apikey)

### API Configuration
- [ ] Proxy server deployed (recommended) OR direct API key configured (testing only)
- [ ] Server environment variables configured (`API_KEY`, `JWT_ISSUER_SECRET`, `SHARED_ISSUANCE_TOKEN`)
- [ ] Client configuration updated in `src/env.js`
- [ ] Tested API connection works correctly

### Code Review
- [ ] No API keys committed to repository
- [ ] No sensitive data in code
- [ ] `.gitignore` properly configured
- [ ] All features tested and working
- [ ] No console errors or warnings in production build

## Build Preparation

### Version Management
- [ ] Update version in `android/app/build.gradle`:
  - [ ] `versionCode` incremented (must be higher than previous release)
  - [ ] `versionName` updated (e.g., "1.0.0" → "1.1.0")
- [ ] Update version in `package.json` if needed

### App Configuration
- [ ] App name is correct: "Ghosted-Necrometer"
- [ ] App ID is correct: "com.ghosted_necrometer.app"
- [ ] All permissions in `AndroidManifest.xml` are necessary and documented:
  - [ ] CAMERA - for AR overlay
  - [ ] RECORD_AUDIO - for EVP recorder
  - [ ] INTERNET - for Gemini API
  - [ ] WRITE_EXTERNAL_STORAGE - for saving data
  - [ ] READ_EXTERNAL_STORAGE - for loading data

### Signing Configuration
- [ ] Release keystore generated: `necrometer-release-key.jks`
- [ ] Keystore stored securely (NOT in repository)
- [ ] `android/keystore.properties` created with correct values
- [ ] Signing configuration added to `android/app/build.gradle`
- [ ] Test signing works with a test build

## Build Process

### Clean Build
```bash
# 1. Clean previous builds
cd android && ./gradlew clean && cd ..

# 2. Install dependencies
npm install

# 3. Build web assets
npm run build

# 4. Sync with Android
npm run sync:android

# 5. Build release AAB
cd android && ./gradlew bundleRelease
```

### Build Verification
- [ ] Build completed without errors
- [ ] AAB file created at `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] AAB is properly signed
- [ ] File size is reasonable (< 100MB)

## Testing

### Local Testing
- [ ] Install debug build on test device
- [ ] Test all major features:
  - [ ] Camera preview shows correctly
  - [ ] Scanner detects entities
  - [ ] Entity profiles generate correctly
  - [ ] EVP recorder records and analyzes
  - [ ] Vision mode shows AR overlays
  - [ ] Temporal echoes work
  - [ ] Cross-reference feature works
  - [ ] Logbook saves and loads entities
  - [ ] Store/upgrade system functions
  - [ ] All UI elements display correctly
- [ ] Test on multiple Android versions (min SDK 24)
- [ ] Test on different screen sizes/resolutions
- [ ] Test permissions flow (deny then grant)
- [ ] Test network connectivity issues
- [ ] Test app backgrounding/foregrounding
- [ ] Test app rotation (portrait/landscape)

### API Integration Testing
- [ ] All Gemini API calls work correctly
- [ ] Proper error handling for API failures
- [ ] Rate limiting handled gracefully
- [ ] JWT token refresh works
- [ ] Proxy authentication successful

### Performance Testing
- [ ] App starts quickly (< 3 seconds)
- [ ] No memory leaks detected
- [ ] Battery usage is reasonable
- [ ] Camera preview is smooth
- [ ] No frame drops or lag
- [ ] API calls complete in reasonable time

## Play Store Preparation

### Store Assets
- [ ] App icon (512x512) created
- [ ] Feature graphic (1024x500) created
- [ ] Screenshots prepared:
  - [ ] Phone screenshots (at least 2, up to 8)
  - [ ] 7-inch tablet screenshots (recommended)
  - [ ] 10-inch tablet screenshots (recommended)
- [ ] App video/preview (optional but recommended)

### Store Listing
- [ ] App title (max 50 characters)
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)
- [ ] Keywords for SEO
- [ ] App category selected
- [ ] Content rating completed
- [ ] Target audience defined

### Legal Requirements
- [ ] Privacy policy created and hosted
- [ ] Privacy policy URL added to listing
- [ ] Terms of service (if applicable)
- [ ] Data safety form completed
- [ ] Required disclosures made

### App Content
- [ ] Age rating appropriate
- [ ] Content warnings (if needed)
- [ ] In-app purchases declared (if any)
- [ ] Ads declared (if any)
- [ ] Permissions usage clearly explained

## Play Console Upload

### Initial Setup
- [ ] Developer account created and verified
- [ ] One-time registration fee paid ($25)
- [ ] Account information complete

### App Creation
- [ ] New app created in Play Console
- [ ] Default language selected
- [ ] App type selected (app/game)
- [ ] Free/paid status chosen

### Release Track
- [ ] Internal testing track created (for team)
- [ ] Closed testing track created (for beta testers)
- [ ] Open testing track configured (optional)
- [ ] Production track ready for public release

### Upload Process
- [ ] AAB file uploaded
- [ ] Release name provided
- [ ] Release notes written (in all supported languages)
- [ ] Previous releases tested (if updating)

## Pre-Launch Checklist

### Final Verification
- [ ] All testing passed
- [ ] No critical bugs
- [ ] All features working as expected
- [ ] API integration stable
- [ ] Performance acceptable
- [ ] Battery usage reasonable
- [ ] Permissions justified and minimal

### Documentation
- [ ] README.md updated
- [ ] Release notes prepared
- [ ] Known issues documented
- [ ] Support resources available

### Monitoring Setup
- [ ] Analytics configured (optional)
- [ ] Crash reporting enabled
- [ ] API usage monitoring active
- [ ] Server logs accessible
- [ ] Rate limits configured

## Post-Launch

### Immediate Actions
- [ ] Monitor crash reports
- [ ] Check user reviews
- [ ] Verify download counts
- [ ] Test live app download
- [ ] Confirm API quota not exceeded

### First 24 Hours
- [ ] Respond to any critical reviews
- [ ] Monitor server load
- [ ] Check for any widespread issues
- [ ] Verify payment processing (if applicable)

### First Week
- [ ] Analyze user feedback
- [ ] Plan bug fix updates
- [ ] Consider feature requests
- [ ] Review analytics data
- [ ] Check API usage patterns

## Maintenance

### Regular Tasks
- [ ] Monitor API usage and costs
- [ ] Review crash reports weekly
- [ ] Respond to user reviews
- [ ] Update dependencies monthly
- [ ] Rotate secrets/tokens periodically
- [ ] Backup keystore securely

### Updates
- [ ] Increment versionCode for each update
- [ ] Write clear release notes
- [ ] Test thoroughly before releasing
- [ ] Stage updates (internal → closed → open → production)

## Security Checklist

### Before Every Release
- [ ] No secrets in code
- [ ] No debug logging in production
- [ ] ProGuard/R8 enabled for release
- [ ] HTTPS enforced for all API calls
- [ ] JWT tokens expire appropriately
- [ ] Rate limiting active
- [ ] Input validation in place

### Regular Security Review
- [ ] Audit dependencies for vulnerabilities
- [ ] Review API key usage
- [ ] Check for exposed endpoints
- [ ] Verify data encryption
- [ ] Test for common attacks

## Emergency Response

### If Issues Arise
- [ ] Halt rollout if possible
- [ ] Document the issue
- [ ] Create hotfix branch
- [ ] Test fix thoroughly
- [ ] Release emergency update
- [ ] Communicate with users

## Resources

- [Play Console](https://play.google.com/console)
- [Google AI Studio](https://aistudio.google.com/)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/)

## Notes

Use this space to track release-specific information:

**Current Release Version:** ___________
**Release Date:** ___________
**Build Number:** ___________
**Known Issues:** ___________
**Special Considerations:** ___________
