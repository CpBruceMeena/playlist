package com.playlist.app.ui.playlists

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.PlaylistDto
import com.playlist.app.data.repository.PlaylistRepository
import com.playlist.app.ui.player.PlayerState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PlaylistsUiState(
    val playlists: List<PlaylistDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val playingId: String? = null  // non-null while fetching videos for playback
)

@HiltViewModel
class PlaylistsViewModel @Inject constructor(
    private val playlistRepository: PlaylistRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(PlaylistsUiState())
    val uiState: StateFlow<PlaylistsUiState> = _uiState.asStateFlow()

    init {
        loadPlaylists()
    }

    fun loadPlaylists() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            val result = playlistRepository.listPlaylists()
            result.fold(
                onSuccess = { playlists ->
                    _uiState.value = PlaylistsUiState(
                        playlists = playlists,
                        isLoading = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "Failed to load playlists"
                    )
                }
            )
        }
    }

    /**
     * Fetch the full playlist (with videos) and set the player queue.
     */
    fun playPlaylist(id: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(playingId = id)

            val result = playlistRepository.getPlaylist(id)
            result.fold(
                onSuccess = { playlist ->
                    _uiState.value = _uiState.value.copy(playingId = null)
                    playlist.videos?.let { videos ->
                        if (videos.isNotEmpty()) {
                            PlayerState.setQueue(videos)
                        }
                    }
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        playingId = null,
                        error = error.message ?: "Failed to load playlist videos"
                    )
                }
            )
        }
    }

    fun deletePlaylist(id: String) {
        viewModelScope.launch {
            playlistRepository.deletePlaylist(id)
            loadPlaylists()
        }
    }

    fun renamePlaylist(id: String, newName: String) {
        viewModelScope.launch {
            val result = playlistRepository.renamePlaylist(id, newName)
            result.fold(
                onSuccess = { updated ->
                    val updatedList = _uiState.value.playlists.map { playlist ->
                        if (playlist.id == id) updated else playlist
                    }
                    _uiState.value = _uiState.value.copy(playlists = updatedList)
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        error = error.message ?: "Failed to rename playlist"
                    )
                }
            )
        }
    }
}
