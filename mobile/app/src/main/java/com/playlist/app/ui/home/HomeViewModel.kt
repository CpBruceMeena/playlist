package com.playlist.app.ui.home

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

data class HomeUiState(
    val searchQuery: String = "",
    val isGenerating: Boolean = false,
    val generatedVideos: List<YouTubeVideoDto> = emptyList(),
    val hasGenerated: Boolean = false,
    val error: String? = null,
    val featuredSingers: List<String> = emptyList(),
    // Filter state
    val filterExpanded: Boolean = false,
    val videoTypes: List<String> = listOf("music", "standard"),
    val durationMin: Int? = null,
    val durationMax: Int? = null,
    val selectedDurationPresets: List<String> = emptyList(),
    val uploadDateType: String = "any",
    val minViews: Long? = null,
    val maxResults: Int = 25,
    val safeSearch: Boolean = true,
    val includeKeywords: List<String> = emptyList(),
    val excludeKeywords: List<String> = emptyList(),
    // Video selection
    val selectedVideoIds: Set<String> = emptySet(),
    val navigateToPlayer: Boolean = false,
    val showNameDialog: Boolean = false,
    val showDownloadDialog: Boolean = false,
    val videoIdsToDownload: List<String> = emptyList(),
    // Download progress
    val showDownloadProgress: Boolean = false,
    val downloadProgressMessage: String = "",
    val downloadProgressTotal: Int = 0,
    val downloadProgressCompleted: Int = 0,
    // TV Series bottom sheet
    val showTVSheet: Boolean = false,
    val tvSeries: List<TVSeriesDto> = emptyList(),
    val tvChannels: List<String> = emptyList(),
    val tvSearchQuery: String = "",
    val tvChannelFilter: String? = null,
    val tvFilteredSeries: List<TVSeriesDto> = emptyList(),
    val tvIsLoading: Boolean = false,
    val tvSelectedSeriesId: String? = null,
    val tvSelectedSeriesName: String? = null,
    val tvSavedSeriesIds: Set<String> = emptySet(),
    // Singer bottom sheet
    val showSingerSheet: Boolean = false,
    val singers: List<SingerDto> = emptyList(),
    val singerGenres: List<String> = emptyList(),
    val singerSearchQuery: String = "",
    val singerSelectedGenre: String? = null,
    val singerFilteredSingers: List<SingerDto> = emptyList(),
    val singerIsLoading: Boolean = false,
    val selectedSingerIds: Set<String> = emptySet(),
    // Tracks what generated the current results for context-aware messaging
    val sourceMode: SourceMode = SourceMode.Search
)

