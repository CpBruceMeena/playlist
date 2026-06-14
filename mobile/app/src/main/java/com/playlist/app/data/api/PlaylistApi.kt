package com.playlist.app.data.api

import com.playlist.app.data.api.models.*
import retrofit2.Response
import retrofit2.http.*

interface PlaylistApi {

    // --- Generate ---
    @POST("generate")
    suspend fun generatePlaylist(
        @Body request: GenerateRequest
    ): Response<ApiResponseDto<GenerateResponseDto>>

    // --- Singers ---
    @GET("singers")
    suspend fun listSingers(): Response<ApiResponseDto<SingerResponseDto>>

    @POST("generate/multi-singer")
    suspend fun generateMultiSinger(
        @Body request: MultiSingerRequest
    ): Response<ApiResponseDto<MultiSingerResponseDto>>

    // --- TV Series ---
    @GET("tv-series")
    suspend fun listTVSeries(): Response<ApiResponseDto<TVSeriesResponseDto>>

    @POST("generate/tv-series")
    suspend fun generateTVSeriesPlaylist(
        @Body request: TVSeriesGenerateRequest
    ): Response<ApiResponseDto<TVSeriesGenerateResponseDto>>

    // --- Playlists ---
    @POST("playlists")
    suspend fun savePlaylist(
        @Body request: CreatePlaylistRequest
    ): Response<ApiResponseDto<PlaylistDto>>

    @GET("playlists")
    suspend fun listPlaylists(): Response<ApiResponseDto<PlaylistListResponseDto>>

    @GET("playlists/{id}")
    suspend fun getPlaylist(
        @Path("id") id: String
    ): Response<ApiResponseDto<PlaylistDto>>

    @PATCH("playlists/{id}")
    suspend fun renamePlaylist(
        @Path("id") id: String,
        @Body request: RenamePlaylistRequest
    ): Response<ApiResponseDto<PlaylistDto>>

    @DELETE("playlists/{id}")
    suspend fun deletePlaylist(
        @Path("id") id: String
    ): Response<Unit>

    // --- Merge ---
    @POST("merge")
    suspend fun mergeVideos(
        @Body request: MergeRequest
    ): Response<ApiResponseDto<MergeResponseDto>>

    @GET("merged")
    suspend fun listMergedVideos(): Response<ApiResponseDto<List<MergedVideoDto>>>

    @DELETE("merged/{id}")
    suspend fun deleteMergedVideo(
        @Path("id") id: String
    ): Response<ApiResponseDto<Map<String, Any>>>

    // --- Saved Songs ---
    @POST("songs")
    suspend fun saveSong(
        @Body request: SavedSongRequest
    ): Response<ApiResponseDto<SavedSongResponseDto>>

    @GET("songs")
    suspend fun listSongs(): Response<ApiResponseDto<List<SavedSongResponseDto>>>

    @DELETE("songs/{id}")
    suspend fun deleteSong(
        @Path("id") id: String
    ): Response<Unit>

    // --- Downloads ---
    @POST("downloads")
    suspend fun startDownload(
        @Body request: DownloadRequest
    ): Response<ApiResponseDto<DownloadResponseDto>>

    @GET("downloads")
    suspend fun listDownloads(): Response<ApiResponseDto<List<DownloadResponseDto>>>

    @DELETE("downloads/{id}")
    suspend fun deleteDownload(
        @Path("id") id: String
    ): Response<ApiResponseDto<Map<String, Any>>>
}
