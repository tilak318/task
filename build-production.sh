#!/bin/bash

echo "🚀 Building Production APK for AKDM Tasks..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
cd android && ./gradlew clean && cd ..

# Build production APK
echo "🔨 Building production APK..."
cd android && ./gradlew assembleRelease && cd ..

echo "✅ Production APK built successfully!"
echo "📱 APK location: android/app/build/outputs/apk/release/app-release.apk"
echo ""
echo "📋 Next steps:"
echo "1. Install the APK on your device"
echo "2. The app will now connect to: https://akdm-tasks.onrender.com"
echo "3. Test login and functionality"
echo ""
echo "🔧 If you encounter issues:"
echo "- Check device internet connection"
echo "- Verify server is running at https://akdm-tasks.onrender.com"
echo "- Check console logs for connection errors" 