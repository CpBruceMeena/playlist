package com.playlist.app.ui.playlists

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.PlaylistDto
import com.playlist.app.data.repository.PlaylistRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PlaylistsUiState(
    val playlists: List<PlaylistDto> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
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
