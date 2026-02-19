# Deploy TWA to Play Store

## Quick Deploy Checklist

### Step 1: Build (Run from `mobile/twa/`)
```bash
cd mobile/twa
./build.sh
```

This will:
- Create signing key
- Generate SHA256 fingerprint
- Update assetlinks.json
- Build release APK

### Step 2: Deploy Asset Links
Upload `public/assetlinks.json` to your web root:
```
https://inv.aramac.dev/.well-known/assetlinks.json
```

**Verify it's accessible:**
```bash
curl https://inv.aramac.dev/.well-known/assetlinks.json
```

### Step 3: Create Play Store Listing

1. Go to https://play.google.com/console
2. Create new app:
   - App name: **Investments**
   - Default language: English
   - App or game: App
   - Free or paid: Free

3. Set up app:
   - **App category**: Finance
   - **Tags**: Personal Finance, Investment

### Step 4: Upload APK

1. Go to **Release** → **Production** → **Create new release**
2. Upload `app/build/outputs/apk/release/app-release.apk`
3. Add release notes
4. **Save and release**

### Step 5: Store Listing

**Short description:**
```
Family investment dashboard - track land, stocks, gold, and more.
```

**Full description:**
```
Track your family's investments in one beautiful dashboard.

Features:
• View all investments by category
• Track performance over time
• Access documents and analysis
• Real-time portfolio updates

This app wraps our secure web dashboard in a native app experience.
For file uploads, use our companion "R2 Portal" app.

Secure, private, family-first.
```

### Step 6: Graphics

**Screenshots:** Take screenshots of web dashboard
**Feature graphic:** 1024x500px banner
**App icon:** 512x512px (already in mipmap)

### Step 7: Submit for Review

- Content rating: Everyone
- Target audience: All ages
- Data safety: No data collected
- Review time: 1-3 days

---

## Post-Launch

### Deep Link Integration
When both apps are installed:
```kotlin
// In R2 Portal native app - link to dashboard
val intent = Intent(Intent.ACTION_VIEW, 
    Uri.parse("https://inv.aramac.dev"))
startActivity(intent)
```

### Update Web App
TWA automatically reflects web updates!

### Version Updates
Update `versionCode` in `app/build.gradle.kts` for new releases.
