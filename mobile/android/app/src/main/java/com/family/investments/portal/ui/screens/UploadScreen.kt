@file:OptIn(ExperimentalAnimationApi::class, ExperimentalMaterial3Api::class)

package com.family.investments.portal.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.family.investments.portal.data.local.SettingsDataStore
import com.family.investments.portal.data.model.UploadStatus
import com.family.investments.portal.network.ApiService
import com.family.investments.portal.network.UploadManager
import com.family.investments.portal.ui.components.*
import com.family.investments.portal.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun UploadScreen(
    sharedUris: List<Uri> = emptyList(),
    onNavigateToSettings: () -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    val settingsDataStore = remember { SettingsDataStore(context) }
    val settings by settingsDataStore.settings.collectAsState(
        initial = com.family.investments.portal.data.model.AppSettings()
    )
    
    val uploadManager = remember {
        UploadManager(
            context = context,
            apiService = ApiService.create(settings.apiUrl)
        )
    }
    
    DisposableEffect(settings.apiUrl) {
        onDispose { }
    }
    
    val uploads by uploadManager.uploads.collectAsState()
    val pendingCount = uploads.count { it.status == UploadStatus.PENDING }
    val uploadingCount = uploads.count { 
        it.status == UploadStatus.UPLOADING || 
        it.status == UploadStatus.REQUESTING_URL ||
        it.status == UploadStatus.CONFIRMING 
    }
    val completedCount = uploads.count { it.status == UploadStatus.COMPLETED }
    val hasFailed = uploads.any { it.status == UploadStatus.FAILED }
    
    val isUploading = uploadingCount > 0
    
    // Handle shared files
    LaunchedEffect(sharedUris) {
        if (sharedUris.isNotEmpty()) {
            uploadManager.addFiles(sharedUris, settings.deviceId)
        }
    }
    
    // File picker launcher
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            uploadManager.addFiles(uris, settings.deviceId)
        }
    }
    
    // Permission launcher
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions.values.all { it }) {
            filePickerLauncher.launch(arrayOf("*/*"))
        }
    }
    
    // Background gradient
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepSpace)
    ) {
        // Ambient gradient orbs
        AmbientGlow()
        
        Scaffold(
            topBar = {
                GlassTopBar(
                    uploadCount = uploads.size,
                    completedCount = completedCount,
                    onSettingsClick = onNavigateToSettings
                )
            },
            containerColor = Color.Transparent
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                if (uploads.isEmpty()) {
                    EmptyState()
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(
                            top = 8.dp,
                            bottom = 140.dp
                        )
                    ) {
                        // Stats header
                        item {
                            UploadStatsHeader(
                                total = uploads.size,
                                pending = pendingCount,
                                uploading = uploadingCount,
                                completed = completedCount,
                                modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp)
                            )
                        }
                        
                        items(
                            items = uploads,
                            key = { it.id }
                        ) { file ->
                            FileItem(
                                file = file,
                                onRemove = { uploadManager.removeFile(file.id) },
                                onRetry = { uploadManager.retryUpload(file.id) }
                            )
                        }
                    }
                }
                
                // Bottom action bar
                AnimatedVisibility(
                    visible = uploads.isNotEmpty(),
                    enter = slideInVertically { it } + fadeIn(),
                    exit = slideOutVertically { it } + fadeOut(),
                    modifier = Modifier.align(Alignment.BottomCenter)
                ) {
                    BottomActionBar(
                        pendingCount = pendingCount,
                        isUploading = isUploading,
                        hasFailed = hasFailed,
                        onUploadClick = {
                            scope.launch {
                                uploadManager.uploadAll(settings.deviceId, settings.autoAnalyze)
                            }
                        },
                        onClearCompleted = {
                            uploadManager.clearCompleted()
                        },
                        onAddMore = {
                            checkAndRequestPermissions(context, permissionLauncher, filePickerLauncher)
                        }
                    )
                }
                
                // FAB for adding files when empty
                AnimatedVisibility(
                    visible = uploads.isEmpty(),
                    enter = scaleIn() + fadeIn(),
                    exit = scaleOut() + fadeOut(),
                    modifier = Modifier.align(Alignment.BottomCenter)
                ) {
                    GradientButton(
                        onClick = { 
                            checkAndRequestPermissions(context, permissionLauncher, filePickerLauncher)
                        },
                        modifier = Modifier
                            .padding(24.dp)
                            .fillMaxWidth()
                    ) {
                        Icon(
                            Icons.Rounded.Add,
                            contentDescription = null,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text("Select Files", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GlassTopBar(
    uploadCount: Int,
    completedCount: Int,
    onSettingsClick: () -> Unit
) {
    CenterAlignedTopAppBar(
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "R2 Portal",
                    style = MaterialTheme.typography.titleLarge,
                    color = TextPrimary
                )
                if (uploadCount > 0) {
                    AnimatedContent(
                        targetState = completedCount to uploadCount,
                        transitionSpec = {
                            fadeIn() with fadeOut()
                        },
                        label = "stats"
                    ) { (completed, total) ->
                        Text(
                            text = "$completed / $total uploaded",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }
            }
        },
        actions = {
            IconButton(
                onClick = onSettingsClick,
                modifier = Modifier
                    .padding(end = 8.dp)
                    .size(40.dp)
                    .background(GlassWhite.copy(alpha = 0.1f), CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Rounded.Settings,
                    contentDescription = "Settings",
                    tint = TextSecondary,
                    modifier = Modifier.size(22.dp)
                )
            }
        },
        colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
            containerColor = Color.Transparent
        ),
        modifier = Modifier.background(Color.Transparent)
    )
}

@Composable
private fun UploadStatsHeader(
    total: Int,
    pending: Int,
    uploading: Int,
    completed: Int,
    modifier: Modifier = Modifier
) {
    GlassCard(
        modifier = modifier.fillMaxWidth(),
        cornerRadius = 16.dp,
        elevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatItem(
                value = total,
                label = "Total",
                color = TextPrimary
            )
            StatItem(
                value = pending,
                label = "Pending",
                color = WarningAmber
            )
            StatItem(
                value = uploading,
                label = "Uploading",
                color = CyanGlow
            )
            StatItem(
                value = completed,
                label = "Done",
                color = SuccessEmerald
            )
        }
    }
}

@Composable
private fun StatItem(
    value: Int,
    label: String,
    color: Color
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        AnimatedCounter(
            count = value,
            style = MaterialTheme.typography.headlineSmall.copy(color = color)
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = TextSecondary
        )
    }
}

