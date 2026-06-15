package com.playlist.app.ui.player

import com.playlist.app.data.api.models.YouTubeVideoDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Represents a video file to play (downloaded or merged MP4).
 */
data class VideoFileItem(
    val url: String,          // Full HTTP URL to the video file
    val title: String,
    val thumbnailUrl: String? = null,
    val duration: Int = 0,    // Duration in seconds
    val fileSize: Long = 0    // File size in bytes
)

/**
 * Singleton that holds the current player queue state.
 * Shared between HomeScreen (when generating) and PlayerScreen (when playing).
 */
object PlayerState {
    private val _queue = MutableStateFlow<List<YouTubeVideoDto>>(emptyList())
    val queue: StateFlow<List<YouTubeVideoDto>> = _queue.asStateFlow()

    private val _currentIndex = MutableStateFlow(0)
    val currentIndex: StateFlow<Int> = _currentIndex.asStateFlow()

    private val _downloadingVideoId = MutableStateFlow<String?>(null)
    val downloadingVideoId: StateFlow<String?> = _downloadingVideoId.asStateFlow()

    // Video file playback (for downloaded & merged videos)
    private val _videoFileItem = MutableStateFlow<VideoFileItem?>(null)
    val videoFileItem: StateFlow<VideoFileItem?> = _videoFileItem.asStateFlow()

    // Video file queue — list of all downloaded / merged files with current index
    private val _videoFileQueue = MutableStateFlow<List<VideoFileItem>>(emptyList())
    val videoFileQueue: StateFlow<List<VideoFileItem>> = _videoFileQueue.asStateFlow()

    private val _videoFileIndex = MutableStateFlow(0)
    val videoFileIndex: StateFlow<Int> = _videoFileIndex.asStateFlow()

    fun setQueue(videos: List<YouTubeVideoDto>) {
        _queue.value = videos
        _currentIndex.value = 0
        _videoFileItem.value = null
        _videoFileQueue.value = emptyList()
    }

    fun setCurrentIndex(index: Int) {
        _currentIndex.value = index
    }

    fun setVideoFile(item: VideoFileItem) {
        _videoFileItem.value = item
        _videoFileQueue.value = listOf(item)
        _videoFileIndex.value = 0
        _queue.value = emptyList()
    }

    /**
     * Set a full queue of video files (e.g. all downloads) starting at the given index.
     */
    fun setVideoFileQueue(queue: List<VideoFileItem>, startIndex: Int = 0) {
        _videoFileQueue.value = queue
        _videoFileIndex.value = startIndex
        _videoFileItem.value = queue.getOrNull(startIndex)
        _queue.value = emptyList()
    }

    /**
     * Switch to a different video file in the current queue by index.
     */
    fun setVideoFileIndex(index: Int) {
        if (index < 0 || index >= _videoFileQueue.value.size) return
        _videoFileIndex.value = index
        _videoFileItem.value = _videoFileQueue.value[index]
    }

    fun setDownloading(videoId: String?) {
        _downloadingVideoId.value = videoId
    }

    fun clear() {
        _queue.value = emptyList()
        _currentIndex.value = 0
        _downloadingVideoId.value = null
        _videoFileItem.value = null
        _videoFileQueue.value = emptyList()
        _videoFileIndex.value = 0
    }
}
