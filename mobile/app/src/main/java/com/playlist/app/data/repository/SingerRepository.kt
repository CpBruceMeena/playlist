package com.playlist.app.data.repository

import com.playlist.app.data.api.PlaylistApi
import com.playlist.app.data.api.models.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SingerRepository @Inject constructor(
    private val api: PlaylistApi
) {
    suspend fun listSingers(): Result<SingerResponseDto> {
        return try {
            val response = api.listSingers()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to load singers: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateMultiSinger(
        singerIds: List<String>,
        resultsPerSinger: Int = 10,
        filters: FilterCriteriaDto? = null,
        customSingers: List<String>? = null
    ): Result<MultiSingerResponseDto> {
        return try {
            val request = MultiSingerRequest(
                singerIds = singerIds,
                customSingers = customSingers,
                resultsPerSinger = resultsPerSinger,
                filters = filters
            )
            val response = api.generateMultiSinger(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to generate: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
