# NEXUS + PRISM Deployment Guide

## ✅ What's Been Completed

### 1. NEXUS Android APK
- **Location**: `nexus/mobile/app/build/outputs/apk/release/app-release.apk`
- **Releases folder**: `prism/web/public/releases/nexus-v1.0.apk`
- **Size**: ~11 MB
- **Download URL**: https://inv.aramac.dev/releases/nexus-v1.0.apk

### 2. PRISM Web Dashboard
- **Download Page**: Beautiful React-based download page at `/download`
- **Navigation**: "App Móvil" link added to sidebar
- **SPA Routing**: All routes work correctly with `_redirects` file
- **APK Integration**: APK is bundled with the web deployment

### 3. Automation Script
- **Script**: `./prism/vv/deploy-all` (or `./deploy-nexus-prism.sh`)
- **Features**:
  - Builds NEXUS Android APK from source
  - Copies APK to web releases folder
  - Builds PRISM web app
  - Deploys to Cloudflare Pages
  - Supports `--skip-apk`, `--skip-web`, `--dry-run` flags

## 🚀 Quick Start

### Deploy Everything (APK + Web)
```bash
./deploy-nexus-prism.sh
```

### Deploy Web Only (skip APK build)
```bash
./deploy-nexus-prism.sh --skip-apk
```

### Test Without Deploying
```bash
./deploy-nexus-prism.sh --dry-run
```

## 🌐 Current Status

### Cloudflare Pages (Working ✅)
- **Preview URL**: https://e6ad41f2.investment-aramac.pages.dev
- **Status**: All routes working correctly
- **Download Page**: https://e6ad41f2.investment-aramac.pages.dev/download ✅
- **APK Download**: https://e6ad41f2.investment-aramac.pages.dev/releases/nexus-v1.0.apk ✅

### Custom Domain (Needs DNS Update ⚠️)
- **Domain**: https://inv.aramac.dev
- **Current Status**: Points to Vercel (404 errors)
- **Action Required**: Update DNS in Cloudflare dashboard

## 🔧 DNS Configuration Required

To point `inv.aramac.dev` to Cloudflare Pages:

### Option 1: Cloudflare Dashboard (Recommended)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain (aramac.dev)
3. Go to **DNS** → **Records**
4. Find the `inv` CNAME or A record
5. Change it to point to `investment-aramac.pages.dev`
   - Type: CNAME
   - Name: inv
   - Target: investment-aramac.pages.dev
   - Proxy status: Proxied (orange cloud)

### Option 2: Pages Custom Domain
1. Go to [Cloudflare Pages](https://dash.cloudflare.com/pages)
2. Select **investment-aramac** project
3. Go to **Custom domains**
4. Click **Set up a custom domain**
5. Enter: `inv.aramac.dev`
6. Follow the verification steps

## 📁 File Structure

```
/home/hinoki/HinokiDEV/Investments/
├── nexus/mobile/                    # Android app source
│   └── app/build/outputs/apk/...    # APK output
├── prism/web/
│   ├── public/
│   │   └── releases/                # APK bundled with web
│   │       ├── nexus-v1.0.apk       # The APK file
│   │       └── index.html           # Static download page (fallback)
│   ├── src/
│   │   ├── pages/
│   │   │   └── Download.tsx         # React download page
│   │   ├── components/
│   │   │   └── Layout.tsx           # Added download nav link
│   │   └── App.tsx                  # Added /download route
│   └── dist/                        # Build output (deployed)
├── prism/vv/
│   └── deploy-all                   # Main deployment script
└── deploy-nexus-prism.sh            # Convenience wrapper
```

## 🔄 Future Updates

### Update APK Only
```bash
cd nexus/mobile && ./gradlew assembleRelease
cp app/build/outputs/apk/release/app-release.apk ../web/public/releases/nexus-v1.0.apk
cd ../web && npm run build && npx wrangler pages deploy dist --project-name=investment-aramac --branch=production
```

### Update Web Only
```bash
cd prism/web
npm run build
npx wrangler pages deploy dist --project-name=investment-aramac --branch=production
```

## 🎯 Verification Checklist

After DNS update, verify:
- [ ] https://inv.aramac.dev loads the dashboard
- [ ] https://inv.aramac.dev/download loads the download page
- [ ] https://inv.aramac.dev/releases/nexus-v1.0.apk downloads the APK
- [ ] All navigation links work correctly
- [ ] Mobile app installs and runs correctly

## 📱 App Installation

1. Visit https://inv.aramac.dev/download
2. Tap "Descargar APK"
3. Allow installation from unknown sources if prompted
4. Open NEXUS app
5. Configure API URL in Settings:
   - For emulator: `http://10.0.2.2:8000`
   - For production: Your API URL

---

**Status**: Ready for use after DNS update ⚡
