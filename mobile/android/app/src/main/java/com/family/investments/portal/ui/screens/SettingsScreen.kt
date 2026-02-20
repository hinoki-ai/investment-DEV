package com.family.investments.portal.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.unit.sp
import com.family.investments.portal.data.local.SettingsDataStore
import com.family.investments.portal.ui.components.*
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
            .background(Void)
    ) {
        // Ambient background
        Box(
            modifier = Modifier
                .size(400.dp)
                .offset(x = (-150).dp, y = (-100).dp)
                .background(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Cream.copy(alpha = 0.03f),
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
                                .background(Surface, CircleShape)
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
                    .padding(horizontal = 16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Spacer(modifier = Modifier.height(8.dp))
                
                // Connection Status Card
                ConnectionStatusCard()
                
                // API Configuration
                SettingsSection(title = "API Configuration") {
                    WarmTextField(
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
                    
                    WarmTextField(
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
                    WarmCard(
                        modifier = Modifier.fillMaxWidth(),
                        cornerRadius = 12.dp
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .background(
                                            Success.copy(alpha = 0.1f),
                                            RoundedCornerShape(10.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Rounded.AutoAwesome,
                                        contentDescription = null,
                                        tint = Success,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                
                                Spacer(modifier = Modifier.width(12.dp))
                                
                                Column {
                                    Text(
                                        text = "Auto-analyze",
                                        style = MaterialTheme.typography.bodyMedium,
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
                                    checkedThumbColor = Void,
                                    checkedTrackColor = Cream,
                                    uncheckedThumbColor = TextSecondary,
                                    uncheckedTrackColor = SurfaceHigher
                                )
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                // Reset button
                GlyphButtonGhost(
                    onClick = {
                        scope.launch {
                            settingsDataStore.resetToDefaults()
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Rounded.Refresh, null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Reset to Defaults")
                }
                
                // Save button
                GlyphButton(
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
                    Icon(Icons.Rounded.Save, null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save Settings", style = MaterialTheme.typography.labelLarge)
                }
                
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

@Composable
private fun ConnectionStatusCard() {
    WarmCard(
        modifier = Modifier.fillMaxWidth(),
        cornerRadius = 16.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(
                        color = SurfaceElevated,
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
                    Icons.Rounded.Cloud,
                    contentDescription = null,
                    tint = Cream,
                    modifier = Modifier.size(24.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Cloud Storage",
                    style = MaterialTheme.typography.titleSmall,
                    color = TextPrimary
                )
                Text(
                    text = "Connected",
                    style = MaterialTheme.typography.bodySmall,
                    color = Success
                )
            }
            
            PulsingDot(color = Success)
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
            color = TextMuted,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp),
            letterSpacing = 0.1.sp
        )
        content()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WarmTextField(
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
        placeholder = { Text(placeholder, color = TextMuted) },
        leadingIcon = {
            Icon(
                leadingIcon,
                contentDescription = null,
                tint = TextSecondary
            )
        },
        modifier = Modifier.fillMaxWidth(),
        keyboardOptions = keyboardOptions,
        supportingText = { Text(supportingText, color = TextMuted) },
        colors = TextFieldDefaults.outlinedTextFieldColors(
            focusedTextColor = TextPrimary,
            unfocusedTextColor = TextPrimary,
            focusedBorderColor = Cream.copy(alpha = 0.5f),
            unfocusedBorderColor = BorderDefault,
            focusedLabelColor = Cream,
            unfocusedLabelColor = TextSecondary,
            containerColor = Surface
        ),
        shape = RoundedCornerShape(10.dp),
        singleLine = true
    )
}
