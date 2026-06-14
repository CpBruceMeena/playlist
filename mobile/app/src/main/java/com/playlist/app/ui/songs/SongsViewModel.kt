package com.playlist.app.ui.songs

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.*
import com.playlist.app.data.repository.MergeRepository
import com.playlist.app.data.repository.PlaylistRepository
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
    val singerFilter: String? = null,
    val isSavingPlaylist: Boolean = false,
    val isMerging: Boolean = false,
    val showNameDialog: Boolean = false,
    val nameDialogType: NameDialogType = NameDialogType.SavePlaylist,
    val mergeSuccess: String? = null
)

enum class NameDialogType {
    SavePlaylist, Merge
}

@HiltViewModel
class SongsViewModel @Inject constructor(
    private val songRepository: SongRepository,
    private val playlistRepository: PlaylistRepository,
    private val mergeRepository: MergeRepository
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

    // Show save-as-playlist dialog
    fun showSavePlaylistDialog() {
        _uiState.value = _uiState.value.copy(
            showNameDialog = true,
            nameDialogType = NameDialogType.SavePlaylist
        )
    }

    // Show merge dialog
    fun showMergeDialog() {
        _uiState.value = _uiState.value.copy(
            showNameDialog = true,
            nameDialogType = NameDialogType.Merge
        )
    }

    fun dismissNameDialog() {
        _uiState.value = _uiState.value.copy(showNameDialog = false)
    }

    fun saveAsPlaylist(name: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSavingPlaylist = true, showNameDialog = false)
            val selected = _uiState.value.songs.filter { it.id in _uiState.value.selectedIds }
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
            val result = playlistRepository.savePlaylist(
                name = name,
                query = "saved-songs",
                filters = null,
                videos = videos
            )
            result.fold(
                onSuccess = {
                    SnackbarManager.show("Playlist saved: $name", ToastType.SUCCESS)
                    _uiState.value = _uiState.value.copy(isSavingPlaylist = false)
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isSavingPlaylist = false,
                        error = error.message ?: "Failed to save playlist"
                    )
                }
            )
        }
    }

    fun mergeSelected(name: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isMerging = true, showNameDialog = false)
            val selected = _uiState.value.songs.filter { it.id in _uiState.value.selectedIds }
            val videos = selected.map { song ->
                MergeVideoRequest(
                    id = song.videoId,
                    title = song.title,
                    url = "https://www.youtube.com/watch?v=${song.videoId}"
                )
            }
            val result = mergeRepository.mergeVideos(videos)
            result.fold(
                onSuccess = { response ->
                    SnackbarManager.show("Merge started: ${response.filename}", ToastType.SUCCESS)
                    _uiState.value = _uiState.value.copy(
                        isMerging = false,
                        mergeSuccess = response.filename
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isMerging = false,
                        error = error.message ?: "Merge failed"
                    )
                }
            )
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(error = null, mergeSuccess = null)
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
