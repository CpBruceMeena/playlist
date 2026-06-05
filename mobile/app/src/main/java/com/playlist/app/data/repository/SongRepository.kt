package com.playlist.app.data.repository

import com.playlist.app.data.api.PlaylistApi
import com.playlist.app.data.api.models.SavedSongRequest
import com.playlist.app.data.api.models.SavedSongResponseDto
import com.playlist.app.data.api.models.SavedSongVideoDto
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SongRepository @Inject constructor(
    private val api: PlaylistApi
) {
    suspend fun saveSong(
        video: SavedSongVideoDto,
        singerId: String? = null,
        singerName: String? = null
    ): Result<SavedSongResponseDto> {
        return try {
            val request = SavedSongRequest(
                video = video,
                singerId = singerId,
                singerName = singerName
            )
            val response = api.saveSong(request)
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception("Failed to save song: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun listSongs(): Result<List<SavedSongResponseDto>> {
        return try {
            val response = api.listSongs()
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception("Failed to load songs: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteSong(id: String): Result<Unit> {
        return try {
            val response = api.deleteSong(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete song: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
