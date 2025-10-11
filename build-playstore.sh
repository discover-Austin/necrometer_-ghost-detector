#!/bin/bash
# Build script for Google Play Store release

set -e

echo "🎯 Necrometer Play Store Build Script"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Android platform exists
if [ ! -d "android" ]; then
    echo "❌ Error: Android platform not found. Run 'npx cap add android' first."
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🏗️  Step 2: Building Angular app..."
npm run build

echo ""
echo "🔄 Step 3: Syncing with Android..."
npx cap sync android

echo ""
echo "✅ Build preparation complete!"
echo ""
echo "Next steps:"
echo "1. Open Android Studio: npm run open:android"
echo "2. For debug APK: ./gradlew assembleDebug"
echo "3. For release APK: ./gradlew assembleRelease"
echo "4. For Play Store AAB: ./gradlew bundleRelease"
echo ""
echo "Note: Make sure you've configured signing in android/keystore.properties"
echo "See PLAY_STORE_BUILD_GUIDE.md for details."
