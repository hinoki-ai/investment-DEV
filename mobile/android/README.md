# Nexus Mobile - Android App

A **minimal, premium** native Android app for Nexus Cloud Portal. Warm dark aesthetic inspired by Nothing Phone and Linear.app. Upload files directly to cloud storage.

## ✨ Design Highlights

- **🖤 Warm Dark Theme** - Near-black void with warm cream accents
- **🎯 Nothing Phone Aesthetic** - Glyph patterns, dot grids, clean lines
- **☕ Cream Accents** - From favicon #E8D5C4, not generic purple
- **📐 Minimalist Cards** - Subtle borders, no shadows, generous whitespace
- **✨ Refined Animations** - Purposeful motion, no visual noise

## 🎨 Visual Design

```
┌─────────────────────────────────────┐
│  🖤 Void Background (#0A0A0A)       │
│     ·  ·  ·  (subtle glyph dots)    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ⬜ Warm Card (#111111)      │    │
│  │     ───────────────         │    │
│  │  📄 File.pdf         ✓      │    │
│  │     ───────────────         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────────────────────────────┐ │
│  │  ☕ Upload (Cream button)       │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🚀 Features

- **Direct-to-Cloud Upload** - Files upload directly using pre-signed URLs
- **Share from Any App** - Android's native share sheet integration
- **Real-time Progress** - Warm cream progress indicators
- **Batch Uploads** - Select multiple files at once
- **Auto-Analysis** - Option to queue files for AI processing
- **Beautiful Empty State** - Floating cloud with subtle cream glow

## 📸 Screens

### Upload Screen
- Warm cards with subtle borders
- Muted file type icons in rounded containers
- Status indicators with pulsing cream dots
- Stats header with animated counters
- Bottom action bar with solid cream primary button

### Settings Screen
- Connection status card with live indicator
- Warm text fields with icon prefixes
- Auto-analyze toggle switch
- Subtle ambient cream glow

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Kotlin** | Modern, concise language |
| **Jetpack Compose** | Declarative UI toolkit |
| **Material3** | Latest Material Design components |
| **Retrofit + OkHttp** | Type-safe HTTP client |
| **DataStore** | Modern data storage solution |
| **Coroutines** | Asynchronous programming |

## 📁 Project Structure

```
app/src/main/java/com/family/investments/portal/
├── data/
│   ├── model/UploadModels.kt          # Data classes
│   └── local/SettingsDataStore.kt     # Preferences
├── network/
│   ├── ApiService.kt                  # REST API interface
│   └── UploadManager.kt               # Upload orchestration
├── ui/
│   ├── components/
│   │   ├── GlassCard.kt               # Card components (WarmCard)
│   │   ├── FileItem.kt                # File list item
│   │   ├── EmptyState.kt              # Empty state with animation
│   │   └── AnimatedCounter.kt         # Animation utilities
│   ├── screens/
│   │   ├── UploadScreen.kt            # Main upload UI
│   │   └── SettingsScreen.kt          # Configuration UI
│   └── theme/
│       ├── Color.kt                   # Warm dark palette
│       ├── Theme.kt                   # Dark theme (default)
│       ├── Type.kt                    # Typography scale
│       └── Shape.kt                   # Rounded corners
```

## 🎨 Design System

### Color Palette
```kotlin
// Backgrounds
Void            #0A0A0A    // Main background
Surface         #111111    // Cards
SurfaceElevated #161616    // Elevated surfaces

// Accent
Cream           #E8D5C4    // Primary accent
CreamLight      #F5E6D3    // Hover states
CreamMuted      #A89482    // Secondary text

// Text
TextPrimary     #F5F2ED    // Main text
TextSecondary   #8A8279    // Body text
TextMuted       #5C554D    // Hints

// Semantic
Success         #7FB069    // Muted sage green
Warning         #D4A373    // Warm amber
Error           #C76B6B    // Muted rose

// Borders
BorderDefault   rgba(232, 213, 196, 0.1)  // 10% cream
BorderStrong    rgba(232, 213, 196, 0.15) // 15% cream
```

### Components

#### WarmCard
- Background: Surface (#111111)
- Border: 1dp BorderDefault
- Corner radius: 12dp
- No shadow (flat design)

#### GlyphButton (Primary)
- Background: Cream (#E8D5C4)
- Text: Void (#0A0A0A)
- Corner radius: 8dp
- Height: 48dp

#### StatusBadge
- Pill shape (20dp radius)
- Uppercase text
- Background at 20% opacity
- Border at 20% opacity

### Animations
- **Pulsing Dot** - 800ms ease-in-out, infinite
- **Progress Bar** - 300ms smooth fill
- **Counter** - Slide up/down transition
- **Floating** - 3000ms sine wave (subtle)

## 🚀 Getting Started

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- Android SDK 34
- Kotlin 1.9+

### Build

```bash
cd mobile/android

# Build debug APK
./gradlew assembleDebug

# Or open in Android Studio
# File → Open → mobile/android
# Click Run ▶️
```

### Configure

The app defaults to `http://10.0.2.2:8000` (Android emulator localhost).

| Environment | API URL |
|-------------|---------|
| Emulator | `http://10.0.2.2:8000` |
| Physical Device | `http://YOUR_IP:8000` |
| Production | `https://api.yourdomain.com` |

## 📲 Usage

### Method 1: In-App Picker
1. Open NEXUS
2. Tap **"Select Files"** button
3. Choose files from device
4. Tap **"Upload"** button

### Method 2: Share Sheet
1. Open any app (Photos, Files, etc.)
2. Select files → Share
3. Choose **"NEXUS"**
4. Files appear in app, tap Upload

## 🔗 API Integration

Your existing backend endpoints:

```kotlin
// 1. Get pre-signed URL
POST /api/v1/uploads/request-url
→ Response: { upload_url, file_id, storage_key }

// 2. Upload directly to R2
PUT {upload_url}
Body: File bytes

// 3. Confirm upload
POST /api/v1/uploads/confirm
→ Response: { message, status, analysis_queued? }
```

## 🎭 Animation Showcase

| Element | Animation |
|---------|-----------|
| Empty State | Gentle floating with cream glow |
| File Added | Fade in + slight slide |
| Uploading | Cream pulsing dot + progress fill |
| Complete | Subtle scale + success color |
| Error | Error color shift |
| Counter | Vertical slide transition |

## 🔄 Design Evolution

### Before (v1)
- Electric purple gradients
- Heavy glassmorphism blur
- Animated gradient backgrounds
- 20dp corner radius
- Purple glow shadows

### After (v2 - Current)
- Warm cream accents
- Solid surfaces, subtle borders
- Static ambient glow
- 12dp corner radius
- Flat design (no shadows)

The new design feels more premium, intentional, and cohesive with the web dashboard.

## 📝 License

Part of the NEXUS project.

---

**Crafted with ☕ in warm dark**
