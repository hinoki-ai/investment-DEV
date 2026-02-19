package com.family.investments.portal.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.*
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.with
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import com.family.investments.portal.ui.theme.*

/**
 * Animated Counter - Number transitions with smooth slide animation
 */
@OptIn(ExperimentalAnimationApi::class)
@Composable
fun AnimatedCounter(
    count: Int,
    modifier: Modifier = Modifier,
    style: TextStyle = MaterialTheme.typography.headlineLarge
) {
    AnimatedContent(
        targetState = count,
        modifier = modifier,
        transitionSpec = {
            slideInVertically { height -> height } with
            slideOutVertically { height -> -height }
        },
        label = "counter"
    ) { targetCount ->
        Text(
            text = targetCount.toString(),
            style = style
        )
    }
}

/**
 * Shimmer Effect - For loading states
 */
@Composable
fun ShimmerEffect(
    modifier: Modifier = Modifier,
    widthOfShadowBrush: Int = 500,
    angleOfAxisY: Float = 270f,
    durationMillis: Int = 1000,
    content: @Composable () -> Unit
) {
    val shimmerColors = listOf(
        Cream.copy(alpha = 0.0f),
        Cream.copy(alpha = 0.1f),
        Cream.copy(alpha = 0.0f)
    )
    
    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnimation = transition.animateFloat(
        initialValue = 0f,
        targetValue = (durationMillis + widthOfShadowBrush).toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = durationMillis,
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer"
    )
    
    val brush = Brush.linearGradient(
        colors = shimmerColors,
        start = androidx.compose.ui.geometry.Offset(
            x = translateAnimation.value - widthOfShadowBrush,
            y = 0f
        ),
        end = androidx.compose.ui.geometry.Offset(
            x = translateAnimation.value,
            y = angleOfAxisY
        )
    )
    
    Box(modifier = modifier) {
        content()
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(brush)
        )
    }
}

/**
 * Animated Progress Bar - Warm minimal style
 */
@Composable
fun AnimatedProgressBar(
    progress: Float,
    modifier: Modifier = Modifier,
    color: Color = Cream
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(300, easing = FastOutSlowInEasing),
        label = "progress"
    )
    
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(3.dp)
    ) {
        // Background
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    SurfaceHigher,
                    RoundedCornerShape(2.dp)
                )
        )
        
        // Progress
        Box(
            modifier = Modifier
                .fillMaxWidth(animatedProgress)
                .fillMaxHeight()
                .background(
                    color,
                    RoundedCornerShape(2.dp)
                )
        )
    }
}

// Legacy overload with Brush (deprecated)
@Deprecated("Use version with Color parameter instead", ReplaceWith("AnimatedProgressBar(progress, modifier, Cream)"))
@Composable
fun AnimatedProgressBar(
    progress: Float,
    modifier: Modifier = Modifier,
    color: Brush = Brush.horizontalGradient(
        colors = listOf(Cream, CreamLight)
    )
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(300, easing = FastOutSlowInEasing),
        label = "progress"
    )
    
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(3.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    SurfaceHigher,
                    RoundedCornerShape(2.dp)
                )
        )
        
        Box(
            modifier = Modifier
                .fillMaxWidth(animatedProgress)
                .fillMaxHeight()
                .background(
                    Cream,
                    RoundedCornerShape(2.dp)
                )
        )
    }
}
