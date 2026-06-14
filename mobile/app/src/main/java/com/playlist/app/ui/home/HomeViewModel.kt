package com.playlist.app.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.FilterCriteriaDto
import com.playlist.app.data.api.models.SingerDto
import com.playlist.app.data.api.models.UploadDateDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.data.repository.DownloadRepository
import com.playlist.app.data.repository.GenerateRepository
import com.playlist.app.data.repository.PlaylistRepository
import com.playlist.app.data.repository.SingerRepository
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
    val videoIdsToDownload: List<String> = emptyList()
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val generateRepository: GenerateRepository,
    private val singerRepository: SingerRepository,
    private val playlistRepository: PlaylistRepository,
    private val downloadRepository: DownloadRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

    init {
        _uiState.value = _uiState.value.copy(featuredSingers = listOf("Arijit Singh", "Diljit Dosanjh", "Shreya Ghoshal", "AP Dhillon"))
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
            _uiState.value = _uiState.value.copy(isGenerating = true, error = null, hasGenerated = false, selectedVideoIds = emptySet())
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
            selectedVideoIds = emptySet()
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
        viewModelScope.launch {
            val ids = _uiState.value.videoIdsToDownload
            dismissDownloadDialog()
            var successCount = 0
            ids.forEach { videoId ->
                val url = "https://www.youtube.com/watch?v=$videoId"
                val result = downloadRepository.startDownload(url)
                if (result.isSuccess) successCount++
            }
            if (successCount > 0) {
                SnackbarManager.show("Downloading $successCount video(s)", ToastType.SUCCESS)
            } else {
                SnackbarManager.show("Download failed", ToastType.ERROR)
            }
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
