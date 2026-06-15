package com.playlist.app.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.repository.*
import com.playlist.app.ui.tvseries.TVSeriesEpisodeTracker
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val songCount: Int = 0,
    val tvSeriesCount: Int = 0,
    val tvSeriesEpisodeCount: Int = 0,
    val downloadCount: Int = 0,
    val playlistCount: Int = 0,
    val mergedCount: Int = 0,
    val isLoading: Boolean = false
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val songRepository: SongRepository,
    private val tvSeriesRepository: TVSeriesRepository,
    private val downloadRepository: DownloadRepository,
    private val playlistRepository: PlaylistRepository,
    private val mergeRepository: MergeRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun loadAllCounts() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            // Load all counts in parallel
            launch {
                songRepository.listSongs().onSuccess { songs ->
                    _uiState.value = _uiState.value.copy(songCount = songs.size)
                }
            }
            launch {
                tvSeriesRepository.listSavedTVSeries().onSuccess { series ->
                    _uiState.value = _uiState.value.copy(tvSeriesCount = series.size)
                }
            }
            launch {
                downloadRepository.listDownloads().onSuccess { downloads ->
                    _uiState.value = _uiState.value.copy(downloadCount = downloads.size)
                }
            }
            launch {
                playlistRepository.listPlaylists().onSuccess { playlists ->
                    _uiState.value = _uiState.value.copy(playlistCount = playlists.size)
                }
            }
            launch {
                mergeRepository.listMergedVideos().onSuccess { merged ->
                    _uiState.value = _uiState.value.copy(mergedCount = merged.size)
                }
            }

            _uiState.value = _uiState.value.copy(
                tvSeriesEpisodeCount = TVSeriesEpisodeTracker.savedEpisodeCount,
                isLoading = false
            )
        }
    }
}
