package com.family.investments.portal.ui.components

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.family.investments.portal.ui.theme.*

/**
 * Warm Card - Subtle frosted surface
 * Inspired by web's glass-card class
 */
@Composable
fun WarmCard(
    modifier: Modifier = Modifier,
    elevation: Dp = 0.dp,
    cornerRadius: Dp = 12.dp,
    backgroundAlpha: Float = 1f,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius))
            .border(
                width = 1.dp,
                color = BorderDefault,
                shape = RoundedCornerShape(cornerRadius)
            ),
        shape = RoundedCornerShape(cornerRadius),
        colors = CardDefaults.cardColors(
            containerColor = Surface.copy(alpha = backgroundAlpha)
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = elevation
        ),
        content = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .animateContentSize(),
                content = content
            )
        }
    )
}

/**
 * Elevated Warm Card - Higher surface for emphasis
 */
@Composable
fun ElevatedWarmCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 16.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius))
            .border(
                width = 1.dp,
                color = BorderDefault,
                shape = RoundedCornerShape(cornerRadius)
            ),
        shape = RoundedCornerShape(cornerRadius),
        colors = CardDefaults.cardColors(
            containerColor = SurfaceElevated
        ),
        content = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .animateContentSize(),
                content = content
            )
        }
    )
}

/**
 * Glyph Button - Nothing Phone inspired
 * Primary action with warm cream accent
 */
@Composable
fun GlyphButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    androidx.compose.material3.Button(
        onClick = onClick,
        modifier = modifier
            .height(48.dp),
        enabled = enabled,
        shape = RoundedCornerShape(8.dp),
        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
            containerColor = Cream,
            contentColor = Void,
            disabledContainerColor = SurfaceHigher,
            disabledContentColor = TextMuted
        ),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
        content = content
    )
}

/**
 * Glyph Button Secondary - Outlined variant
 */
@Composable
fun GlyphButtonSecondary(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    androidx.compose.material3.OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .height(48.dp),
        enabled = enabled,
        shape = RoundedCornerShape(8.dp),
        colors = androidx.compose.material3.ButtonDefaults.outlinedButtonColors(
            contentColor = TextPrimary,
            disabledContentColor = TextMuted
        ),
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = if (enabled) BorderDefault else SurfaceHigher
        ),
        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
        content = content
    )
}

/**
 * Glyph Button Ghost - Minimal variant
 */
@Composable
fun GlyphButtonGhost(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    content: @Composable RowScope.() -> Unit
) {
    androidx.compose.material3.TextButton(
        onClick = onClick,
        modifier = modifier
            .height(40.dp),
        enabled = enabled,
        colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
            contentColor = CreamMuted,
            disabledContentColor = TextMuted
        ),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
        content = content
    )
}

// Legacy GlassCard - redirects to WarmCard for compatibility
@Deprecated("Use WarmCard or ElevatedWarmCard instead", ReplaceWith("WarmCard(modifier, elevation, cornerRadius, content = content)"))
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    elevation: Dp = 0.dp,
    cornerRadius: Dp = 12.dp,
    borderAlpha: Float = 1f,
    backgroundAlpha: Float = 1f,
    content: @Composable ColumnScope.() -> Unit
) {
    WarmCard(
        modifier = modifier,
        elevation = elevation,
        cornerRadius = cornerRadius,
        backgroundAlpha = backgroundAlpha,
        content = content
    )
}

// Legacy GradientButton - redirects to GlyphButton
@Deprecated("Use GlyphButton instead for consistent branding", ReplaceWith("GlyphButton(onClick, modifier, enabled, content = content)"))
@Composable
fun GradientButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    gradient: Brush = Brush.horizontalGradient(
        colors = listOf(Cream, CreamLight)
    ),
    content: @Composable RowScope.() -> Unit
) {
    GlyphButton(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        content = content
    )
}

/**
 * Status Badge - Compact label for states
 */
@Composable
fun StatusBadge(
    text: String,
    type: BadgeType = BadgeType.NEUTRAL
) {
    val (backgroundColor, textColor, borderColor) = when (type) {
        BadgeType.SUCCESS -> Triple(SuccessDim, Success, Success.copy(alpha = 0.2f))
        BadgeType.WARNING -> Triple(WarningDim, Warning, Warning.copy(alpha = 0.2f))
        BadgeType.ERROR -> Triple(ErrorDim, Error, Error.copy(alpha = 0.2f))
        BadgeType.INFO -> Triple(InfoDim, Info, Info.copy(alpha = 0.2f))
        BadgeType.NEUTRAL -> Triple(SurfaceHigher, TextSecondary, BorderDefault)
    }
    
    androidx.compose.material3.Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor)
    ) {
        androidx.compose.material3.Text(
            text = text.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = textColor,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

enum class BadgeType {
    SUCCESS, WARNING, ERROR, INFO, NEUTRAL
}

/**
 * Glyph Pattern Background - Nothing Phone aesthetic
 */
@Composable
fun GlyphPatternBackground(
    modifier: Modifier = Modifier,
    dotSpacing: Dp = 24.dp,
    dotColor: Color = BorderStrong
) {
    Box(
        modifier = modifier
            .background(
                brush = Brush.radialGradient(
                    colors = listOf(
                        dotColor.copy(alpha = 0.3f),
                        Color.Transparent
                    )
                )
            )
    )
}
