# Private Deployment Guide (2-3 Users)

## The Reality Check

This is a **private family app**, not a public product. Stop overengineering.

## Recommended Setup (Simplest)

### Option 1: Web + Native Upload (Current Best)

```
Desktop/Laptop:
└── https://inv.aramac.dev (browser) → Full dashboard

Mobile:
└── R2 Portal (native APK) → Upload files only
```

**Pros:**
- ✅ Web dashboard works instantly, no Play Store
- ✅ Native app handles uploads perfectly
- ✅ No TWA complexity needed
- ✅ Sideload APK (no Play Store account needed)

**To deploy:**
```bash
# Just build the native app
cd mobile/android
./gradlew assembleRelease

# Send APK to family via WhatsApp/Signal/whatever
# They install: Settings → Security → Unknown sources → Install
```

---

### Option 2: Web Only (Even Simpler)

```
All devices:
└── https://inv.aramac.dev

Mobile uploads:
└── Use browser file picker (works fine for 2-3 users)
```

**Pros:**
- ✅ Zero mobile code to maintain
- ✅ One URL, all devices
- ✅ Updates instantly

**Cons:**
- ❌ No share sheet (copy files manually)
- ❌ Camera upload clunky

**Good enough?** Probably yes for family use.

---

### Option 3: Add WebView to Native (Single App)

If you REALLY want one app:

```kotlin
// Add to R2 Portal native app:
@Composable
fun DashboardWebView() {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                loadUrl("https://inv.aramac.dev")
            }
        }
    )
}

// Bottom navigation:
// [Upload] [Dashboard] [Settings]
```

**One native app does both.**

---

## My Recommendation: Option 1

**Why:**
- Native upload app already works great
- Web dashboard already deployed
- No extra work needed
- Delete the TWA folder, it's pointless for private use

**Setup for family:**
1. Open `https://inv.aramac.dev` on desktop → Bookmark it
2. Send them the native APK → Install once
3. Done.

---

## Delete These (Unnecessary for Private)

```bash
# Not needed for 2-3 users:
rm -rf mobile/twa/          # TWA is pointless
rm DEPLOYMENT_STATUS.md     # Overcomplicated
rm PRIVATE_DEPLOYMENT.md    # This file (meta!)

# Keep:
mobile/android/             # Native upload app - USEFUL
web/                        # Dashboard - USEFUL
```

---

## TL;DR

| For Private Use | Do This |
|-----------------|---------|
| Dashboard | Web URL (already done) |
| Mobile uploads | Native APK (already done) |
| TWA | Delete it |
| Play Store | Skip it |

**Send APK via Signal, call it a day.**
