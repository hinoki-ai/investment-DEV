package com.family.investments.portal.data.model

import android.net.Uri
import java.util.UUID

/**
 * Represents a file selected for upload
 */
data class UploadFile(
    val id: String = UUID.randomUUID().toString(),
    val uri: Uri,
    val name: String,
    val size: Long,
    val mimeType: String,
    val status: UploadStatus = UploadStatus.PENDING,
    val progress: Float = 0f,
    val errorMessage: String? = null,
    val serverFileId: String? = null,
    val storageKey: String? = null
)

/**
 * Upload status states
 */
enum class UploadStatus {
    PENDING,
    REQUESTING_URL,
    UPLOADING,
    CONFIRMING,
    COMPLETED,
    FAILED
}

/**
 * API Request for pre-signed URL
 */
data class UploadUrlRequest(
    val filename: String,
    val content_type: String,
    val source_device: String = "android",
    val metadata: Map<String, Any> = emptyMap()
)

/**
 * API Response with pre-signed URL
 */
data class UploadUrlResponse(
    val upload_url: String,
    val file_id: String,
    val storage_key: String,
    val expires_in_seconds: Int
)

/**
 * API Request to confirm upload completion
 */
data class ConfirmUploadRequest(
    val file_id: String,
    val request_analysis: Boolean = true,
    val analysis_type: String = "document_analysis"
)

/**
 * API Response for upload confirmation
 */
data class ConfirmUploadResponse(
    val message: String,
    val file_id: String,
    val status: String,
    val analysis_queued: Boolean? = null,
    val job_id: String? = null
)

/**
 * App settings
 */
data class AppSettings(
    val apiUrl: String = "http://10.0.2.2:8000", // Default for Android emulator
    val deviceId: String = "android-device",
    val autoAnalyze: Boolean = true
)
