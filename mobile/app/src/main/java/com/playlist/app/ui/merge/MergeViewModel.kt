package com.playlist.app.ui.merge

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.playlist.app.data.api.models.MergeVideoRequest
import com.playlist.app.data.api.models.MergedVideoDto
import com.playlist.app.data.repository.MergeRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MergeUiState(
    val mergedVideos: List<MergedVideoDto> = emptyList(),
    val isMerging: Boolean = false,
    val isLoaded: Boolean = false,
    val error: String? = null,
    val mergeSuccess: String? = null
)

@HiltViewModel
class MergeViewModel @Inject constructor(
    private val mergeRepository: MergeRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MergeUiState())
    val uiState: StateFlow<MergeUiState> = _uiState.asStateFlow()

    init {
        loadMergedVideos()
    }

    fun loadMergedVideos() {
        viewModelScope.launch {
            val result = mergeRepository.listMergedVideos()
            result.fold(
                onSuccess = { videos ->
                    _uiState.value = _uiState.value.copy(
                        mergedVideos = videos,
                        isLoaded = true
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoaded = true,
                        error = error.message
                    )
                }
            )
        }
    }

    fun mergeVideos(videos: List<MergeVideoRequest>) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isMerging = true, error = null)

            val result = mergeRepository.mergeVideos(videos)
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        isMerging = false,
                        mergeSuccess = "Merge started: ${response.filename}"
                    )
                    loadMergedVideos()
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
}
