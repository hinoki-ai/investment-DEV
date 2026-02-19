package com.family.investments.portal.network

import com.family.investments.portal.data.model.ConfirmUploadRequest
import com.family.investments.portal.data.model.ConfirmUploadResponse
import com.family.investments.portal.data.model.UploadUrlRequest
import com.family.investments.portal.data.model.UploadUrlResponse
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface ApiService {
    
    @POST("api/v1/uploads/request-url")
    suspend fun requestUploadUrl(@Body request: UploadUrlRequest): UploadUrlResponse
    
    @POST("api/v1/uploads/confirm")
    suspend fun confirmUpload(@Body request: ConfirmUploadRequest): ConfirmUploadResponse
    
    companion object {
        fun create(baseUrl: String): ApiService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            
            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()
            
            return Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ApiService::class.java)
        }
    }
}
