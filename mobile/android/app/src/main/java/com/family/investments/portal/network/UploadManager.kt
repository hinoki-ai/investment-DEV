package com.family.investments.portal.network

import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.family.investments.portal.data.model.ConfirmUploadRequest
import com.family.investments.portal.data.model.UploadFile
import com.family.investments.portal.data.model.UploadStatus
import com.family.investments.portal.data.model.UploadUrlRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okio.source
import okio.buffer
import java.io.File
import java.io.FileInputStream
import java.util.UUID
import java.util.concurrent.TimeUnit

class UploadManager(
    private val context: Context,
    private val apiService: ApiService
) {
    private val _uploads = MutableStateFlow<List<UploadFile>>(emptyList())
    val uploads: StateFlow<List<UploadFile>> = _uploads.asStateFlow()
    
    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()
    
    /**
     * Add files to the upload queue
     */
    fun addFiles(uris: List<Uri>, deviceId: String) {
        val newFiles = uris.mapNotNull { uri ->
            getFileInfo(uri)?.let { (name, size, mimeType) ->
                UploadFile(
                    uri = uri,
                    name = name,
                    size = size,
                    mimeType = mimeType
                )
            }
        }
        
        _uploads.update { current ->
            current + newFiles.filter { new ->
                current.none { it.uri == new.uri }
            }
        }
    }
    
    /**
     * Remove a file from the queue
     */
    fun removeFile(fileId: String) {
        _uploads.update { files ->
            files.filter { it.id != fileId }
        }
    }
    
    /**
     * Clear completed uploads
     */
    fun clearCompleted() {
        _uploads.update { files ->
            files.filter { it.status != UploadStatus.COMPLETED }
        }
    }
    
    /**
     * Retry a failed upload
     */
    fun retryUpload(fileId: String) {
        _uploads.update { files ->
            files.map { file ->
                if (file.id == fileId) {
                    file.copy(
                        status = UploadStatus.PENDING,
                        progress = 0f,
                        errorMessage = null
                    )
                } else file
            }
        }
    }
    
    /**
     * Upload all pending files
     */
    suspend fun uploadAll(deviceId: String, autoAnalyze: Boolean = true) {
        val pendingFiles = _uploads.value.filter { 
            it.status == UploadStatus.PENDING || it.status == UploadStatus.FAILED 
        }
        
        pendingFiles.forEach { file ->
            uploadFile(file, deviceId, autoAnalyze)
        }
    }
    
    /**
     * Upload a single file using pre-signed URL flow
     */
    private suspend fun uploadFile(file: UploadFile, deviceId: String, autoAnalyze: Boolean) {
        try {
            // Step 1: Request pre-signed URL
            updateFileStatus(file.id, UploadStatus.REQUESTING_URL)
            
            val urlRequest = UploadUrlRequest(
                filename = file.name,
                content_type = file.mimeType,
                source_device = deviceId,
                metadata = mapOf(
                    "original_size" to file.size,
                    "uploaded_from" to "android"
                )
            )
            
            val urlResponse = apiService.requestUploadUrl(urlRequest)
            
            // Step 2: Upload directly to storage (R2/S3/MinIO)
            updateFileStatus(file.id, UploadStatus.UPLOADING, progress = 0.1f)
            
            val uploadSuccess = uploadToStorage(
                uploadUrl = urlResponse.upload_url,
                fileUri = file.uri,
                mimeType = file.mimeType,
                fileId = file.id
            )
            
            if (!uploadSuccess) {
                throw Exception("Failed to upload to storage")
            }
            
            // Step 3: Confirm upload with API
            updateFileStatus(file.id, UploadStatus.CONFIRMING, progress = 0.9f)
            
            val confirmRequest = ConfirmUploadRequest(
                file_id = urlResponse.file_id,
                request_analysis = autoAnalyze,
                analysis_type = "document_analysis"
            )
            
            apiService.confirmUpload(confirmRequest)
            
            // Mark as completed
            updateFileStatus(
                fileId = file.id,
                status = UploadStatus.COMPLETED,
                progress = 1f,
                serverFileId = urlResponse.file_id,
                storageKey = urlResponse.storage_key
            )
            
        } catch (e: Exception) {
            updateFileStatus(
                fileId = file.id,
                status = UploadStatus.FAILED,
                errorMessage = e.message ?: "Unknown error"
            )
        }
    }
    
    /**
     * Upload file directly to R2/S3 using pre-signed URL
     */
    private suspend fun uploadToStorage(
        uploadUrl: String,
        fileUri: Uri,
        mimeType: String,
        fileId: String
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val tempFile = createTempFileFromUri(fileUri) ?: return@withContext false
            
            try {
                val mediaType = mimeType.toMediaTypeOrNull() 
                    ?: "application/octet-stream".toMediaTypeOrNull()
                
                val requestBody = tempFile.asRequestBody(mediaType)
                
                val request = Request.Builder()
                    .url(uploadUrl)
                    .put(requestBody)
                    .header("Content-Type", mimeType)
                    .build()
                
                // Update progress periodically
                updateFileStatus(fileId, UploadStatus.UPLOADING, progress = 0.3f)
                
                okHttpClient.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        updateFileStatus(fileId, UploadStatus.UPLOADING, progress = 0.8f)
                        true
                    } else {
                        false
                    }
                }
            } finally {
                tempFile.delete()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }
    
    /**
     * Create a temporary file from URI for upload
     */
    private fun createTempFileFromUri(uri: Uri): File? {
        return try {
            val tempFile = File.createTempFile("upload_", "_tmp", context.cacheDir)
            context.contentResolver.openInputStream(uri)?.use { input ->
                FileInputStream(tempFile).use { output ->
                    input.copyTo(output)
                }
            }
            tempFile
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
    
    /**
     * Get file information from URI
     */
    private fun getFileInfo(uri: Uri): Triple<String, Long, String>? {
        return try {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                
                if (cursor.moveToFirst()) {
                    val name = if (nameIndex != -1) cursor.getString(nameIndex) else "unknown"
                    val size = if (sizeIndex != -1) cursor.getLong(sizeIndex) else -1L
                    val mimeType = context.contentResolver.getType(uri) ?: "application/octet-stream"
                    
                    Triple(name, size, mimeType)
                } else null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Update file status in the list
     */
    private fun updateFileStatus(
        fileId: String,
        status: UploadStatus,
        progress: Float = 0f,
        errorMessage: String? = null,
        serverFileId: String? = null,
        storageKey: String? = null
    ) {
        _uploads.update { files ->
            files.map { file ->
                if (file.id == fileId) {
                    file.copy(
                        status = status,
                        progress = progress,
                        errorMessage = errorMessage,
                        serverFileId = serverFileId ?: file.serverFileId,
                        storageKey = storageKey ?: file.storageKey
                    )
                } else file
            }
        }
    }
}
