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
import com.family.investments.portal.ui.theme.GlassBorder
import com.family.investments.portal.ui.theme.GlassWhite
import com.family.investments.portal.ui.theme.GlassWhiteStrong

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    elevation: Dp = 8.dp,
    cornerRadius: Dp = 20.dp,
    borderAlpha: Float = 0.15f,
    backgroundAlpha: Float = 0.08f,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .shadow(
                elevation = elevation,
                shape = RoundedCornerShape(cornerRadius),
                spotColor = Color(0xFF8B5CF6).copy(alpha = 0.15f)
            )
            .clip(RoundedCornerShape(cornerRadius))
            .border(
                width = 1.dp,
                color = GlassBorder.copy(alpha = borderAlpha),
                shape = RoundedCornerShape(cornerRadius)
            ),
        shape = RoundedCornerShape(cornerRadius),
        colors = CardDefaults.cardColors(
            containerColor = GlassWhite.copy(alpha = backgroundAlpha)
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

@Composable
fun GradientButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    gradient: Brush = Brush.horizontalGradient(
        colors = listOf(
            com.family.investments.portal.ui.theme.GradientStart,
            com.family.investments.portal.ui.theme.GradientEnd
        )
    ),
    content: @Composable RowScope.() -> Unit
) {
    androidx.compose.material3.Button(
        onClick = onClick,
        modifier = modifier
            .height(56.dp)
            .shadow(
                elevation = if (enabled) 12.dp else 0.dp,
                shape = RoundedCornerShape(16.dp),
                spotColor = com.family.investments.portal.ui.theme.ElectricViolet.copy(alpha = 0.4f)
            ),
        enabled = enabled,
        shape = RoundedCornerShape(16.dp),
        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
            containerColor = Color.Transparent,
            disabledContainerColor = Color(0xFF334155)
        ),
        contentPadding = PaddingValues(horizontal = 24.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(gradient)
        ) {
            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                content = content
            )
        }
    }
}

@Composable
fun GlowSurface(
    modifier: Modifier = Modifier,
    glowColor: Color = com.family.investments.portal.ui.theme.ElectricViolet,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier
            .shadow(
                elevation = 20.dp,
                shape = RoundedCornerShape(24.dp),
                spotColor = glowColor.copy(alpha = 0.3f)
            )
    ) {
        content()
    }
}