enum class SourceMode { Search, Singers, TVSeries }

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val generateRepository: GenerateRepository,
    private val singerRepository: SingerRepository,
    private val playlistRepository: PlaylistRepository,
    private val downloadManager: DownloadManager,
    private val tvSeriesRepository: TVSeriesRepository,
    private val songRepository: SongRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        _uiState.value = _uiState.value.copy(featuredSingers = listOf("Arijit Singh", "Diljit Dosanjh", "Shreya Ghoshal", "AP Dhillon"))
    }

    // ── TV Series Bottom Sheet ─────────────────────────────────

    fun showTVSheet() {
        _uiState.value = _uiState.value.copy(showTVSheet = true)
        loadTVSeries()
    }

    fun hideTVSheet() {
        _uiState.value = _uiState.value.copy(showTVSheet = false)
    }

    private fun loadTVSeries() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(tvIsLoading = true)
            val result = tvSeriesRepository.listTVSeries()
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        tvSeries = response.series,
                        tvChannels = response.channels,
                        tvFilteredSeries = response.series,
                        tvIsLoading = false
                    )
                    loadTVSavedSeries()
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        tvIsLoading = false,
                        error = e.message ?: "Could not load TV series"
                    )
                }
            )
        }
    }

    private fun loadTVSavedSeries() {
        viewModelScope.launch {
            val result = tvSeriesRepository.listSavedTVSeries()
            result.fold(
                onSuccess = { savedList ->
                    _uiState.value = _uiState.value.copy(
                        tvSavedSeriesIds = savedList.map { it.seriesId }.toSet()
                    )
                },
                onFailure = { }
            )
        }
    }

    fun onTVSearchQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(tvSearchQuery = query)
        applyTVFilters()
    }

    fun onTVChannelFilterSelect(channel: String?) {
        _uiState.value = _uiState.value.copy(tvChannelFilter = channel)
        applyTVFilters()
    }

    private fun applyTVFilters() {
        val state = _uiState.value
        var filtered = state.tvSeries
        state.tvChannelFilter?.let { channel ->
            filtered = filtered.filter { it.channel == channel }
        }
        if (state.tvSearchQuery.isNotBlank()) {
            val q = state.tvSearchQuery.lowercase()
            filtered = filtered.filter {
                it.name.lowercase().contains(q) || it.channel.lowercase().contains(q)
            }
        }
        _uiState.value = _uiState.value.copy(tvFilteredSeries = filtered)
    }

    fun onTVSeriesSelect(id: String, name: String) {
        _uiState.value = _uiState.value.copy(
            tvSelectedSeriesId = id,
            tvSelectedSeriesName = name
        )
    }

    fun generateFromTVSeries() {
        val seriesId = _uiState.value.tvSelectedSeriesId ?: return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isGenerating = true, error = null, hasGenerated = false, showTVSheet = false, sourceMode = SourceMode.TVSeries)
            val result = tvSeriesRepository.generateTVSeriesPlaylist(
                seriesId = seriesId,
                resultsPerSeries = 30,
                filters = null
            )
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        generatedVideos = response.videos,
                        hasGenerated = true,
                        searchQuery = response.seriesName.ifEmpty { _uiState.value.tvSelectedSeriesName ?: "TV Series" }
                    )
                    if (response.videos.isEmpty()) {
                        SnackbarManager.show("No episodes found", ToastType.INFO)
                    }
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        error = e.message ?: "Failed to generate episodes"
                    )
                }
            )
        }
    }

    fun toggleTVSaveSeries(id: String, name: String, channel: String) {
        viewModelScope.launch {
            val savedIds = _uiState.value.tvSavedSeriesIds
            val exists = savedIds.contains(id)
            _uiState.value = _uiState.value.copy(
                tvSavedSeriesIds = if (exists) savedIds - id else savedIds + id
            )
            val series = TVSeriesDto(id = id, name = name, channel = channel, genre = "")
            val result = tvSeriesRepository.toggleSaveTVSeries(series)
            result.fold(
                onSuccess = {
                    SnackbarManager.show(
                        if (exists) "Removed: $name" else "Saved: $name",
                        if (exists) ToastType.INFO else ToastType.SUCCESS
                    )
                },
                onFailure = {
                    _uiState.value = _uiState.value.copy(
                        tvSavedSeriesIds = if (!exists) savedIds - id else savedIds + id
                    )
                }
            )
        }
    }

    // ── Singer Bottom Sheet ────────────────────────────────────

    fun showSingerSheet() {
        _uiState.value = _uiState.value.copy(showSingerSheet = true)
        loadSingers()
    }

    fun hideSingerSheet() {
        _uiState.value = _uiState.value.copy(showSingerSheet = false)
    }

    private fun loadSingers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(singerIsLoading = true)
            val result = singerRepository.listSingers()
            result.fold(
                onSuccess = { response ->
                    val genres = response.singers.map { it.genre }.distinct().sorted()
                    _uiState.value = _uiState.value.copy(
                        singers = response.singers,
                        singerGenres = genres,
                        singerFilteredSingers = response.singers,
                        singerIsLoading = false
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        singerIsLoading = false,
                        error = e.message ?: "Could not load singers"
                    )
                }
            )
        }
    }

    fun onSingerSearchQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(singerSearchQuery = query)
        applySingerFilters()
    }

    fun onSingerGenreSelect(genre: String?) {
        _uiState.value = _uiState.value.copy(singerSelectedGenre = genre)
        applySingerFilters()
    }

    private fun applySingerFilters() {
        val state = _uiState.value
        var filtered = state.singers
        state.singerSelectedGenre?.let { genre ->
            filtered = filtered.filter { it.genre == genre }
        }
        if (state.singerSearchQuery.isNotBlank()) {
            val q = state.singerSearchQuery.lowercase()
            filtered = filtered.filter {
                it.name.lowercase().contains(q) || it.genre.lowercase().contains(q)
            }
        }
        _uiState.value = _uiState.value.copy(singerFilteredSingers = filtered)
    }

    fun toggleSingerSelection(id: String) {
        val current = _uiState.value.selectedSingerIds.toMutableSet()
        if (current.contains(id)) current.remove(id) else current.add(id)
        _uiState.value = _uiState.value.copy(selectedSingerIds = current)
    }

    fun generateFromSingers() {
        val ids = _uiState.value.selectedSingerIds.toList()
        if (ids.isEmpty()) return
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isGenerating = true, error = null, hasGenerated = false, showSingerSheet = false, sourceMode = SourceMode.Singers)
            val filters = getFilterPayload()
            val result = singerRepository.generateMultiSinger(
                singerIds = ids,
                resultsPerSinger = 10,
                filters = filters
            )
            result.fold(
                onSuccess = { response ->
                    val singerNames = response.singerNames?.values?.joinToString(", ") ?: ""
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        generatedVideos = response.videos,
                        hasGenerated = true,
                        searchQuery = singerNames.ifEmpty { "Singers" }
                    )
                    if (response.videos.isEmpty()) {
                        SnackbarManager.show("No videos found. Try different filters.", ToastType.INFO)
                    }
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

    private fun getFilterPayload(): FilterCriteriaDto? {
        val s = _uiState.value
        val hasFilters = s.selectedDurationPresets.isNotEmpty() || s.durationMin != null || s.durationMax != null ||
            s.videoTypes.size < 4 || s.includeKeywords.isNotEmpty() || s.excludeKeywords.isNotEmpty() ||
            s.uploadDateType != "any" || s.minViews != null || s.maxResults != 25 || !s.safeSearch
        if (!hasFilters) return null
        return FilterCriteriaDto(
            videoTypes = s.videoTypes,
            durationMin = s.durationMin,
            durationMax = s.durationMax,
            uploadDate = if (s.uploadDateType != "any") UploadDateDto(type = s.uploadDateType) else null,
            minViews = s.minViews,
            maxResults = s.maxResults,
            safeSearch = s.safeSearch,
            includeKeywords = s.includeKeywords.ifEmpty { null },
            excludeKeywords = s.excludeKeywords.ifEmpty { null }
        )
    }

    fun onSearchQueryChange(query: String) { _uiState.value = _uiState.value.copy(searchQuery = query) }

    fun toggleFilterExpanded() { _uiState.value = _uiState.value.copy(filterExpanded = !_uiState.value.filterExpanded) }

    fun toggleVideoType(type: String) {
        val current = _uiState.value.videoTypes.toMutableList()
        if (current.contains(type)) { if (current.size > 1) current.remove(type) }
        else current.add(type)
        _uiState.value = _uiState.value.copy(videoTypes = current)
    }

    fun setDurationRange(min: Int?, max: Int?) { _uiState.value = _uiState.value.copy(durationMin = min, durationMax = max, selectedDurationPresets = emptyList()) }

    fun toggleDurationPreset(label: String) {
        val current = _uiState.value.selectedDurationPresets.toMutableList()
        if (current.contains(label)) current.remove(label) else current.add(label)
        val mins = current.mapNotNull { when (it) { "< 1 min" -> null; "1-4 min" -> 60; "4-10 min" -> 240; "10-20 min" -> 600; "> 20 min" -> 1200; else -> null } }.minOrNull()
        val maxes = current.mapNotNull { when (it) { "< 1 min" -> 60; "1-4 min" -> 240; "4-10 min" -> 600; "10-20 min" -> 1200; "> 20 min" -> null; else -> null } }.maxOrNull()
        _uiState.value = _uiState.value.copy(selectedDurationPresets = current, durationMin = mins, durationMax = maxes)
    }

    fun setUploadDate(type: String) { _uiState.value = _uiState.value.copy(uploadDateType = type) }
    fun setMinViews(views: Long?) { _uiState.value = _uiState.value.copy(minViews = views) }
    fun setMaxResults(count: Int) { _uiState.value = _uiState.value.copy(maxResults = count) }
    fun setSafeSearch(on: Boolean) { _uiState.value = _uiState.value.copy(safeSearch = on) }

    fun addIncludeKeyword(keyword: String) {
        val trimmed = keyword.trim().lowercase()
        if (trimmed.isNotEmpty() && !_uiState.value.includeKeywords.contains(trimmed))
            _uiState.value = _uiState.value.copy(includeKeywords = _uiState.value.includeKeywords + trimmed)
    }
    fun removeIncludeKeyword(keyword: String) { _uiState.value = _uiState.value.copy(includeKeywords = _uiState.value.includeKeywords.filter { it != keyword }) }
    fun addExcludeKeyword(keyword: String) {
        val trimmed = keyword.trim().lowercase()
        if (trimmed.isNotEmpty() && !_uiState.value.excludeKeywords.contains(trimmed))
            _uiState.value = _uiState.value.copy(excludeKeywords = _uiState.value.excludeKeywords + trimmed)
    }
    fun removeExcludeKeyword(keyword: String) { _uiState.value = _uiState.value.copy(excludeKeywords = _uiState.value.excludeKeywords.filter { it != keyword }) }

    fun resetFilters() {
        _uiState.value = _uiState.value.copy(
            videoTypes = listOf("music", "standard"), durationMin = null, durationMax = null,
            selectedDurationPresets = emptyList(), uploadDateType = "any", minViews = null,
            maxResults = 25, safeSearch = true, includeKeywords = emptyList(), excludeKeywords = emptyList()
        )
    }

    fun getActiveFilterCount(): Int {
        val s = _uiState.value; var count = 0
        if (s.selectedDurationPresets.isNotEmpty()) count++; else if (s.durationMin != null || s.durationMax != null) count++
        if (s.videoTypes.size < 4) count++; if (s.includeKeywords.isNotEmpty()) count++; if (s.excludeKeywords.isNotEmpty()) count++
        if (s.uploadDateType != "any") count++; if (s.minViews != null) count++; if (s.maxResults != 25) count++; if (!s.safeSearch) count++
        return count
    }

    fun generatePlaylist() {
        val query = _uiState.value.searchQuery.trim()
        if (query.isEmpty()) { _uiState.value = _uiState.value.copy(error = "Please enter a search query"); return }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isGenerating = true, error = null, hasGenerated = false, selectedVideoIds = emptySet(), sourceMode = SourceMode.Search)
            val s = _uiState.value
            val filters = FilterCriteriaDto(
                videoTypes = s.videoTypes, durationMin = s.durationMin, durationMax = s.durationMax,
                uploadDate = if (s.uploadDateType != "any") UploadDateDto(type = s.uploadDateType) else null,
                minViews = s.minViews, maxResults = s.maxResults, safeSearch = s.safeSearch,
                includeKeywords = s.includeKeywords.ifEmpty { null }, excludeKeywords = s.excludeKeywords.ifEmpty { null }
            )
            val result = generateRepository.generatePlaylist(query = query, filters = filters)
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        generatedVideos = response.videos,
                        hasGenerated = true
                    )
                    if (response.videos.isEmpty()) {
                        SnackbarManager.show("No videos found. Try different filters.", ToastType.INFO)
                    }
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        error = error.message ?: "Generation failed"
                    )
                }
            )
        }
    }

    // ── Video Selection ───────────────────────────────────────

    fun toggleVideoSelection(videoId: String) {
        val current = _uiState.value.selectedVideoIds.toMutableSet()
        if (current.contains(videoId)) current.remove(videoId) else current.add(videoId)
        _uiState.value = _uiState.value.copy(selectedVideoIds = current)
    }

    fun clearVideoSelection() {
        _uiState.value = _uiState.value.copy(selectedVideoIds = emptySet())
    }

    fun clearGenerated() {
        _uiState.value = _uiState.value.copy(
            hasGenerated = false,
            generatedVideos = emptyList(),
            selectedVideoIds = emptySet(),
            sourceMode = SourceMode.Search
        )
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

    // ── Dialogs ────────────────────────────────────────────────

    fun showSavePlaylistDialog() {
        _uiState.value = _uiState.value.copy(showNameDialog = true)
    }

    fun dismissNameDialog() {
        _uiState.value = _uiState.value.copy(showNameDialog = false)
    }

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
            // Clear selection after saving
            clearVideoSelection()
            val label = when (_uiState.value.sourceMode) {
                SourceMode.TVSeries -> "episodes"
                else -> "songs"
            }
            SnackbarManager.show(
                if (saved == selected.size) "Saved $saved $label"
                else "$saved of ${selected.size} $label saved",
                if (saved > 0) ToastType.SUCCESS else ToastType.ERROR
            )
        }
    }

    fun saveAsPlaylist(name: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(showNameDialog = false)
            val videos = _uiState.value.generatedVideos
            val result = playlistRepository.savePlaylist(
                name = name,
                query = _uiState.value.searchQuery,
                filters = null,
                videos = videos
            )
            result.fold(
                onSuccess = { SnackbarManager.show("Playlist saved: $name", ToastType.SUCCESS) },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        error = if (e.message?.contains("already exists") == true)
                            "A playlist with this name already exists"
                        else e.message ?: "Failed to save playlist"
                    )
                }
            )
        }
    }

    fun clearError() { _uiState.value = _uiState.value.copy(error = null) }
}
