package com.playlist.app.data.api.models

import com.google.gson.annotations.SerializedName

data class YouTubeVideoDto(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String? = null,
    @SerializedName("channelId") val channelId: String? = null,
    @SerializedName("channelTitle") val channelTitle: String,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String? = null,
    @SerializedName("duration") val duration: String? = null,
    @SerializedName("durationSeconds") val durationSeconds: Int = 0,
    @SerializedName("viewCount") val viewCount: Long = 0,
    @SerializedName("likeCount") val likeCount: Long = 0,
    @SerializedName("publishedAt") val publishedAt: String? = null,
    @SerializedName("tags") val tags: List<String>? = null,
    @SerializedName("videoType") val videoType: String? = null,
    // Singer attribution (added by multi-singer generation)
    @SerializedName("singerId") val singerId: String? = null,
    @SerializedName("singerName") val singerName: String? = null
)

object VideoType {
    const val MUSIC = "music"
    const val LIVE = "live"
    const val SHORTS = "shorts"
    const val STANDARD = "standard"
}
