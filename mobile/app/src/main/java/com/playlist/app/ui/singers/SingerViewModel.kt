package com.playlist.app.ui.singers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.FilterCriteriaDto
import com.playlist.app.data.api.models.SingerDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.data.repository.SingerRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SingerUiState(
    val singers: List<SingerDto> = emptyList(),
    val genres: List<String> = emptyList(),
    val filteredSingers: List<SingerDto> = emptyList(),
    val selectedSingerIds: List<String> = emptyList(),
    val customSingerNames: List<String> = emptyList(),
    val selectedGenre: String? = null,
    val searchQuery: String = "",
    val isGenerating: Boolean = false,
    val generatedVideos: List<YouTubeVideoDto> = emptyList(),
    val error: String? = null,
    val isLoading: Boolean = false
)

@HiltViewModel
class SingerViewModel @Inject constructor(
    private val singerRepository: SingerRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SingerUiState())
    val uiState: StateFlow<SingerUiState> = _uiState.asStateFlow()

    init {
        loadSingers()
    }

    private fun loadSingers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            val result = singerRepository.listSingers()
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        singers = response.singers,
                        genres = response.genres,
                        filteredSingers = response.singers,
                        isLoading = false
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "Failed to load singers"
                    )
                }
            )
        }
    }

    fun onGenreSelect(genre: String?) {
        _uiState.value = _uiState.value.copy(selectedGenre = genre)
        applyFilters()
    }

    fun onSearchQueryChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        applyFilters()
    }

    private fun applyFilters() {
        val state = _uiState.value
        var filtered = state.singers

        if (!state.selectedGenre.isNullOrBlank()) {
            filtered = filtered.filter { it.genre == state.selectedGenre }
        }

        if (state.searchQuery.isNotBlank()) {
            val query = state.searchQuery.lowercase()
            filtered = filtered.filter {
                it.name.lowercase().contains(query) || it.genre.lowercase().contains(query)
            }
        }

        _uiState.value = _uiState.value.copy(filteredSingers = filtered)
    }

    fun toggleSinger(singerId: String) {
        val state = _uiState.value
        val updated = if (state.selectedSingerIds.contains(singerId)) {
            state.selectedSingerIds - singerId
        } else if (state.selectedSingerIds.size < 5) {
            state.selectedSingerIds + singerId
        } else {
            return
        }
        _uiState.value = state.copy(selectedSingerIds = updated)
    }

    fun addCustomSinger(name: String) {
        val state = _uiState.value
        val trimmed = name.trim()
        if (trimmed.isBlank()) return
        if (state.selectedSingerIds.size + state.customSingerNames.size >= 5) return
        if (state.customSingerNames.contains(trimmed)) return
        _uiState.value = state.copy(customSingerNames = state.customSingerNames + trimmed)
    }

    fun removeCustomSinger(name: String) {
        val state = _uiState.value
        _uiState.value = state.copy(customSingerNames = state.customSingerNames - name)
    }

    fun generateMultiSinger() {
        val state = _uiState.value
        val total = state.selectedSingerIds.size + state.customSingerNames.size
        if (total < 2) {
            _uiState.value = state.copy(error = "Select at least 2 singers")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isGenerating = true, error = null)

            val result = singerRepository.generateMultiSinger(
                singerIds = state.selectedSingerIds,
                resultsPerSinger = 10,
                customSingers = state.customSingerNames.ifEmpty { null }
            )

            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        isGenerating = false,
                        generatedVideos = response.videos
                    )
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
}
