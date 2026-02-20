package com.family.investments.portal.ui.theme

import androidx.compose.ui.graphics.Color

// ============================================================
// FAMINV - Warm Dark Minimalism
// Inspired by: Nothing Phone, Linear.app, Brutalist Typography
// Palette: Warm cream accents on deep charcoal
// ============================================================

// Core Palette - Warm Dark
val Void = Color(0xFF0A0A0A)           // Main background - deepest black
val VoidDeep = Color(0xFF070707)       // Deepest void
val Surface = Color(0xFF111111)        // Card surfaces
val SurfaceElevated = Color(0xFF161616) // Elevated surfaces
val SurfaceHigher = Color(0xFF1C1C1C)  // Higher elevation

// Accent - Warm Cream (from favicon)
val Cream = Color(0xFFE8D5C4)          // Primary accent
val CreamLight = Color(0xFFF5E6D3)     // Hover states
val CreamDark = Color(0xFFC9B296)      // Muted accent
val CreamMuted = Color(0xFFA89482)     // Secondary text

// Functional
val TextPrimary = Color(0xFFF5F2ED)    // Main text - warm white
val TextSecondary = Color(0xFF8A8279)  // Body text
val TextMuted = Color(0xFF5C554D)      // Hints, captions
val TextInverse = Color(0xFF0A0A0A)    // Text on light backgrounds

// States - Muted earth tones
val Success = Color(0xFF7FB069)        // Muted sage green
val SuccessDim = Color(0x147FB069)     // 20% opacity
val Warning = Color(0xFFD4A373)        // Warm amber
val WarningDim = Color(0x14D4A373)
val Error = Color(0xFFC76B6B)          // Muted rose
val ErrorDim = Color(0x14C76B6B)
val Info = Color(0xFF6B8CAE)           // Muted blue
val InfoDim = Color(0x146B8CAE)

// Borders
val BorderSubtle = Color(0x0FE8D5C4)   // 6% cream
val BorderDefault = Color(0x1AE8D5C4)  // 10% cream
val BorderStrong = Color(0x26E8D5C4)   // 15% cream

// Glow
val GlowCream = Color(0x26E8D5C4)      // 15% cream glow
val GlowCreamStrong = Color(0x40E8D5C4) // 25% cream glow

// Legacy aliases for gradual migration (deprecated)
@Deprecated("Use Void instead", ReplaceWith("Void"))
val DeepSpace = Void
@Deprecated("Use Surface instead", ReplaceWith("Surface"))
val Midnight = Surface
@Deprecated("Use Cream instead", ReplaceWith("Cream"))
val ElectricViolet = Cream
@Deprecated("Use CreamDark instead", ReplaceWith("CreamDark"))
val ElectricBlue = CreamDark

// Legacy glassmorphism colors (now subtle)
val GlassWhite = BorderDefault
val GlassWhiteStrong = BorderStrong
val GlassBorder = BorderDefault
