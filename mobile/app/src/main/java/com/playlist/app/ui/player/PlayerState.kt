package com.playlist.app.ui.player

import com.playlist.app.data.api.models.YouTubeVideoDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Singleton that holds the current player queue state.
 * Shared between HomeScreen (when generating) and PlayerScreen (when playing).
 */
object PlayerState {
    private val _queue = MutableStateFlow<List<YouTubeVideoDto>>(emptyList())
    val queue: StateFlow<List<YouTubeVideoDto>> = _queue.asStateFlow()

    private val _currentIndex = MutableStateFlow(0)
    val currentIndex: StateFlow<Int> = _currentIndex.asStateFlow()

    fun setQueue(videos: List<YouTubeVideoDto>) {
        _queue.value = videos
        _currentIndex.value = 0
    }

    fun setCurrentIndex(index: Int) {
        _currentIndex.value = index
    }

    fun clear() {
        _queue.value = emptyList()
        _currentIndex.value = 0
    }
}
