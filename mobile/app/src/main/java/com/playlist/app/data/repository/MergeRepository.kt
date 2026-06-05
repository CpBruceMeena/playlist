package com.playlist.app.data.repository

import com.playlist.app.data.api.PlaylistApi
import com.playlist.app.data.api.models.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MergeRepository @Inject constructor(
    private val api: PlaylistApi
) {
    suspend fun mergeVideos(
        videos: List<MergeVideoRequest>
    ): Result<MergeResponseDto> {
        return try {
            val request = MergeRequest(videos = videos)
            val response = api.mergeVideos(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Merge failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun listMergedVideos(): Result<List<MergedVideoDto>> {
        return try {
            val response = api.listMergedVideos()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to load merged videos: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
