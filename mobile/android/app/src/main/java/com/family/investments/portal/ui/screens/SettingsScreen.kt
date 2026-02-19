package com.family.investments.portal.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.family.investments.portal.data.local.SettingsDataStore
import com.family.investments.portal.ui.components.GlassCard
import com.family.investments.portal.ui.components.GradientButton
import com.family.investments.portal.ui.components.PulsingDot
import com.family.investments.portal.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val settingsDataStore = remember { SettingsDataStore(context) }
    
    val settings by settingsDataStore.settings.collectAsState(
        initial = com.family.investments.portal.data.model.AppSettings()
    )
    
    var apiUrl by remember { mutableStateOf("") }
    var deviceId by remember { mutableStateOf("") }
    var autoAnalyze by remember { mutableStateOf(true) }
    
    LaunchedEffect(settings) {
        apiUrl = settings.apiUrl
        deviceId = settings.deviceId
        autoAnalyze = settings.autoAnalyze
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DeepSpace)
    ) {
        // Ambient background
        Box(
            modifier = Modifier
                .size(400.dp)
                .offset(x = (-150).dp, y = (-100).dp)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            ElectricViolet.copy(alpha = 0.1f),
                            Color.Transparent
                        )
                    ),
                    CircleShape
                )
        )
        
        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            text = "Settings",
                            style = MaterialTheme.typography.titleLarge,
                            color = TextPrimary
                        )
                    },
                    navigationIcon = {
                        IconButton(
                            onClick = onNavigateBack,
                            modifier = Modifier
                                .padding(start = 8.dp)
                                .size(40.dp)
                                .background(GlassWhite.copy(alpha = 0.1f), CircleShape)
                        ) {
                            Icon(
                                Icons.Rounded.ArrowBack,
                                contentDescription = "Back",
                                tint = TextPrimary
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
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Spacer(modifier = Modifier.height(8.dp))
                
                // Connection Status Card
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    cornerRadius = 20.dp
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .background(
                                    brush = Brush.linearGradient(
                                        listOf(ElectricViolet, ElectricBlue)
                                    ),
                                    RoundedCornerShape(16.dp)
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Rounded.Cloud,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                        
                        Spacer(modifier = Modifier.width(16.dp))
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Cloudflare R2",
                                style = MaterialTheme.typography.titleMedium,
                                color = TextPrimary
                            )
                            Text(
                                text = "Connected",
                                style = MaterialTheme.typography.bodyMedium,
                                color = SuccessEmerald
                            )
                        }
                        
                        PulsingDot(color = SuccessEmerald)
                    }
                }
                
                // API Configuration
                SettingsSection(title = "API Configuration") {
                    // API URL
                    GlassTextField(
                        value = apiUrl,
                        onValueChange = { apiUrl = it },
                        label = "API URL",
                        placeholder = "http://10.0.2.2:8000",
                        leadingIcon = Icons.Rounded.Link,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Uri,
                            imeAction = ImeAction.Next
                        ),
                        supportingText = "Your API server address"
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    // Device ID
                    GlassTextField(
                        value = deviceId,
                        onValueChange = { deviceId = it },
                        label = "Device ID",
                        placeholder = "android-device",
                        leadingIcon = Icons.Rounded.Devices,
                        keyboardOptions = KeyboardOptions(
                            imeAction = ImeAction.Done
                        ),
                        supportingText = "Identifier for this device"
                    )
                }
                
                // Processing Options
                SettingsSection(title = "Processing") {
                    GlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        cornerRadius = 16.dp
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .background(
                                            MintGreen.copy(alpha = 0.15f),
                                            RoundedCornerShape(12.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Rounded.AutoAwesome,
                                        contentDescription = null,
                                        tint = MintGreen,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                
                                Spacer(modifier = Modifier.width(16.dp))
                                
                                Column {
                                    Text(
                                        text = "Auto-analyze",
                                        style = MaterialTheme.typography.bodyLarge,
                                        color = TextPrimary
                                    )
                                    Text(
                                        text = "Queue uploads for AI analysis",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = TextSecondary
                                    )
                                }
                            }
                            
                            Switch(
                                checked = autoAnalyze,
                                onCheckedChange = { autoAnalyze = it },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = ElectricViolet,
                                    uncheckedThumbColor = TextSecondary,
                                    uncheckedTrackColor = SurfaceGlass
                                )
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                // Reset button
                TextButton(
                    onClick = {
                        scope.launch {
                            settingsDataStore.resetToDefaults()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = TextTertiary
                    )
                ) {
                    Icon(Icons.Rounded.Refresh, null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Reset to Defaults")
                }
                
                // Save button
                GradientButton(
                    onClick = {
                        scope.launch {
                            settingsDataStore.updateApiUrl(apiUrl)
                            settingsDataStore.updateDeviceId(deviceId)
                            settingsDataStore.updateAutoAnalyze(autoAnalyze)
                            onNavigateBack()
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = apiUrl.isNotBlank() && deviceId.isNotBlank()
                ) {
                    Icon(Icons.Rounded.Save, null, modifier = Modifier.size(22.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Save Settings", style = MaterialTheme.typography.titleMedium)
                }
                
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Column {
        Text(
            text = title.uppercase(),
            style = MaterialTheme.typography.labelSmall,
            color = TextTertiary,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        content()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GlassTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    placeholder: String,
    leadingIcon: androidx.compose.ui.graphics.vector.ImageVector,
    keyboardOptions: KeyboardOptions,
    supportingText: String
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = { Text(placeholder, color = TextTertiary) },
        leadingIcon = {
            Icon(
                leadingIcon,
                contentDescription = null,
                tint = TextSecondary
            )
        },
        modifier = Modifier.fillMaxWidth(),
        keyboardOptions = keyboardOptions,
        supportingText = { Text(supportingText, color = TextTertiary) },
        colors = TextFieldDefaults.outlinedTextFieldColors(
            focusedTextColor = TextPrimary,
            unfocusedTextColor = TextPrimary,
            focusedBorderColor = ElectricViolet.copy(alpha = 0.5f),
            unfocusedBorderColor = GlassWhite.copy(alpha = 0.2f),
            focusedLabelColor = ElectricViolet,
            unfocusedLabelColor = TextSecondary,
            containerColor = SurfaceGlass
        ),
        shape = RoundedCornerShape(16.dp),
        singleLine = true
    )
}
