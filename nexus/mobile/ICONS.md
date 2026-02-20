# Android App Icons - Dark/Light Theme Support ✨

This document describes the adaptive icon implementation with full dark/light theme support.

## 📁 Icon Resource Structure

```
app/src/main/res/
├── drawable/
│   ├── ic_launcher_background.xml          # Light theme background
│   └── ic_launcher_foreground.xml          # Light theme foreground
├── drawable-night/
│   ├── ic_launcher_background.xml          # Dark theme background (brighter)
│   └── ic_launcher_foreground.xml          # Dark theme foreground (brighter)
├── mipmap-mdpi/
│   ├── ic_launcher.png                     # 48x48 - Light theme (from favlight.jpg)
│   └── ic_launcher_round.png               # 48x48 round - Light theme
├── mipmap-mdpi-night/
│   ├── ic_launcher.png                     # 48x48 - Dark theme (from favdark.jpg)
│   └── ic_launcher_round.png               # 48x48 round - Dark theme
├── mipmap-hdpi/
│   ├── ic_launcher.png                     # 72x72 - Light theme
│   └── ic_launcher_round.png               # 72x72 round - Light theme
├── mipmap-hdpi-night/
│   ├── ic_launcher.png                     # 72x72 - Dark theme
│   └── ic_launcher_round.png               # 72x72 round - Dark theme
├── mipmap-xhdpi/
│   ├── ic_launcher.png                     # 96x96 - Light theme
│   └── ic_launcher_round.png               # 96x96 round - Light theme
├── mipmap-xhdpi-night/
│   ├── ic_launcher.png                     # 96x96 - Dark theme
│   └── ic_launcher_round.png               # 96x96 round - Dark theme
├── mipmap-xxhdpi/
│   ├── ic_launcher.png                     # 144x144 - Light theme
│   └── ic_launcher_round.png               # 144x144 round - Light theme
├── mipmap-xxhdpi-night/
│   ├── ic_launcher.png                     # 144x144 - Dark theme
│   └── ic_launcher_round.png               # 144x144 round - Dark theme
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png                     # 192x192 - Light theme
│   └── ic_launcher_round.png               # 192x192 round - Light theme
├── mipmap-xxxhdpi-night/
│   ├── ic_launcher.png                     # 192x192 - Dark theme
│   └── ic_launcher_round.png               # 192x192 round - Dark theme
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml                     # Adaptive icon config
│   └── ic_launcher_round.xml               # Round adaptive icon config
├── values/
│   ├── colors.xml                          # Light theme colors
│   └── themes.xml                          # Light theme styles
└── values-night/
    ├── colors.xml                          # Dark theme colors
    └── themes.xml                          # Dark theme styles
```

## 🎨 Theme Support

### Android API Levels

| API Level | Feature |
|-----------|---------|
| API 24-25 (7.0-7.1) | Uses mipmap PNGs with `-night` qualifier |
| API 26+ (8.0+) | Uses Adaptive Icons with auto theme switching |
| API 33+ (13+) | Uses Monochrome icons for themed app icons |

### Light Theme (Day Mode)
- **Source**: `favlight.jpg`
- **Background**: Deep space dark (`#0F0F1A`)
- **Foreground**: Electric violet cloud (`#8B5CF6`)
- **Style**: Dark background with vibrant accents

### Dark Theme (Night Mode)
- **Source**: `favdark.jpg`
- **Background**: Lighter midnight (`#1A1A2E`)
- **Foreground**: Brighter violet (`#A78BFA`) for visibility
- **Style**: Slightly elevated brightness for dark backgrounds

## 🔄 How It Works

### Automatic Theme Switching

Android automatically selects the appropriate icon based on device theme:

1. **System Theme Change** → Android switches between `mipmap-*` and `mipmap-*-night`
2. **Adaptive Icons (API 26+)** → Uses `drawable` vs `drawable-night` XML vectors
3. **Themed Icons (API 33+)** → Monochrome icon tinted with system accent color

### For Legacy Devices (API < 26)

Uses static PNG files:
- Light mode: `mipmap-mdpi/ic_launcher.png`, etc.
- Dark mode: `mipmap-mdpi-night/ic_launcher.png`, etc.

### For Modern Devices (API 26+)

Uses vector adaptive icons:
- `mipmap-anydpi-v26/ic_launcher.xml` references drawable XMLs
- System automatically switches `drawable` → `drawable-night` based on theme

## 🛠️ Regenerating Icons

If you update `favdark.jpg` or `favlight.jpg`, regenerate icons with:

```bash
cd /home/hinoki/HinokiDEV/Investments

# Light theme (from favlight.jpg)
convert favlight.jpg -resize 48x48^ -gravity center -extent 48x48 mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher.png
convert favlight.jpg -resize 72x72^ -gravity center -extent 72x72 mobile/android/app/src/main/res/mipmap-hdpi/ic_launcher.png
convert favlight.jpg -resize 96x96^ -gravity center -extent 96x96 mobile/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
convert favlight.jpg -resize 144x144^ -gravity center -extent 144x144 mobile/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
convert favlight.jpg -resize 192x192^ -gravity center -extent 192x192 mobile/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Dark theme (from favdark.jpg)
convert favdark.jpg -resize 48x48^ -gravity center -extent 48x48 mobile/android/app/src/main/res/mipmap-mdpi-night/ic_launcher.png
convert favdark.jpg -resize 72x72^ -gravity center -extent 72x72 mobile/android/app/src/main/res/mipmap-hdpi-night/ic_launcher.png
convert favdark.jpg -resize 96x96^ -gravity center -extent 96x96 mobile/android/app/src/main/res/mipmap-xhdpi-night/ic_launcher.png
convert favdark.jpg -resize 144x144^ -gravity center -extent 144x144 mobile/android/app/src/main/res/mipmap-xxhdpi-night/ic_launcher.png
convert favdark.jpg -resize 192x192^ -gravity center -extent 192x192 mobile/android/app/src/main/res/mipmap-xxxhdpi-night/ic_launcher.png
```

## 📱 Testing

### Test Different Themes

1. **Light Mode**: Settings → Display → Dark theme OFF
   - Should show `favlight.jpg` variant

2. **Dark Mode**: Settings → Display → Dark theme ON
   - Should show `favdark.jpg` variant

3. **Themed Icons (Pixel/Android 13+)**: 
   - Long press app → App info → App icon
   - Should show themed variant with system accent color

### Test Different Devices

| Device Type | Expected Behavior |
|-------------|-------------------|
| Samsung (One UI) | Uses `-night` mipmap or adaptive icons |
| Pixel | Full adaptive + themed icon support |
| Xiaomi (MIUI) | May need MIUI theme compatibility |
| Android Emulator API 26+ | Full adaptive icon support |
| Android Emulator API 24-25 | `-night` mipmap qualifier support |

## 🎯 Design Principles

1. **Visibility**: Dark theme icons use brighter colors for visibility on dark backgrounds
2. **Consistency**: Same icon shape across all densities and themes
3. **Scalability**: Vector icons for adaptive, PNG fallbacks for legacy
4. **Accessibility**: High contrast in both light and dark modes

## 📝 Notes

- The monochrome icon (`ic_launcher_monochrome.xml`) uses only white with varying opacity
- Android 13+ applies the user's chosen theme color to monochrome icons
- Round icons are generated by masking square icons with a circular alpha
