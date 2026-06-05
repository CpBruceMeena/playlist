package com.playlist.app.data.repository

import com.playlist.app.data.api.PlaylistApi
import com.playlist.app.data.api.models.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GenerateRepository @Inject constructor(
    private val api: PlaylistApi
) {
    suspend fun generatePlaylist(
        query: String,
        filters: FilterCriteriaDto? = null
    ): Result<GenerateResponseDto> {
        return try {
            val request = GenerateRequest(
                query = query,
                filters = filters
            )
            val response = api.generatePlaylist(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Generation failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