@Composable
private fun BottomActionBar(
    pendingCount: Int,
    isUploading: Boolean,
    hasFailed: Boolean,
    onUploadClick: () -> Unit,
    onClearCompleted: () -> Unit,
    onAddMore: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .padding(20.dp),
        cornerRadius = 24.dp,
        elevation = 8.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Add more button
                OutlinedButton(
                    onClick = onAddMore,
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = TextSecondary
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        GlassWhite.copy(alpha = 0.2f)
                    )
                ) {
                    Icon(Icons.Rounded.Add, null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Add")
                }
                
                // Upload/Clear button
                if (pendingCount > 0 || isUploading) {
                    GradientButton(
                        onClick = onUploadClick,
                        modifier = Modifier.weight(2f),
                        enabled = !isUploading && pendingCount > 0
                    ) {
                        if (isUploading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Uploading...")
                        } else {
                            Icon(Icons.Rounded.CloudUpload, null, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Upload $pendingCount")
                        }
                    }
                } else {
                    OutlinedButton(
                        onClick = onClearCompleted,
                        modifier = Modifier.weight(2f),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = SuccessEmerald
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            SuccessEmerald.copy(alpha = 0.3f)
                        )
                    ) {
                        Icon(Icons.Rounded.CheckCircle, null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Clear Done")
                    }
                }
            }
        }
    }
}

@Composable
private fun AmbientGlow() {
    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        // Top left glow
        Box(
            modifier = Modifier
                .size(300.dp)
                .offset(x = (-100).dp, y = (-100).dp)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            ElectricViolet.copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    ),
                    CircleShape
                )
        )
        
        // Bottom right glow
        Box(
            modifier = Modifier
                .size(400.dp)
                .offset(x = 200.dp, y = 600.dp)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            ElectricBlue.copy(alpha = 0.1f),
                            Color.Transparent
                        )
                    ),
                    CircleShape
                )
        )
        
        // Center subtle glow
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            CosmicPurple.copy(alpha = 0.05f),
                            Color.Transparent
                        )
                    )
                )
        )
    }
}

private fun checkAndRequestPermissions(
    context: android.content.Context,
    permissionLauncher: androidx.activity.result.ActivityResultLauncher<Array<String>>,
    filePickerLauncher: androidx.activity.result.ActivityResultLauncher<Array<String>>
) {
    val permissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        arrayOf(
            Manifest.permission.READ_MEDIA_IMAGES,
            Manifest.permission.READ_MEDIA_VIDEO,
            Manifest.permission.READ_MEDIA_AUDIO
        )
    } else {
        arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
    }
    
    val hasPermissions = permissions.all {
        ContextCompat.checkSelfPermission(context, it) == android.content.pm.PackageManager.PERMISSION_GRANTED
    }
    
    if (hasPermissions) {
        filePickerLauncher.launch(arrayOf("*/*"))
    } else {
        permissionLauncher.launch(permissions)
    }
}
