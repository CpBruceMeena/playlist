package com.playlist.app.data.api.models

import com.google.gson.annotations.SerializedName

// ─── Filter Criteria ────────────────────────────────────────────

data class FilterCriteriaDto(
    @SerializedName("query") val query: String? = null,
    @SerializedName("durationMin") val durationMin: Int? = null,
    @SerializedName("durationMax") val durationMax: Int? = null,
    @SerializedName("videoTypes") val videoTypes: List<String>? = null,
    @SerializedName("includeKeywords") val includeKeywords: List<String>? = null,
    @SerializedName("excludeKeywords") val excludeKeywords: List<String>? = null,
    @SerializedName("uploadDate") val uploadDate: UploadDateDto? = null,
    @SerializedName("minViews") val minViews: Long? = null,
    @SerializedName("maxResults") val maxResults: Int = 25,
    @SerializedName("safeSearch") val safeSearch: Boolean = true
)

data class UploadDateDto(
    @SerializedName("type") val type: String,
    @SerializedName("start") val start: String? = null,
    @SerializedName("end") val end: String? = null
)

// ─── Generate ───────────────────────────────────────────────────

data class GenerateRequest(
    @SerializedName("query") val query: String,
    @SerializedName("filters") val filters: FilterCriteriaDto? = null
)

data class GenerateResponseDto(
    @SerializedName("videos") val videos: List<YouTubeVideoDto>,
    @SerializedName("quotaUsed") val quotaUsed: Int = 0
)

// ─── Multi-Singer ───────────────────────────────────────────────

data class MultiSingerRequest(
    @SerializedName("singerIds") val singerIds: List<String>,
    @SerializedName("customSingers") val customSingers: List<String>? = null,
    @SerializedName("resultsPerSinger") val resultsPerSinger: Int = 10,
    @SerializedName("filters") val filters: FilterCriteriaDto? = null
)

data class MultiSingerResponseDto(
    @SerializedName("videos") val videos: List<YouTubeVideoDto>,
    @SerializedName("quotaUsed") val quotaUsed: Int = 0,
    @SerializedName("perSingerResults") val perSingerResults: Map<String, Int>? = null,
    @SerializedName("singerNames") val singerNames: Map<String, String>? = null
)

// ─── TV Series ──────────────────────────────────────────────────

data class TVSeriesDto(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("channel") val channel: String,
    @SerializedName("genre") val genre: String,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String? = null,
    @SerializedName("popularityScore") val popularityScore: Int = 0
)

data class TVSeriesResponseDto(
    @SerializedName("series") val series: List<TVSeriesDto>,
    @SerializedName("channels") val channels: List<String>
)

data class TVSeriesGenerateRequest(
    @SerializedName("seriesId") val seriesId: String = "",
    @SerializedName("customName") val customName: String? = null,
    @SerializedName("resultsPerSeries") val resultsPerSeries: Int = 30,
    @SerializedName("filters") val filters: FilterCriteriaDto? = null
)

data class TVSeriesGenerateResponseDto(
    @SerializedName("videos") val videos: List<YouTubeVideoDto>,
    @SerializedName("quotaUsed") val quotaUsed: Int = 0,
    @SerializedName("seriesName") val seriesName: String = ""
)

// ─── Downloads ──────────────────────────────────────────────────

data class DownloadRequest(
    @SerializedName("url") val url: String
)

data class DownloadResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("filename") val filename: String,
    @SerializedName("title") val title: String,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String? = null,
    @SerializedName("duration") val duration: Int = 0,
    @SerializedName("fileSize") val fileSize: Long = 0,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("downloadUrl") val downloadUrl: String? = null
)

// ─── Generic API Response ───────────────────────────────────────

data class ApiResponseDto<T>(
    @SerializedName("data") val data: T? = null
)

data class ApiErrorDto(
    @SerializedName("error") val error: ApiErrorDetailDto? = null
)

data class ApiErrorDetailDto(
    @SerializedName("message") val message: String? = null,
    @SerializedName("code") val code: String? = null
)

data class RenamePlaylistRequest(
    @SerializedName("name") val name: String
)

data class SavedSongRequest(
    @SerializedName("video") val video: SavedSongVideoDto,
    @SerializedName("singerId") val singerId: String? = null,
    @SerializedName("singerName") val singerName: String? = null
)

data class SavedSongVideoDto(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("channelTitle") val channelTitle: String,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String? = null,
    @SerializedName("duration") val duration: String? = null,
    @SerializedName("durationSeconds") val durationSeconds: Int = 0
)

data class SavedSongResponseDto(
    @SerializedName("id") val id: String,
    @SerializedName("videoId") val videoId: String,
    @SerializedName("title") val title: String,
    @SerializedName("channelTitle") val channelTitle: String,
    @SerializedName("thumbnailUrl") val thumbnailUrl: String? = null,
    @SerializedName("duration") val duration: String? = null,
    @SerializedName("durationSeconds") val durationSeconds: Int = 0,
    @SerializedName("singerName") val singerName: String? = null,
    @SerializedName("singerId") val singerId: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)
