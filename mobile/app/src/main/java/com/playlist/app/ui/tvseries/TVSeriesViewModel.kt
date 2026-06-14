package com.playlist.app.ui.tvseries

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.*
import com.playlist.app.data.repository.MergeRepository
import com.playlist.app.data.repository.PlaylistRepository
import com.playlist.app.data.repository.TVSeriesRepository
import com.playlist.app.ui.components.SnackbarManager
import com.playlist.app.ui.components.ToastType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TVSeriesUiState(
    val series: List<TVSeriesDto> = emptyList(),
    val channels: List<String> = emptyList(),
    val filteredSeries: List<TVSeriesDto> = emptyList(),
    val channelFilter: String? = null,
    val searchQuery: String = "",
    val selectedSeriesId: String? = null,
    val selectedSeriesName: String? = null,
    val customSeriesName: String = "",
    val isGenerating: Boolean = false,
    val generatedVideos: List<YouTubeVideoDto> = emptyList(),
    val error: String? = null,
    val isLoading: Boolean = false,

    // Saved/bookmarked series
    val savedSeries: List<TVSeriesDto> = emptyList(),
    val showSaveDialog: Boolean = false,
    val saveDialogSeries: TVSeriesDto? = null,

    // Playlist/merge dialogs
    val showNameDialog: Boolean = false,
    val nameDialogType: NameDialogType = NameDialogType.SavePlaylist,
    val isSaving: Boolean = false,
    val isMerging: Boolean = false
)

enum class NameDialogType {
    SavePlaylist, Merge
}

@HiltViewModel
class TVSeriesViewModel @Inject constructor(
    private val tvSeriesRepository: TVSeriesRepository,
    private val playlistRepository: PlaylistRepository,
    private val mergeRepository: MergeRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TVSeriesUiState())
    val uiState: StateFlow<TVSeriesUiState> = _uiState.asStateFlow()

    init { loadSeries() }

    fun loadSeries() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            val result = tvSeriesRepository.listTVSeries()
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        series = response.series,
                        channels = response.channels,
                        filteredSeries = response.series,
                        isLoading = false
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load TV series"
                    )
                }
            )
        }
    }

    fun onSearchQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        applyFilters()
    }

    fun onChannelSelect(channel: String?) {
        _uiState.value = _uiState.value.copy(channelFilter = channel)
        applyFilters()
    }

    private fun applyFilters() {
        val state = _uiState.value
        var filtered = state.series
        state.channelFilter?.let { channel ->
            filtered = filtered.filter { it.channel == channel }
        }
        if (state.searchQuery.isNotBlank()) {
            val q = state.searchQuery.lowercase()
            filtered = filtered.filter {
                it.name.lowercase().contains(q) || it.channel.lowercase().contains(q)
            }
        }
        _uiState.value = _uiState.value.copy(filteredSeries = filtered)
    }

    fun selectSeries(id: String, name: String) {
        _uiState.value = _uiState.value.copy(
            selectedSeriesId = id,
            selectedSeriesName = name,
            customSeriesName = ""
        )
    }

    fun setCustomSeriesName(name: String) {
        _uiState.value = _uiState.value.copy(
            customSeriesName = name,
            selectedSeriesId = null,
            selectedSeriesName = null
        )
    }

    fun clearSelection() {
        _uiState.value = _uiState.value.copy(
            selectedSeriesId = null,
            selectedSeriesName = null,
            customSeriesName = ""
        )
    }

    // ── Save/Unsave Series ──────────────────────────────────────

    fun showSaveDialog(series: TVSeriesDto) {
        _uiState.value = _uiState.value.copy(showSaveDialog = true, saveDialogSeries = series)
    }

    fun dismissSaveDialog() {
        _uiState.value = _uiState.value.copy(showSaveDialog = false, saveDialogSeries = null)
    }

    fun toggleSavedSeries(series: TVSeriesDto) {
        val saved = _uiState.value.savedSeries
        val exists = saved.any { it.id == series.id }
        _uiState.value = _uiState.value.copy(
            savedSeries = if (exists) saved.filter { it.id != series.id } else saved + series
        )
        if (exists) {
            SnackbarManager.show("Removed: ${series.name}", ToastType.INFO)
        } else {
            SnackbarManager.show("Saved: ${series.name}", ToastType.SUCCESS)
        }
    }

    fun isSeriesSaved(seriesId: String): Boolean {
        return _uiState.value.savedSeries.any { it.id == seriesId }
    }

    // ── Name dialog for save playlist / merge ───────────────────

    fun showSavePlaylistDialog() {
        _uiState.value = _uiState.value.copy(
            showNameDialog = true,
            nameDialogType = NameDialogType.SavePlaylist
        )
    }

    fun showMergeDialog() {
        _uiState.value = _uiState.value.copy(
            showNameDialog = true,
            nameDialogType = NameDialogType.Merge
        )
    }

    fun dismissNameDialog() {
        _uiState.value = _uiState.value.copy(showNameDialog = false)
    }

    // ── Generate Episodes ──────────────────────────────────────

    fun generatePlaylist(filters: FilterCriteriaDto?) {
        val state = _uiState.value
        val seriesId = state.selectedSeriesId ?: ""
        val customName = if (seriesId.isNotEmpty()) null
            else state.customSeriesName.takeIf { it.isNotBlank() }

        if (seriesId.isEmpty() && customName == null) {
            _uiState.value = state.copy(error = "Select a TV series or enter a custom name")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isGenerating = true, error = null)

            val result = tvSeriesRepository.generateTVSeriesPlaylist(
                seriesId = seriesId,
                resultsPerSeries = 30,
                filters = filters,
                customName = customName
            )

            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        generatedVideos = response.videos
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        error = e.message ?: "Generation failed"
                    )
                }
            )
        }
    }

    // ── Create Playlist from Generated Videos ──────────────────

    fun saveAsPlaylist(name: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, showNameDialog = false)
            val videos = _uiState.value.generatedVideos.takeIf { it.isNotEmpty() } ?: run {
                _uiState.value = _uiState.value.copy(isSaving = false)
                return@launch
            }
            val result = playlistRepository.savePlaylist(
                name = name,
                query = _uiState.value.selectedSeriesName ?: _uiState.value.customSeriesName,
                filters = null,
                videos = videos
            )
            result.fold(
                onSuccess = {
                    SnackbarManager.show("Playlist saved: $name", ToastType.SUCCESS)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        error = e.message ?: "Failed to save playlist"
                    )
                }
            )
            _uiState.value = _uiState.value.copy(isSaving = false)
        }
    }

    // ── Create Merged Video from Generated Videos ───────────────

    fun mergeVideos(name: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isMerging = true, showNameDialog = false)
            val videos = _uiState.value.generatedVideos.takeIf { it.isNotEmpty() } ?: run {
                _uiState.value = _uiState.value.copy(isMerging = false)
                return@launch
            }
            val mergeRequests = videos.map { video ->
                MergeVideoRequest(
                    id = video.id,
                    title = video.title,
                    url = "https://www.youtube.com/watch?v=${video.id}"
                )
            }
            val result = mergeRepository.mergeVideos(mergeRequests)
            result.fold(
                onSuccess = { response ->
                    SnackbarManager.show("Merge started: ${response.filename}", ToastType.SUCCESS)
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isMerging = false,
                        error = e.message ?: "Merge failed"
                    )
                }
            )
            _uiState.value = _uiState.value.copy(isMerging = false)
        }
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}
