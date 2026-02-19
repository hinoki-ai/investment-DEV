# R2 Portal - Design System

## Visual Design Philosophy

**"Dark Mode by Default, Glassmorphism, Electric Accents"**

A premium, futuristic interface that feels like a professional tool while remaining approachable.

## Color Palette

### Background Colors
- `DeepSpace` (#0F0F1A) - Main background
- `Midnight` (#1A1A2E) - Elevated surfaces
- `CosmicPurple` (#2D1B4E) - Card backgrounds
- `Nebula` (#3D2C5E) - Highlights

### Accent Colors (Electric Gradients)
- `ElectricViolet` (#8B5CF6) - Primary brand color
- `ElectricBlue` (#3B82F6) - Secondary accent
- `CyanGlow` (#06B6D4) - Active states, uploading
- `MintGreen` (#10B981) - Success states

### Semantic Colors
- `ErrorRose` (#F43F5E) - Errors, failures
- `WarningAmber` (#F59E0B) - Warnings, pending
- `SuccessEmerald` (#10B981) - Completed

### Text Colors
- `TextPrimary` (#F8FAFC) - Headings, important text
- `TextSecondary` (#94A3B8) - Body text
- `TextTertiary` (#64748B) - Hints, captions

## Glassmorphism

All cards use a frosted glass effect:
- Background: White at 6-8% opacity
- Border: White at 15-20% opacity
- Shadow: Purple glow at 15% opacity
- Backdrop blur effect

```kotlin
GlassCard(
    cornerRadius = 20.dp,
    elevation = 4.dp,
    borderAlpha = 0.2f,
    backgroundAlpha = 0.06f
) {
    // Content
}
```

## Animations

### Micro-interactions
1. **Pulsing Dot** - For active states (uploading)
2. **Animated Counter** - Number transitions
3. **Progress Bar** - Smooth fill animation
4. **Scale on Complete** - Files bounce slightly when done

### Transitions
1. **Floating Empty State** - Gentle up/down float
2. **Slide In/Out** - List items enter smoothly
3. **Fade Between States** - Status changes
4. **Gradient Shimmer** - Loading states

### Ambient Effects
- Gradient orbs in background
- Subtle glow on interactive elements
- Smooth shadows with color tint

## Typography

All text uses the system font with careful weight selection:
- **Headlines**: SemiBold (600)
- **Titles**: Medium (500)
- **Body**: Regular (400)
- **Labels**: Medium (500), smaller size

## Components

### File Item Card
- Glass card with gradient icon
- Status dot (pulsing when active)
- Progress bar (when uploading)
- Animated action buttons

### Stats Header
- 4-column layout
- Animated counters
- Color-coded by status

### Bottom Action Bar
- Floating glass card
- Gradient primary button
- Ghost secondary buttons

### Settings Screen
- Connection status card with icon
- Sectioned layout
- Glass text fields
- Toggle switches with brand colors

## Iconography

- Rounded Material Icons
- Consistent 24dp size
- Color-matched to context
- File type icons have unique gradients

## Shadows & Elevation

- Cards: 4-8dp with purple tint
- Buttons: 12dp with violet glow
- Icons: 12dp colored shadow matching gradient

## Responsive States

### Empty State
- Floating cloud icon
- Gradient orb background
- Gentle pulse animation

### Uploading
- Progress indicators
- Status text updates
- Pulsing status dots

### Complete
- Success color theme
- Checkmark icons
- Bounce animation

### Error
- Error color theme
- Retry button
- Shake animation on failure

## Design Principles

1. **Depth through layers** - Glass cards over gradient background
2. **Motion gives feedback** - Every action has visual response
3. **Color communicates** - Status is immediately obvious
4. **Consistency** - Same patterns throughout
5. **Breathing room** - Generous padding, clear hierarchy
