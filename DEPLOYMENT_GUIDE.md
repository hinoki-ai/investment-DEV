# NEXUS + PRISM Vercel Deployment Guide

## ✅ What's Been Completed

### 1. NEXUS Android APK
- **Location**: `nexus/mobile/app/build/outputs/apk/release/...`
- **Releases folder**: `prism/web/public/releases/nexus-v1.0.apk`
- **Size**: ~11 MB
- **Download URL**: https://inv.aramac.dev/releases/nexus-v1.0.apk

### 2. PRISM Web Dashboard
- **Download Page**: React-based download page at `/download`
- **Navigation**: "App Móvil" link is connected perfectly in navigation
- **Vercel Config**: `vercel.json` ensures that rewrites for React router work correctly
- **APK Integration**: APK is bundled with the Vercel web deployment in the `prism/web/dist/releases/` folder

### 3. Automation Script
- **Script**: `./prism/vv/deploy-all` (or `./deploy-nexus-prism.sh`)
- **Features**:
  - Builds NEXUS Android APK from source
  - Copies APK to web releases folder
  - Builds PRISM web app
  - Deploys **DIRECTLY TO VERCEL** under `inv.aramac.dev` (No Cloudflare Pages allowed)
  - Supports `--skip-apk`, `--skip-web`, `--dry-run` flags

## 🚀 Quick Start

### Deploy Everything (APK + Web) -> VERCEL
```bash
./deploy-nexus-prism.sh
```
OR
```bash
./prism/vv/deploy-all
```

### Deploy Web Only (skip APK build)
```bash
./deploy-nexus-prism.sh --skip-apk
```

## 🌐 Current Status

### Vercel (Working ✅)
- **Domain**: https://inv.aramac.dev (Alias bound properly)
- **Framework**: Vite SPA (React)
- **Output Directory**: `prism/web/dist` inside `vercel.json`

## 📁 File Structure

```
/home/hinoki/HinokiDEV/Investments/
├── nexus/mobile/                    # Android app source
│   └── app/build/outputs/apk/...    # APK output
├── prism/web/
│   ├── public/
│   │   └── releases/                # APK bundled with web
│   │       └── nexus-v1.0.apk       # The APK file
│   ├── src/                         # Source files
│   └── dist/                        # Build output deployed onto Vercel
├── vercel.json                      # Vercel Configuration pointing at prism/web/dist
├── prism/vv/
│   └── deploy-all                   # Main deployment script
└── deploy-nexus-prism.sh            # Root-level deploy script
```

## 🔄 Updating the Deployment manually

### Build App + Web -> Vercel Deployment
```bash
# Build Android App
cd nexus/mobile && ./gradlew assembleRelease
# Copy output APK
cp app/build/outputs/apk/release/... ../web/public/releases/nexus-v1.0.apk
# Build Web Project
cd ../../prism/web && npm ci && npm run build
# Deploy from Workspace Root via Vercel CLI
cd ../../
npx vercel --prod --yes
```

## 🎯 Verification Checklist

- [x] https://inv.aramac.dev loads the dashboard correctly
- [x] https://inv.aramac.dev/download loads the download page manually
- [x] https://inv.aramac.dev/releases/nexus-v1.0.apk successfully serves the APK download
- [x] Cloudflare is NOT interfering with this hosting (storage/DNS only)
