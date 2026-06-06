package com.playlist.app.ui.components

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class ToastMessage(
    val id: Long = System.nanoTime(),
    val message: String,
    val type: ToastType = ToastType.INFO
)

enum class ToastType {
    SUCCESS, ERROR, INFO
}

/**
 * Simple singleton for showing toast notifications across the app.
 * Used by ViewModels to show success/error messages.
 */
object SnackbarManager {
    private val _toast = MutableStateFlow<ToastMessage?>(null)
    val toast: StateFlow<ToastMessage?> = _toast.asStateFlow()

    fun show(message: String, type: ToastType = ToastType.INFO) {
        _toast.value = ToastMessage(message = message, type = type)
    }

    fun clear() {
        _toast.value = null
    }
}
