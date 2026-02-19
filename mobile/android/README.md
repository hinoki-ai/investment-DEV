# R2 Portal - Android App ✨

A **minimal yet insanely beautiful** native Android app that serves as a file upload portal to Cloudflare R2.

![Design Preview](https://raw.githubusercontent.com/user-attachments/assets/preview.png)

## ✨ Design Highlights

- **🌌 Deep Space Dark Theme** - Rich purples and electric accents
- **💎 Glassmorphism Cards** - Frosted glass with subtle borders and shadows
- **⚡ Electric Gradients** - Vibrant violet to cyan transitions
- **🎭 Fluid Animations** - Every interaction feels alive
- **🎯 Micro-interactions** - Pulsing dots, bouncing icons, smooth counters

## 🎨 Visual Design

```
┌─────────────────────────────────────┐
│  💜 Deep Space Background           │
│     ✨ Ambient Glow Orbs            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  💎 Glass Card              │    │
│  │     ╭─────────────╮         │    │
│  │     │ 📄 File.pdf │ ✓       │    │
│  │     ╰─────────────╯         │    │
│  └─────────────────────────────┘    │
│                                     │
│  ╔════════════════════════════════╗ │
│  ║  🚀 Upload Button (Gradient)   ║ │
│  ╚════════════════════════════════╝ │
└─────────────────────────────────────┘
```

## 🚀 Features

- **Direct-to-R2 Upload** - Files upload directly using pre-signed URLs
- **Share from Any App** - Android's native share sheet integration
- **Real-time Progress** - Animated progress bars and status indicators
- **Batch Uploads** - Select multiple files at once
- **Auto-Analysis** - Option to queue files for AI processing
- **Beautiful Empty State** - Animated floating cloud with gradient orbs

## 📸 Screens

### Upload Screen
- Floating glass cards for each file
- Gradient file type icons with shadows
- Animated status indicators (pulsing dots for active uploads)
- Stats header with animated counters
- Bottom action bar with gradient primary button

### Settings Screen
- Connection status card with live indicator
- Glass text fields with icon prefixes
- Auto-analyze toggle switch
- Ambient gradient background

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
│   │   ├── GlassCard.kt               # Glassmorphism container
│   │   ├── FileItem.kt                # Animated file card
│   │   ├── EmptyState.kt              # Beautiful empty state
│   │   └── AnimatedCounter.kt         # Animation utilities
│   ├── screens/
│   │   ├── UploadScreen.kt            # Main upload UI
│   │   └── SettingsScreen.kt          # Configuration UI
│   └── theme/
│       ├── Color.kt                   # Premium color palette
│       ├── Theme.kt                   # Dark theme by default
│       ├── Type.kt                    # Typography scale
│       └── Shape.kt                   # Rounded corners
```

## 🎨 Design System

### Color Palette
```kotlin
// Backgrounds
DeepSpace       #0F0F1A    // Main background
Midnight        #1A1A2E    // Cards
CosmicPurple    #2D1B4E    // Elevated

// Accents
ElectricViolet  #8B5CF6    // Primary
ElectricBlue    #3B82F6    // Secondary
CyanGlow        #06B6D4    // Active
MintGreen       #10B981    // Success

// Glassmorphism
GlassWhite      10% white   // Card background
GlassBorder     15% white   // Card border
```

### Animations
- **Pulsing Dot** - `600ms` ease-in-out, infinite
- **Progress Bar** - `300ms` smooth fill
- **Counter** - Slide up/down transition
- **Floating** - `2000ms` sine wave, infinite
- **Success Bounce** - Spring physics

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
1. Open R2 Portal
2. Tap **"Select Files"** button
3. Choose files from device
4. Tap **"Upload"** button

### Method 2: Share Sheet
1. Open any app (Photos, Files, etc.)
2. Select files → Share
3. Choose **"R2 Portal"**
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
| Empty State | Gentle floating with gradient orb pulse |
| File Added | Slide in + scale from 0.8 |
| Uploading | Pulsing dot + progress fill |
| Complete | Icon bounce + color flash |
| Error | Shake + color shift to red |
| Counter | Vertical slide transition |

## 📝 License

Part of the Family Investment Dashboard project.

---

**Crafted with 💜 for a premium upload experience**
