package com.playlist.app.data.api.models

import com.google.gson.annotations.SerializedName

data class SingerDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("genre") val genre: String,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String? = null,
    @SerializedName("youtubeChannelId") val youtubeChannelId: String? = null,
    @SerializedName("popularityScore") val popularityScore: Int = 0
)

data class SingerResponseDto(
    @SerializedName("singers") val singers: List<SingerDto>,
    @SerializedName("genres") val genres: List<String>
)
