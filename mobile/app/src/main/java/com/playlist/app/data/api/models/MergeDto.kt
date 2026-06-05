package com.playlist.app.data.api.models

import com.google.gson.annotations.SerializedName

data class MergeVideoRequest(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("url") val url: String
)

data class MergeRequest(
    @SerializedName("videos") val videos: List<MergeVideoRequest>
)

data class MergeResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("filename") val filename: String,
    @SerializedName("url") val url: String,
    @SerializedName("duration") val duration: Int,
    @SerializedName("status") val status: String
)

data class MergedVideoDto(
    @SerializedName("id") val id: String,
    @SerializedName("filename") val filename: String? = null,
    @SerializedName("url") val url: String? = null,
    @SerializedName("name") val name: String? = null,
    @SerializedName("duration") val duration: Int = 0,
    @SerializedName("status") val status: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("songs") val songs: List<MergeSongDto>? = null
)

data class MergeSongDto(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String
)
