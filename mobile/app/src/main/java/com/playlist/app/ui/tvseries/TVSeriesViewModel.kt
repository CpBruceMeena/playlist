package com.playlist.app.ui.tvseries

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.*
import com.playlist.app.data.repository.*
import com.playlist.app.ui.components.SnackbarManager
import com.playlist.app.ui.components.ToastType
import com.playlist.app.ui.player.PlayerState
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
    val hasGenerated: Boolean = false,
    val error: String? = null,
    val isLoading: Boolean = false,
    val isLoadingSaved: Boolean = false,

    // Saved/bookmarked series (persisted via API)
    val savedSeries: List<TVSeriesDto> = emptyList(),
    val savedSeriesIds: Set<String> = emptySet(),

    // Video selection state
    val selectedVideoIds: Set<String> = emptySet(),
    val navigateToPlayer: Boolean = false,

    // Dialogs
    val showNameDialog: Boolean = false,
    val nameDialogType: NameDialogType = NameDialogType.SavePlaylist,
    val showDownloadDialog: Boolean = false,
    val videoIdsToDownload: List<String> = emptyList(),
    val showDownloadProgress: Boolean = false,
    val downloadProgressMessage: String = "",
    val downloadProgressTotal: Int = 0,
    val downloadProgressCompleted: Int = 0,
    val isSaving: Boolean = false,
    val isMerging: Boolean = false
)

enum class NameDialogType {
    SavePlaylist, Merge
}

/**
 * Cache for TV series episodes generated externally (e.g. from Home page's TV Series bottom sheet).
 * When Home page generates episodes from a TV series and the user taps Save,
 * the episodes are stored here and TVSeriesScreen picks them up on next composition.
 */
object ExternalTVSeriesCache {
    var episodes: List<YouTubeVideoDto> = emptyList()
    var seriesName: String = ""
}

/**
 * Tracks TV series episode save counts so Profile screen can display them.
 */
object TVSeriesEpisodeTracker {
    var savedEpisodeCount: Int = 0
        private set

    fun recordSaved(count: Int) {
        savedEpisodeCount += count
    }
}

