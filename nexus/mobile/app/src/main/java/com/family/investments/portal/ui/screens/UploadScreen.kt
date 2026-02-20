@file:OptIn(ExperimentalMaterial3Api::class)

package com.family.investments.portal.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import com.family.investments.portal.data.model.UploadStatus
import com.family.investments.portal.network.ApiService
import com.family.investments.portal.network.UploadManager
import com.family.investments.portal.ui.components.FileItem
import com.family.investments.portal.ui.components.GlyphButton
import com.family.investments.portal.ui.theme.*

@Composable
fun UploadScreen(
    sharedUris: List<Uri> = emptyList()
) {
    val context = LocalContext.current
    
    // HARDCODED - NO SETTINGS
    val uploadManager = remember {
        UploadManager(
            context = context,
            apiService = ApiService.create("https://prisma-api-aramac.koyeb.app")
        )
    }
    
    val uploads by uploadManager.uploads.collectAsState()
    val pendingCount = uploads.count { it.status == UploadStatus.PENDING }
    val completedCount = uploads.count { it.status == UploadStatus.COMPLETED }
    
    // Handle shared files
    LaunchedEffect(sharedUris) {
        if (sharedUris.isNotEmpty()) {
            uploadManager.addFiles(sharedUris, "nexus-mobile")
        }
    }
    
    // Auto-upload when files added
    LaunchedEffect(pendingCount) {
        if (pendingCount > 0) {
            uploadManager.uploadAll("nexus-mobile", true)
        }
    }
    
    // File picker
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenMultipleDocuments()
    ) { uris: List<Uri> ->
        if (uris.isNotEmpty()) {
            uploadManager.addFiles(uris, "nexus-mobile")
        }
    }
    
    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions.values.all { it }) {
            filePickerLauncher.launch(arrayOf("*/*"))
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Void)
    ) {
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            text = "Nexus",
                            style = MaterialTheme.typography.titleLarge,
                            color = Cream
                        )
                    },
                    actions = {
                        if (uploads.isNotEmpty()) {
                            Text(
                                text = "$completedCount/${uploads.size}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextSecondary,
                                modifier = Modifier.padding(end = 16.dp)
                            )
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = Color.Transparent
                    )
                )
            },
            containerColor = Color.Transparent
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                when {
                    // Empty state - BIG upload button
                    uploads.isEmpty() -> {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(24.dp)
                            ) {
                                // Big square upload button with rounded corners
                                Button(
                                    onClick = {
                                        checkAndRequestPermissions(context, permissionLauncher, filePickerLauncher)
                                    },
                                    modifier = Modifier.size(120.dp),
                                    shape = RoundedCornerShape(24.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Cream,
                                        contentColor = Void
                                    )
                                ) {
                                    Icon(
                                        Icons.Rounded.Add,
                                        contentDescription = "Add files",
                                        modifier = Modifier.size(48.dp)
                                    )
                                }
                                
                                Text(
                                    text = "Tap to upload",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextSecondary
                                )
                                
                                Text(
                                    text = "Or share from any app",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextMuted
                                )
                            }
                        }
                    }
                    
                    // File list
                    else -> {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(
                                top = 8.dp,
                                bottom = 100.dp
                            )
                        ) {
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
                        
                        // Bottom add button
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(16.dp)
                        ) {
                            GlyphButton(
                                onClick = {
                                    checkAndRequestPermissions(context, permissionLauncher, filePickerLauncher)
                                }
                            ) {
                                Icon(Icons.Rounded.Add, null, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Add More")
                            }
                        }
                    }
                }
            }
        }
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
