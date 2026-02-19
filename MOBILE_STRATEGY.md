# 📱 Mobile Strategy - Investment Dashboard

## Final Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     GOOGLE PLAY STORE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │  💰 Investments (TWA)   │    │  📤 R2 Portal (Native)      │ │
│  │  ─────────────────────  │    │  ─────────────────────────  │ │
│  │  • Fullscreen webview   │    │  • Native file uploads      │ │
│  │  • Dashboard viewing    │    │  • Share sheet integration  │ │
│  │  • Portfolio stats      │    │  • Background uploads       │ │
│  │  • Reports & analysis   │    │  • Offline queue            │ │
│  │                         │    │                             │ │
│  │  Package:               │    │  Package:                   │ │
│  │  com.family.investments │    │  com.family.investments     │ │
│  │  .dashboard             │    │  .portal                    │ │
│  └───────────┬─────────────┘    └──────────────┬──────────────┘ │
│              │                                  │                │
│              └────────────────┬─────────────────┘                │
│                               │                                  │
│                               ▼                                  │
│              ┌────────────────────────────────┐                  │
│              │  https://inv.aramac.dev        │                  │
│              │  https://api.inv.aramac.dev    │                  │
│              └────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Apps Overview

| Feature | TWA (Investments) | Native (R2 Portal) |
|---------|-------------------|-------------------|
| **Purpose** | View dashboard, stats, reports | Upload files, camera, share sheet |
| **Tech** | Trusted Web Activity | Kotlin + Jetpack Compose |
| **UI** | Web (React) | Native (Glassmorphism) |
| **Offline** | Limited (service worker) | Full offline support |
| **File uploads** | ❌ | ✅ Direct to R2 |
| **Camera** | ❌ Web only | ✅ Native camera |
| **Share sheet** | ❌ | ✅ "Share to R2 Portal" |
| **Updates** | Instant (web) | Play Store release |
| **Size** | ~1MB wrapper | ~15MB native |

## Deployment Status

### ✅ TWA - Ready to Deploy
Location: `mobile/twa/`

**To deploy:**
```bash
cd mobile/twa
./build.sh
# Upload APK to Play Store
# Upload assetlinks.json to web root
```

### ✅ Native - Already Built
Location: `mobile/android/`

**Already functional** - just needs Play Store upload.

## User Flow

```
User wants to:
├── View portfolio → Open "Investments" (TWA)
├── Check reports → Open "Investments" (TWA)
├── Upload documents → Open "R2 Portal" (Native)
├── Take photo of contract → Open "R2 Portal" (Native)
└── Share from Photos → "R2 Portal" in share sheet
```

## Deep Link Integration

From R2 Portal, link back to dashboard:
```kotlin
// After upload completes
val intent = Intent(Intent.ACTION_VIEW, 
    Uri.parse("https://inv.aramac.dev/investments/$id"))
startActivity(intent)
```

## Play Store Setup

### App 1: Investments (TWA)
- **Package**: `com.family.investments.dashboard`
- **Name**: Investments
- **Category**: Finance

### App 2: R2 Portal (Native)
- **Package**: `com.family.investments.portal`
- **Name**: R2 Portal
- **Category**: Productivity

## Why This Split?

**TWA for Dashboard:**
- ✅ Instant updates (web deploy = app update)
- ✅ Zero maintenance on mobile code
- ✅ Perfect for read-only views
- ⚠️ Can't do native file operations

**Native for Uploads:**
- ✅ Full native file system access
- ✅ Android share sheet integration
- ✅ Background uploads
- ✅ Camera, gallery, document picker
- ⚠️ Requires Play Store releases

## Files Created

```
mobile/
├── android/              # Native R2 Portal (existing)
│   └── ...
└── twa/                  # NEW: TWA wrapper
    ├── build.sh          # Build automation
    ├── public/
    │   └── assetlinks.json  # Domain verification
    ├── app/
    │   └── src/main/
    │       ├── AndroidManifest.xml
    │       └── res/      # Icons, colors, themes
    └── DEPLOY_TWA.md     # Deployment guide
```

## Next Steps

1. **Deploy Backend** (Render) - See DEPLOYMENT_STATUS.md
2. **Build TWA** - Run `./build.sh` in `mobile/twa/`
3. **Upload assetlinks.json** to `https://inv.aramac.dev/.well-known/`
4. **Upload both apps** to Google Play Console
5. **Link them** in Play Store description
