package com.playlist.app.data.repository

import com.playlist.app.data.api.PlaylistApi
import com.playlist.app.data.api.models.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TVSeriesRepository @Inject constructor(
    private val api: PlaylistApi
) {
    suspend fun listTVSeries(): Result<TVSeriesResponseDto> {
        return try {
            val response = api.listTVSeries()
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to load TV series: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateTVSeriesPlaylist(
        seriesId: String,
        resultsPerSeries: Int = 30,
        filters: FilterCriteriaDto? = null,
        customName: String? = null
    ): Result<TVSeriesGenerateResponseDto> {
        return try {
            val request = TVSeriesGenerateRequest(
                seriesId = seriesId,
                customName = customName,
                resultsPerSeries = resultsPerSeries,
                filters = filters
            )
            val response = api.generateTVSeriesPlaylist(request)
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
