package com.family.investments.portal

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.remember
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.family.investments.portal.ui.screens.SettingsScreen
import com.family.investments.portal.ui.screens.UploadScreen
import com.family.investments.portal.ui.theme.InvestmentPortalTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Handle intent (shared files)
        val sharedUris = handleIntent(intent)
        
        setContent {
            InvestmentPortalTheme {
                val navController = rememberNavController()
                val pendingUris = remember { mutableStateListOf<Uri>() }
                
                // Add any initially shared URIs
                LaunchedEffect(sharedUris) {
                    pendingUris.addAll(sharedUris)
                }
                
                NavHost(
                    navController = navController,
                    startDestination = "upload"
                ) {
                    composable("upload") {
                        UploadScreen(
                            sharedUris = pendingUris.toList(),
                            onNavigateToSettings = {
                                navController.navigate("settings")
                            }
                        )
                        // Clear after passing to screen
                        LaunchedEffect(Unit) {
                            pendingUris.clear()
                        }
                    }
                    composable("settings") {
                        SettingsScreen(
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }
                }
            }
        }
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle new shared files while app is running
        val sharedUris = handleIntent(intent)
        // TODO: Pass these to the current screen via ViewModel or state
    }
    
    private fun handleIntent(intent: Intent): List<Uri> {
        val uris = mutableListOf<Uri>()
        
        when (intent.action) {
            Intent.ACTION_SEND -> {
                intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)?.let {
                    uris.add(it)
                }
            }
            Intent.ACTION_SEND_MULTIPLE -> {
                intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?.let {
                    uris.addAll(it)
                }
            }
        }
        
        return uris
    }
}
