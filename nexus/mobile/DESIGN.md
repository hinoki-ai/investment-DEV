# FAMINV Mobile - Design System

## Visual Philosophy

**"Warm Dark Minimalism"**

A refined, premium interface inspired by Nothing Phone and Linear.app. Warm cream accents on deep charcoal create a sophisticated, calm experience that feels expensive and intentional.

> No more electric purple. No more generic glassmorphism. Just warm, tactile darkness.

---

## Color Palette

### Core Backgrounds
| Name | Hex | Usage |
|------|-----|-------|
| Void | `#0A0A0A` | Main background - absolute black |
| Void Deep | `#070707` | Deepest void, status bar |
| Surface | `#111111` | Card surfaces |
| Surface Elevated | `#161616` | Elevated cards, inputs |
| Surface Higher | `#1C1C1C` | Highest elevation |

### Accent - Warm Cream
| Name | Hex | Usage |
|------|-----|-------|
| Cream | `#E8D5C4` | Primary accent, CTAs, active states |
| Cream Light | `#F5E6D3` | Hover states |
| Cream Dark | `#C9B296` | Secondary accent |
| Cream Muted | `#A89482` | Muted highlights |

### Text Colors
| Name | Hex | Usage |
|------|-----|-------|
| Text Primary | `#F5F2ED` | Headlines, important text |
| Text Secondary | `#8A8279` | Body text, labels |
| Text Muted | `#5C554D` | Hints, captions, disabled |

### Semantic Colors (Muted Earth Tones)
| Name | Hex | Usage |
|------|-----|-------|
| Success | `#7FB069` | Completed, success states |
| Warning | `#D4A373` | Pending, warnings |
| Error | `#C76B6B` | Failed, errors |
| Info | `#6B8CAE` | Processing, neutral info |

### Borders
| Name | Hex | Usage |
|------|-----|-------|
| Border Default | `rgba(232, 213, 196, 0.1)` | Card borders |
| Border Strong | `rgba(232, 213, 196, 0.15)` | Hover states |

---

## Components

### WarmCard
```kotlin
WarmCard(
    cornerRadius = 12.dp,
    backgroundAlpha = 1f
) {
    // Content
}
```
- Subtle 1dp border in cream at 10% opacity
- Surface background (#111111)
- No shadows (flat, modern aesthetic)
- 12dp corner radius

### ElevatedWarmCard
- Uses SurfaceElevated (#161616)
- 16dp corner radius
- For emphasized content

### GlyphButton (Primary)
```kotlin
GlyphButton(onClick = { }) {
    Icon(Icons.Rounded.Add, null)
    Text("Add")
}
```
- Cream background (#E8D5C4)
- Void text (black)
- 8dp corner radius
- No gradient (solid, confident)

### GlyphButtonSecondary (Outlined)
- Transparent background
- Border in BorderDefault
- TextPrimary color

### GlyphButtonGhost (Minimal)
- No background
- No border
- CreamMuted text

### StatusBadge
```kotlin
StatusBadge(text = "Active", type = BadgeType.SUCCESS)
```
- Uppercase, small text
- Pill shape (20dp radius)
- Background at 20% opacity
- Matching border at 20% opacity

---

## Typography

All text uses system font with careful weight selection:

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| Headline Small | 24sp | SemiBold (600) | Screen titles |
| Title Large | 22sp | Medium (500) | Card titles |
| Title Medium | 16sp | Medium (500) | Section headers |
| Body Large | 16sp | Regular (400) | Primary body |
| Body Medium | 14sp | Regular (400) | Secondary body |
| Body Small | 12sp | Regular (400) | Captions |
| Label Large | 14sp | Medium (500) | Buttons |
| Label Small | 11sp | Medium (500) | Badges, metadata |

---

## Animations

### Micro-interactions
1. **Pulsing Dot** - Cream pulse for active states (800ms)
2. **Animated Counter** - Number transitions with easing
3. **Progress Bar** - Smooth fill, 3dp height, cream color
4. **Card Hover** - Subtle border color change (no scale)

### Transitions
1. **Content Fade** - 200ms ease
2. **Slide Up** - Bottom sheets, action bars
3. **Scale In** - FAB appearance
4. **Animated Content** - Status changes

### Ambient Effects
- Static cream glow orbs at 2-3% opacity
- No animated backgrounds (too distracting)
- Subtle grain texture optional

---

## Layout Principles

### Spacing Scale
- 4dp - Tight
- 8dp - Compact
- 12dp - Default padding
- 16dp - Section padding
- 24dp - Large gaps
- 32dp - Screen padding

### Card Padding
- Internal: 16dp
- External margins: 16dp horizontal, 6dp vertical

### Border Radius
- Small (buttons): 8dp
- Medium (cards): 12dp
- Large (elevated): 16dp
- Full (pills): 50%

---

## Iconography

- **Style**: Rounded Material Icons
- **Size**: 20dp (standard), 24dp (emphasis)
- **Color**: TextSecondary (default), Cream (active), Success/Error (states)
- **File Icons**: Monochrome in muted containers

---

## Empty States

### Floating Cloud Pattern
```
┌─────────────────────┐
│   ○ (glow orb)      │
│      ☁️             │
│   Drop files here   │
│   Subtitle text     │
└─────────────────────┘
```

- Subtle cream glow behind icon
- Gentle scale animation (1.0 → 1.02)
- Fade between 0.7 and 1.0 opacity
- Icon: CloudUpload at CreamMuted

---

## Migration from Old Design

| Old | New |
|-----|-----|
| DeepSpace | Void |
| ElectricViolet | Cream |
| Glassmorphism blur | Solid surfaces |
| Purple glow shadows | No shadows (flat) |
| 20dp corner radius | 12dp corner radius |
| Gradient buttons | Solid cream buttons |
| Animated gradient bg | Static subtle glow |

---

## Philosophy Checklist

Before adding any UI element, verify:

- [ ] Is it necessary? (No decorative elements)
- [ ] Does it use the warm palette? (Cream, not purple)
- [ ] Is the contrast sufficient? (TextSecondary for non-essential)
- [ ] Is the animation subtle? (No bouncy overshoots)
- [ ] Does it feel expensive? (Generous whitespace, clean lines)

---

## Web Parity

The mobile app now matches the web dashboard:
- Same color values
- Same border radius scale
- Same typography philosophy
- Same component naming (WarmCard = glass-card)
- Same button styles (glyph-btn)

This creates a unified FAMINV brand experience across platforms.