@HiltViewModel
class TVSeriesViewModel @Inject constructor(
    private val tvSeriesRepository: TVSeriesRepository,
    private val songRepository: SongRepository,
    private val playlistRepository: PlaylistRepository,
    private val mergeRepository: MergeRepository,
    private val downloadManager: DownloadManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(TVSeriesUiState())
    val uiState: StateFlow<TVSeriesUiState> = _uiState.asStateFlow()

    init {
        loadSeries()
        // Check for externally cached episodes (from Home page TV Series bottom sheet)
        if (ExternalTVSeriesCache.episodes.isNotEmpty()) {
            val cachedEpisodes = ExternalTVSeriesCache.episodes
            val cachedName = ExternalTVSeriesCache.seriesName
            ExternalTVSeriesCache.episodes = emptyList()
            ExternalTVSeriesCache.seriesName = ""
            _uiState.value = _uiState.value.copy(
                generatedVideos = cachedEpisodes,
                hasGenerated = true,
                selectedSeriesName = cachedName.ifEmpty { "TV Series" },
                isGenerating = false
            )
        }
    }

    fun loadSeries() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = tvSeriesRepository.listTVSeries()
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        series = response.series,
                        channels = response.channels,
                        filteredSeries = response.series,
                        isLoading = false
                    )
                    // Chain saved series loading after series are available
                    loadSavedSeries()
                },
                onFailure = { e ->
                    val msg = when {
                        e.message?.contains("timeout", true) == true -> "Connection timed out. Check your internet and server."
                        e.message?.contains("Unable to resolve host", true) == true -> "Server unreachable. Is the backend running?"
                        else -> e.message ?: "Could not load TV series"
                    }
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = msg
                    )
                }
            )
        }
    }

    fun loadSavedSeries() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingSaved = true)
            val result = tvSeriesRepository.listSavedTVSeries()
            result.fold(
                onSuccess = { savedList ->
                    val savedSeries = _uiState.value.series.filter { s ->
                        savedList.any { it.seriesId == s.id }
                    }
                    val savedIds = savedList.map { it.seriesId }.toSet()
                    _uiState.value = _uiState.value.copy(
                        savedSeries = savedSeries,
                        savedSeriesIds = savedIds,
                        isLoadingSaved = false
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(isLoadingSaved = false)
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

    fun toggleSavedSeries(series: TVSeriesDto) {
        val saved = _uiState.value.savedSeries
        val exists = saved.any { it.id == series.id }

        viewModelScope.launch {
            // Optimistic update
            _uiState.value = _uiState.value.copy(
                savedSeries = if (exists) saved.filter { it.id != series.id } else saved + series,
                savedSeriesIds = if (exists) _uiState.value.savedSeriesIds - series.id
                    else _uiState.value.savedSeriesIds + series.id
            )

            val result = tvSeriesRepository.toggleSaveTVSeries(series)
            result.fold(
                onSuccess = {
                    SnackbarManager.show(
                        if (exists) "Removed: ${series.name}" else "Saved: ${series.name}",
                        if (exists) ToastType.INFO else ToastType.SUCCESS
                    )
                },
                onFailure = { e ->
                    // Revert on failure
                    _uiState.value = _uiState.value.copy(
                        savedSeries = if (!exists) saved.filter { it.id != series.id } else saved + series,
                        savedSeriesIds = if (!exists) _uiState.value.savedSeriesIds - series.id
                            else _uiState.value.savedSeriesIds + series.id
                    )
                    SnackbarManager.show("Failed to save: ${e.message ?: "server error"}", ToastType.ERROR)
                }
            )
        }
    }

    fun isSeriesSaved(seriesId: String): Boolean {
        return _uiState.value.savedSeriesIds.contains(seriesId)
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
            _uiState.value = state.copy(error = "Please select a TV series or type a custom name")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isGenerating = true, error = null, hasGenerated = false)

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
                        generatedVideos = response.videos,
                        hasGenerated = true
                    )
                    if (response.videos.isEmpty()) {
                        SnackbarManager.show("No episodes found for this series", ToastType.INFO)
                    } else {
                        SnackbarManager.show("Found ${response.videos.size} episodes", ToastType.SUCCESS)
                    }
                },
                onFailure = { e ->
                    val msg = when {
                        e.message?.contains("No videos found", true) == true ->
                            "No episodes found. Try a different series or adjust filters."
                        e.message?.contains("quota", true) == true ->
                            "YouTube API quota exceeded. Please try again later."
                        else -> e.message ?: "Failed to generate episodes"
                    }
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        error = msg
                    )
                }
            )
        }
    }

    fun saveSelectedToMySongs() {
        val videos = _uiState.value.generatedVideos
        val selected = if (_uiState.value.selectedVideoIds.isNotEmpty())
            videos.filter { it.id in _uiState.value.selectedVideoIds }
        else
            videos.take(5)
        if (selected.isEmpty()) return
        viewModelScope.launch {
            var saved = 0
            selected.forEach { video ->
                val request = SavedSongVideoDto(
                    id = video.id,
                    title = video.title,
                    channelTitle = video.channelTitle ?: "",
                    thumbnailUrl = video.thumbnailUrl,
                    durationSeconds = video.durationSeconds
                )
                val result = songRepository.saveSong(video = request, singerName = video.singerName)
                if (result.isSuccess) saved++
            }
            clearVideoSelection()
            TVSeriesEpisodeTracker.recordSaved(saved)
            SnackbarManager.show(
                if (saved == selected.size) "Saved $saved episodes"
                else "$saved of ${selected.size} episodes saved",
                if (saved > 0) ToastType.SUCCESS else ToastType.ERROR
            )
        }
    }

    // ── Create Playlist from Generated Videos ──────────────────

    fun saveAsPlaylist(name: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSaving = true, showNameDialog = false)
            val videos = _uiState.value.generatedVideos.takeIf { it.isNotEmpty() } ?: run {
                _uiState.value = _uiState.value.copy(isSaving = false)
                SnackbarManager.show("No videos to save", ToastType.ERROR)
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
                    val msg = when {
                        e.message?.contains("already exists", true) == true ->
                            "A playlist with this name already exists"
                        else -> e.message ?: "Failed to save playlist"
                    }
                    _uiState.value = _uiState.value.copy(
                        isSaving = false,
                        error = msg
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
                SnackbarManager.show("No videos to merge", ToastType.ERROR)
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
                    val msg = when {
                        e.message?.contains("timeout", true) == true ->
                            "Merge timed out. The video files may be too large."
                        else -> e.message ?: "Merge failed"
                    }
                    _uiState.value = _uiState.value.copy(
                        isMerging = false,
                        error = msg
                    )
                }
            )
            _uiState.value = _uiState.value.copy(isMerging = false)
        }
    }

    // ── Video Selection ──────────────────────────────────────────

    fun toggleVideoSelection(videoId: String) {
        val current = _uiState.value.selectedVideoIds.toMutableSet()
        if (current.contains(videoId)) {
            current.remove(videoId)
        } else {
            current.add(videoId)
        }
        _uiState.value = _uiState.value.copy(selectedVideoIds = current)
    }

    fun clearVideoSelection() {
        _uiState.value = _uiState.value.copy(selectedVideoIds = emptySet())
    }

    fun playSelected() {
        val selected = _uiState.value.generatedVideos.filter { it.id in _uiState.value.selectedVideoIds }
        val videos = if (selected.isNotEmpty()) selected else _uiState.value.generatedVideos
        PlayerState.setQueue(videos)
        _uiState.value = _uiState.value.copy(navigateToPlayer = true)
    }

    fun onNavigatedToPlayer() {
        _uiState.value = _uiState.value.copy(navigateToPlayer = false)
        clearVideoSelection()
    }

    // ── Download ─────────────────────────────────────────────────

    fun showDownloadDialog() {
        val ids = if (_uiState.value.selectedVideoIds.isNotEmpty())
            _uiState.value.selectedVideoIds.toList()
        else
            _uiState.value.generatedVideos.map { it.id }
        _uiState.value = _uiState.value.copy(
            showDownloadDialog = true,
            videoIdsToDownload = ids
        )
    }

    fun dismissDownloadDialog() {
        _uiState.value = _uiState.value.copy(showDownloadDialog = false, videoIdsToDownload = emptyList())
    }

    fun confirmDownload() {
        val ids = _uiState.value.videoIdsToDownload
        dismissDownloadDialog()
        _uiState.value = _uiState.value.copy(
            showDownloadProgress = true,
            downloadProgressMessage = "Starting download...",
            downloadProgressTotal = ids.size,
            downloadProgressCompleted = 0
        )
        viewModelScope.launch {
            ids.forEachIndexed { index, videoId ->
                _uiState.value = _uiState.value.copy(
                    downloadProgressMessage = "Starting ${index + 1} of ${ids.size}...",
                    downloadProgressCompleted = index
                )
                val url = "https://www.youtube.com/watch?v=$videoId"
                downloadManager.startDownload(url, "Video $videoId")
            }
            _uiState.value = _uiState.value.copy(
                downloadProgressMessage = "All ${ids.size} downloads started — check Downloads tab for progress",
                downloadProgressCompleted = ids.size
            )
            kotlinx.coroutines.delay(2000)
            _uiState.value = _uiState.value.copy(
                showDownloadProgress = false,
                downloadProgressMessage = ""
            )
        }
    }

    fun clearGenerated() {
        _uiState.value = _uiState.value.copy(
            hasGenerated = false,
            generatedVideos = emptyList(),
            selectedVideoIds = emptySet()
        )
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}
