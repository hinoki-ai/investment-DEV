# Investment Dashboard TWA

Trusted Web Activity wrapper for the Investment Dashboard web app.

## What is TWA?
A TWA displays a fullscreen web app without browser UI, making it feel native while keeping the web codebase.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  Google Play Store                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Investment Dashboard (TWA)                         │   │
│  │  • Fullscreen webview                               │   │
│  │  • No browser UI                                    │   │
│  │  • Native app icon                                  │   │
│  │  • Domain verified                                  │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                       │
│                     ▼                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  https://inv.aramac.dev (Cloudflare Pages)         │   │
│  │  • Dashboard UI                                     │   │
│  │  • View investments                                 │   │
│  │  • Read reports                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
        ↓ Complements (separate app)
┌─────────────────────────────────────────────────────────────┐
│  R2 Portal (Native Android)                                 │
│  • Upload files directly to R2                              │
│  • Android share sheet integration                          │
│  • Background uploads                                       │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Generate Signing Key
```bash
cd mobile/twa
keytool -genkey -v -keystore release.keystore -alias investment -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Get SHA256 Fingerprint
```bash
keytool -list -v -keystore release.keystore -alias investment
# Copy the SHA256 fingerprint
```

### 3. Update Asset Links
Edit `public/assetlinks.json` and replace `PLACEHOLDER_SHA256_HASH` with your actual fingerprint.

### 4. Deploy Asset Links
Upload `assetlinks.json` to:
```
https://inv.aramac.dev/.well-known/assetlinks.json
```

### 5. Build APK
```bash
./gradlew assembleRelease
```

### 6. Upload to Play Store
Upload `app/build/outputs/apk/release/app-release.apk` to Google Play Console.

## Files Overview

| File | Purpose |
|------|---------|
| `AndroidManifest.xml` | TWA configuration, intent filters |
| `strings.xml` | App name, asset statements |
| `public/assetlinks.json` | Domain verification (deploy to web root) |

## Important Notes

- **Domain verification required**: Asset links must be hosted at `/.well-known/assetlinks.json`
- **HTTPS only**: TWA requires secure context
- **No file uploads**: Use R2 Portal native app for uploads
- **Auto-updates**: Web updates reflect immediately in TWA

## Play Store Presence

- **App name**: Investments
- **Package**: `com.family.investments.dashboard`
- **Category**: Finance
- **Content rating**: Everyone
