#!/bin/bash
# TWA Build Script

set -e

echo "🚀 Investment Dashboard TWA Builder"
echo "===================================="
echo ""

# Check for Java
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install JDK 17+"
    exit 1
fi

# Check for Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME not set"
    echo "Please set: export ANDROID_HOME=/path/to/android-sdk"
    exit 1
fi

echo "✅ Java: $(java -version 2>&1 | head -1)"
echo "✅ Android SDK: $ANDROID_HOME"
echo ""

# Check for signing key
if [ ! -f "release.keystore" ]; then
    echo "🔑 Creating signing key..."
    keytool -genkey \
        -v \
        -keystore release.keystore \
        -alias investment \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=Family Investments, OU=Mobile, O=Family, L=City, S=State, C=US" \
        -storepass investment123 \
        -keypass investment123
    echo ""
fi

# Get SHA256 fingerprint
echo "🔐 Getting SHA256 fingerprint..."
SHA256=$(keytool -list -v -keystore release.keystore -alias investment -storepass investment123 2>/dev/null | grep "SHA256:" | awk '{print $2}')
echo "SHA256: $SHA256"
echo ""

# Update assetlinks.json
echo "📝 Updating assetlinks.json..."
sed -i "s/PLACEHOLDER_SHA256_HASH/$SHA256/g" public/assetlinks.json
cat public/assetlinks.json
echo ""

# Build release APK
echo "🔨 Building release APK..."
if [ -f "./gradlew" ]; then
    ./gradlew assembleRelease
else
    gradle assembleRelease
fi

# Check if build succeeded
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo ""
    echo "✅ Build successful!"
    echo "📦 APK: $APK_PATH"
    echo ""
    echo "Next steps:"
    echo "1. Upload public/assetlinks.json to https://inv.aramac.dev/.well-known/assetlinks.json"
    echo "2. Upload APK to Google Play Console"
    echo ""
else
    echo "❌ Build failed"
    exit 1
fi
