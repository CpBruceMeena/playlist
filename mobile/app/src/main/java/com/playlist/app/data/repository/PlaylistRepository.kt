package com.playlist.app.data.repository

import com.playlist.app.data.api.PlaylistApi
import com.playlist.app.data.api.models.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PlaylistRepository @Inject constructor(
    private val api: PlaylistApi
) {
    suspend fun savePlaylist(
        name: String,
        query: String,
        filters: FilterCriteriaDto?,
        videos: List<YouTubeVideoDto>
    ): Result<PlaylistDto> {
        return try {
            val request = CreatePlaylistRequest(
                name = name,
                query = query,
                filters = filters,
                videos = videos
            )
            val response = api.savePlaylist(request)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Failed to save playlist: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun listPlaylists(): Result<List<PlaylistDto>> {
        return try {
            val response = api.listPlaylists()
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(body.data.playlists)
            } else {
                Result.failure(Exception("Failed to load playlists: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getPlaylist(id: String): Result<PlaylistDto> {
        return try {
            val response = api.getPlaylist(id)
            if (response.isSuccessful && response.body()?.data != null) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception("Playlist not found: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun renamePlaylist(id: String, newName: String): Result<PlaylistDto> {
        return try {
            val response = api.renamePlaylist(id, RenamePlaylistRequest(name = newName))
            val body = response.body()
            if (response.isSuccessful && body?.data != null) {
                Result.success(body.data)
            } else {
                Result.failure(Exception("Failed to rename: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deletePlaylist(id: String): Result<Unit> {
        return try {
            val response = api.deletePlaylist(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
