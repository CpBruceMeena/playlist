package com.playlist.app.data.repository

import com.playlist.app.data.api.models.DownloadResponseDto
import com.playlist.app.ui.components.SnackbarManager
import com.playlist.app.ui.components.ToastType
import com.playlist.app.ui.downloads.DownloadItem
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Central download manager that tracks ALL downloads across the app.
 *
 * Any screen that starts a download should call [startDownload] here
 * instead of calling [DownloadRepository.startDownload] directly.
 * The DownloadsViewModel observes [activeDownloads] and merges them
 * with the server-side download list so the Downloads tab shows everything.
 */
@Singleton
class DownloadManager @Inject constructor(
    private val downloadRepository: DownloadRepository
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    /** Map of download ID → DownloadItem. Includes both pending and completed items. */
    private val _activeDownloads = MutableStateFlow<Map<String, DownloadItem>>(emptyMap())
    val activeDownloads: StateFlow<Map<String, DownloadItem>> = _activeDownloads.asStateFlow()

    /**
     * Start a download and add it to the active downloads map with a pending state.
     * When the API returns, the pending item is replaced with a completed one.
     *
     * @param url  The URL to download (YouTube, Instagram, etc.)
     * @param title  A display title to show while pending
     */
    fun startDownload(url: String, title: String) {
        if (url.isBlank()) return

        val pendingId = "pending_${System.currentTimeMillis()}"
        val pendingItem = DownloadItem(
            id = pendingId,
            title = title,
            url = url,
            isPending = true
        )
        _activeDownloads.value = _activeDownloads.value + (pendingId to pendingItem)

        scope.launch {
            val result = downloadRepository.startDownload(url)
            result.fold(
                onSuccess = { dl ->
                    val completed = DownloadItem(
                        id = dl.id,
                        title = dl.title,
                        url = url,
                        thumbnailUrl = dl.thumbnailUrl,
                        duration = dl.duration,
                        fileSize = dl.fileSize,
                        downloadUrl = dl.downloadUrl,
                        createdAt = dl.createdAt,
                        isPending = false
                    )
                    // Replace pending with completed
                    val updated = _activeDownloads.value.toMutableMap()
                    updated.remove(pendingId)
                    updated[dl.id] = completed
                    _activeDownloads.value = updated

                    SnackbarManager.show("Download complete: ${dl.title}", ToastType.SUCCESS)
                },
                onFailure = { e ->
                    val updated = _activeDownloads.value.toMutableMap()
                    updated.remove(pendingId)
                    _activeDownloads.value = updated

                    SnackbarManager.show("Download failed: ${e.message ?: "error"}", ToastType.ERROR)
                }
            )
        }
    }

    /**
     * Remove a download by its ID from the active list (e.g. user deleted it).
     */
    fun removeDownload(id: String) {
        val updated = _activeDownloads.value.toMutableMap()
        updated.remove(id)
        _activeDownloads.value = updated
    }

    /**
     * Sync server-side downloads into the active map without overwriting pending items.
     */
    fun syncWithServerDownloads(serverDownloads: List<DownloadResponseDto>) {
        val current = _activeDownloads.value.toMutableMap()
        // Remove any completed items that have since been deleted server-side
        val serverIds = serverDownloads.map { it.id }.toSet()
        val toRemove = current.keys.filter { !it.startsWith("pending_") && it !in serverIds }
        toRemove.forEach { current.remove(it) }
        // Add any new server items not already tracked
        for (dl in serverDownloads) {
            if (dl.id !in current) {
                current[dl.id] = DownloadItem(
                    id = dl.id,
                    title = dl.title,
                    url = "",
                    thumbnailUrl = dl.thumbnailUrl,
                    duration = dl.duration,
                    fileSize = dl.fileSize,
                    downloadUrl = dl.downloadUrl,
                    createdAt = dl.createdAt,
                    isPending = false
                )
            }
        }
        _activeDownloads.value = current
    }
}
