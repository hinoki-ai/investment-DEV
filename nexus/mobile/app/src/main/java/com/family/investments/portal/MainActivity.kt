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
import com.family.investments.portal.ui.screens.UploadScreen
import com.family.investments.portal.ui.theme.InvestmentPortalTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        // Handle shared files
        val sharedUris = handleIntent(intent)
        
        setContent {
            InvestmentPortalTheme {
                val pendingUris = remember { mutableStateListOf<Uri>() }
                
                LaunchedEffect(sharedUris) {
                    pendingUris.addAll(sharedUris)
                }
                
                UploadScreen(
                    sharedUris = pendingUris.toList()
                )
                
                LaunchedEffect(Unit) {
                    pendingUris.clear()
                }
            }
        }
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle new shared files while app is running
        handleIntent(intent)
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
