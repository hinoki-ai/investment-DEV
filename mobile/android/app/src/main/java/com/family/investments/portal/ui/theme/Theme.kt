package com.family.investments.portal.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Warm Dark Color Scheme - FAMINV Brand
private val WarmDarkColorScheme = darkColorScheme(
    primary = Cream,
    onPrimary = Void,
    primaryContainer = SurfaceElevated,
    onPrimaryContainer = Cream,
    secondary = CreamDark,
    onSecondary = Void,
    secondaryContainer = Surface,
    onSecondaryContainer = CreamMuted,
    tertiary = Success,
    onTertiary = Void,
    error = Error,
    onError = Void,
    background = Void,
    onBackground = TextPrimary,
    surface = Surface,
    onSurface = TextPrimary,
    surfaceVariant = SurfaceElevated,
    onSurfaceVariant = TextSecondary,
    outline = BorderDefault,
    surfaceTint = Cream
)

// Light theme (for completeness, though we default to dark)
private val WarmLightColorScheme = lightColorScheme(
    primary = CreamDark,
    onPrimary = Void,
    primaryContainer = Color(0xFFF8F6F3),
    onPrimaryContainer = Void,
    secondary = CreamMuted,
    onSecondary = Void,
    tertiary = Success,
    onTertiary = Void,
    error = Error,
    onError = Color.White,
    background = Color(0xFFF8F6F3),
    onBackground = Void,
    surface = Color.White,
    onSurface = Void,
    surfaceVariant = Color(0xFFF0EDE8),
    onSurfaceVariant = Color(0xFF5C554D)
)

@Composable
fun InvestmentPortalTheme(
    darkTheme: Boolean = true, // Always default to warm dark for premium feel
    dynamicColor: Boolean = false, // Disable dynamic color to maintain brand consistency
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> WarmDarkColorScheme
        else -> WarmLightColorScheme
    }
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            // Set navigation and status bar to match void background
            window.statusBarColor = Void.toArgb()
            window.navigationBarColor = Void.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
