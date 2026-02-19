package com.family.investments.portal.ui.components

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.core.*
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.with
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.family.investments.portal.data.model.UploadFile
import com.family.investments.portal.data.model.UploadStatus
import com.family.investments.portal.ui.theme.*
import java.text.DecimalFormat

/**
 * File Item - Warm minimal card for uploads
 */
@OptIn(ExperimentalAnimationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun FileItem(
    file: UploadFile,
    onRemove: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    val statusColor = when (file.status) {
        UploadStatus.COMPLETED -> Success
        UploadStatus.FAILED -> Error
        UploadStatus.UPLOADING, UploadStatus.CONFIRMING -> Cream
        else -> TextSecondary
    }
    
    WarmCard(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 6.dp),
        cornerRadius = 12.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // File icon with warm muted background
            FileIconContainer(mimeType = file.mimeType, status = file.status)
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // File info
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = file.name,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = TextPrimary
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = formatFileSize(file.size),
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                    
                    // Status indicator
                    if (file.status == UploadStatus.UPLOADING || file.status == UploadStatus.CONFIRMING) {
                        PulsingDot(color = Cream)
                    } else {
                        Box(
                            modifier = Modifier
                                .size(5.dp)
                                .background(statusColor, CircleShape)
                        )
                    }
                    
                    Text(
                        text = getStatusText(file.status),
                        style = MaterialTheme.typography.labelSmall,
                        color = statusColor
                    )
                }
                
                // Progress bar for uploading
                if (file.status == UploadStatus.UPLOADING) {
                    Spacer(modifier = Modifier.height(8.dp))
                    WarmProgressBar(
                        progress = file.progress,
                        color = Cream
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${(file.progress * 100).toInt()}%",
                        style = MaterialTheme.typography.labelSmall,
                        color = CreamMuted
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Action button
            AnimatedContent(
                targetState = file.status,
                transitionSpec = {
                    scaleIn(animationSpec = tween(200)) + fadeIn() with
                    scaleOut(animationSpec = tween(150)) + fadeOut()
                },
                label = "action"
            ) { status ->
                when (status) {
                    UploadStatus.FAILED -> {
                        Row {
                            IconButton(
                                onClick = onRetry,
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(SurfaceHigher, CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Refresh,
                                    contentDescription = "Retry",
                                    tint = Warning,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            
                            Spacer(modifier = Modifier.width(8.dp))
                            
                            IconButton(
                                onClick = onRemove,
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(SurfaceHigher, CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Close,
                                    contentDescription = "Remove",
                                    tint = Error,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                    UploadStatus.COMPLETED -> {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(
                                    Success.copy(alpha = 0.1f),
                                    CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Check,
                                contentDescription = "Completed",
                                tint = Success,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    else -> {
                        if (status == UploadStatus.UPLOADING || status == UploadStatus.CONFIRMING) {
                            Box(
                                modifier = Modifier.size(36.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    strokeWidth = 2.dp,
                                    color = Cream,
                                    trackColor = SurfaceHigher
                                )
                            }
                        } else {
                            IconButton(
                                onClick = onRemove,
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(SurfaceHigher, CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Close,
                                    contentDescription = "Remove",
                                    tint = TextSecondary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FileIconContainer(mimeType: String, status: UploadStatus) {
    val icon = when {
        mimeType.startsWith("image/") -> Icons.Rounded.Image
        mimeType.startsWith("video/") -> Icons.Rounded.Videocam
        mimeType.startsWith("audio/") -> Icons.Rounded.Audiotrack
        mimeType.contains("pdf") -> Icons.Rounded.PictureAsPdf
        mimeType.contains("zip") || mimeType.contains("compressed") -> Icons.Rounded.FolderZip
        else -> Icons.Rounded.InsertDriveFile
    }
    
    // Warm muted icon backgrounds
    val iconBackground = when {
        mimeType.startsWith("image/") -> SurfaceElevated
        mimeType.startsWith("video/") -> SurfaceElevated
        mimeType.startsWith("audio/") -> SurfaceElevated
        else -> SurfaceElevated
    }
    
    val scale by animateFloatAsState(
        targetValue = if (status == UploadStatus.COMPLETED) 1.02f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "scale"
    )
    
    Box(
        modifier = Modifier
            .size(48.dp)
            .scale(scale)
            .background(
                color = iconBackground,
                shape = RoundedCornerShape(12.dp)
            )
            .border(
                width = 1.dp,
                color = BorderDefault,
                shape = RoundedCornerShape(12.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = CreamMuted,
            modifier = Modifier.size(24.dp)
        )
    }
}

/**
 * Warm Progress Bar - Subtle cream progress indicator
 */
@Composable
fun WarmProgressBar(
    progress: Float,
    color: Color = Cream,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(3.dp)
            .background(SurfaceHigher, RoundedCornerShape(2.dp))
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .fillMaxWidth(progress)
                .background(color, RoundedCornerShape(2.dp))
        )
    }
}

/**
 * Pulsing Dot - For active states
 */
@Composable
fun PulsingDot(
    color: Color = Cream,
    size: Dp = 6.dp
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.3f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )
    
    val alpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )
    
    Box(
        modifier = Modifier
            .size(size)
            .scale(scale)
            .background(color.copy(alpha = alpha), CircleShape)
    )
}

private fun getStatusText(status: UploadStatus): String = when (status) {
    UploadStatus.PENDING -> "Ready"
    UploadStatus.REQUESTING_URL -> "Preparing"
    UploadStatus.UPLOADING -> "Uploading"
    UploadStatus.CONFIRMING -> "Processing"
    UploadStatus.COMPLETED -> "Done"
    UploadStatus.FAILED -> "Failed"
}

private fun formatFileSize(size: Long): String {
    if (size < 0) return "Unknown"
    val units = arrayOf("B", "KB", "MB", "GB")
    var unitIndex = 0
    var value = size.toDouble()
    
    while (value >= 1024 && unitIndex < units.size - 1) {
        value /= 1024
        unitIndex++
    }
    
    return "${DecimalFormat("#,##0.##").format(value)} ${units[unitIndex]}"
}
