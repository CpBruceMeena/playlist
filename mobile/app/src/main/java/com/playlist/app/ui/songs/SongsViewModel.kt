package com.playlist.app.ui.songs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.SavedSongResponseDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.data.repository.SongRepository
import com.playlist.app.ui.components.SnackbarManager
import com.playlist.app.ui.components.ToastType
import com.playlist.app.ui.player.PlayerState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SongsUiState(
    val songs: List<SavedSongResponseDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedIds: Set<String> = emptySet(),
    val singerFilter: String? = null
)

@HiltViewModel
class SongsViewModel @Inject constructor(
    private val songRepository: SongRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SongsUiState())
    val uiState: StateFlow<SongsUiState> = _uiState.asStateFlow()

    init {
        loadSongs()
    }

    fun loadSongs() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = songRepository.listSongs()
            result.fold(
                onSuccess = { songs ->
                    _uiState.value = _uiState.value.copy(
                        songs = songs,
                        isLoading = false,
                        selectedIds = emptySet()
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "Failed to load songs"
                    )
                }
            )
        }
    }

    fun deleteSong(id: String) {
        viewModelScope.launch {
            songRepository.deleteSong(id)
            SnackbarManager.show("Song removed", ToastType.SUCCESS)
            loadSongs()
        }
    }

    fun toggleSelection(id: String) {
        val current = _uiState.value.selectedIds.toMutableSet()
        if (current.contains(id)) {
            current.remove(id)
        } else {
            current.add(id)
        }
        _uiState.value = _uiState.value.copy(selectedIds = current)
    }

    fun selectAll() {
        _uiState.value = _uiState.value.copy(
            selectedIds = _uiState.value.songs.map { it.id }.toSet()
        )
    }

    fun deselectAll() {
        _uiState.value = _uiState.value.copy(selectedIds = emptySet())
    }

    fun setSingerFilter(singerName: String?) {
        _uiState.value = _uiState.value.copy(singerFilter = singerName, selectedIds = emptySet())
    }

    fun playSelected() {
        val selected = _uiState.value.songs.filter { it.id in _uiState.value.selectedIds }
        if (selected.isEmpty()) return
        val videos = selected.map { song ->
            YouTubeVideoDto(
                id = song.videoId,
                title = song.title,
                channelTitle = song.channelTitle,
                thumbnailUrl = song.thumbnailUrl,
                durationSeconds = song.durationSeconds,
                singerName = song.singerName
            )
        }
        PlayerState.setQueue(videos)
        SnackbarManager.show("Playing ${videos.size} songs", ToastType.SUCCESS)
    }

    fun getFilteredSongs(): List<SavedSongResponseDto> {
        val state = _uiState.value
        return if (state.singerFilter != null) {
            state.songs.filter { it.singerName == state.singerFilter }
        } else {
            state.songs
        }
    }

    fun getUniqueSingers(): List<String> {
        return _uiState.value.songs.mapNotNull { it.singerName }.distinct().sorted()
    }
}
