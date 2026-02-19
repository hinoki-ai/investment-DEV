package com.family.investments.portal.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.family.investments.portal.data.model.AppSettings
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

class SettingsDataStore(private val context: Context) {
    
    companion object {
        val API_URL = stringPreferencesKey("api_url")
        val DEVICE_ID = stringPreferencesKey("device_id")
        val AUTO_ANALYZE = booleanPreferencesKey("auto_analyze")
        
        const val DEFAULT_API_URL = "http://10.0.2.2:8000"
        const val DEFAULT_DEVICE_ID = "android-device"
    }
    
    val settings: Flow<AppSettings> = context.dataStore.data.map { preferences ->
        AppSettings(
            apiUrl = preferences[API_URL] ?: DEFAULT_API_URL,
            deviceId = preferences[DEVICE_ID] ?: DEFAULT_DEVICE_ID,
            autoAnalyze = preferences[AUTO_ANALYZE] ?: true
        )
    }
    
    suspend fun updateApiUrl(url: String) {
        context.dataStore.edit { preferences ->
            preferences[API_URL] = url
        }
    }
    
    suspend fun updateDeviceId(deviceId: String) {
        context.dataStore.edit { preferences ->
            preferences[DEVICE_ID] = deviceId
        }
    }
    
    suspend fun updateAutoAnalyze(autoAnalyze: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[AUTO_ANALYZE] = autoAnalyze
        }
    }
    
    suspend fun resetToDefaults() {
        context.dataStore.edit { preferences ->
            preferences[API_URL] = DEFAULT_API_URL
            preferences[DEVICE_ID] = DEFAULT_DEVICE_ID
            preferences[AUTO_ANALYZE] = true
        }
    }
}
