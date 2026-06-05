package com.playlist.app.data.api.models

import com.google.gson.annotations.SerializedName

data class CreatePlaylistRequest(
    @SerializedName("name") val name: String,
    @SerializedName("query") val query: String,
    @SerializedName("filters") val filters: FilterCriteriaDto? = null,
    @SerializedName("videos") val videos: List<YouTubeVideoDto>
)

data class PlaylistDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("query") val query: String,
    @SerializedName("filters") val filters: FilterCriteriaDto? = null,
    @SerializedName("videos") val videos: List<YouTubeVideoDto>? = null,
    @SerializedName("videoCount") val videoCount: Int? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class PlaylistListResponseDto(
    @SerializedName("playlists") val playlists: List<PlaylistDto> = emptyList()
)
