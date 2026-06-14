package com.playlist.app.data.repository

import com.playlist.app.data.api.PlaylistApi
import com.playlist.app.data.api.models.DownloadRequest
import com.playlist.app.data.api.models.DownloadResponseDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DownloadRepository @Inject constructor(
    private val api: PlaylistApi
) {
    suspend fun startDownload(url: String): Result<DownloadResponseDto> {
        return try {
            val request = DownloadRequest(url = url)
            val response = api.startDownload(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Download failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun listDownloads(): Result<List<DownloadResponseDto>> {
        return try {
            val response = api.listDownloads()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to load downloads: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteDownload(id: String): Result<Unit> {
        return try {
            val response = api.deleteDownload(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete download: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
