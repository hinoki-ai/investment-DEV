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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.family.investments.portal.data.model.UploadFile
import com.family.investments.portal.data.model.UploadStatus
import com.family.investments.portal.ui.theme.*
import java.text.DecimalFormat

@OptIn(ExperimentalAnimationApi::class, ExperimentalMaterial3Api::class)
@Composable
fun FileItem(
    file: UploadFile,
    onRemove: () -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    val statusColor = when (file.status) {
        UploadStatus.COMPLETED -> SuccessEmerald
        UploadStatus.FAILED -> ErrorRose
        UploadStatus.UPLOADING, UploadStatus.CONFIRMING -> CyanGlow
        else -> TextSecondary
    }
    
    GlassCard(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 6.dp),
        cornerRadius = 20.dp,
        elevation = 4.dp,
        borderAlpha = 0.2f,
        backgroundAlpha = 0.06f
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Animated file icon container
            FileIconContainer(mimeType = file.mimeType, status = file.status)
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // File info
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = file.name,
                    style = MaterialTheme.typography.bodyLarge,
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
                    
                    // Status dot
                    if (file.status == UploadStatus.UPLOADING || file.status == UploadStatus.CONFIRMING) {
                        PulsingDot(color = CyanGlow)
                    } else {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
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
                    AnimatedProgressBar(
                        progress = file.progress,
                        color = Brush.horizontalGradient(
                            colors = listOf(CyanGlow, ElectricBlue)
                        )
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${(file.progress * 100).toInt()}%",
                        style = MaterialTheme.typography.labelSmall,
                        color = CyanGlow
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Animated action button
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
                                    .size(40.dp)
                                    .background(GlassWhite.copy(alpha = 0.1f), CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Refresh,
                                    contentDescription = "Retry",
                                    tint = WarningAmber,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            
                            Spacer(modifier = Modifier.width(8.dp))
                            
                            IconButton(
                                onClick = onRemove,
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(GlassWhite.copy(alpha = 0.1f), CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Close,
                                    contentDescription = "Remove",
                                    tint = ErrorRose,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                    UploadStatus.COMPLETED -> {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .background(
                                    brush = Brush.radialGradient(
                                        colors = listOf(
                                            SuccessEmerald.copy(alpha = 0.2f),
                                            SuccessEmerald.copy(alpha = 0f)
                                        )
                                    ),
                                    CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.CheckCircle,
                                contentDescription = "Completed",
                                tint = SuccessEmerald,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }
                    else -> {
                        if (status == UploadStatus.UPLOADING || status == UploadStatus.CONFIRMING) {
                            Box(
                                modifier = Modifier.size(44.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(28.dp),
                                    strokeWidth = 2.5.dp,
                                    color = CyanGlow,
                                    trackColor = SurfaceGlass
                                )
                            }
                        } else {
                            IconButton(
                                onClick = onRemove,
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(GlassWhite.copy(alpha = 0.1f), CircleShape)
                            ) {
                                Icon(
                                    imageVector = Icons.Rounded.Close,
                                    contentDescription = "Remove",
                                    tint = TextSecondary,
                                    modifier = Modifier.size(20.dp)
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
    
    val gradientColors = when {
        mimeType.startsWith("image/") -> listOf(ElectricViolet, ElectricBlue)
        mimeType.startsWith("video/") -> listOf(ErrorRose, WarningAmber)
        mimeType.startsWith("audio/") -> listOf(CyanGlow, ElectricBlue)
        else -> listOf(Nebula, CosmicPurple)
    }
    
    val scale by animateFloatAsState(
        targetValue = if (status == UploadStatus.COMPLETED) 1.05f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "scale"
    )
    
    Box(
        modifier = Modifier
            .size(56.dp)
            .scale(scale)
            .shadow(
                elevation = 12.dp,
                shape = RoundedCornerShape(16.dp),
                spotColor = gradientColors[0].copy(alpha = 0.5f)
            )
            .background(
                brush = Brush.linearGradient(gradientColors),
                shape = RoundedCornerShape(16.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(28.dp)
        )
    }
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
