package com.playlist.app.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.playlist.app.ui.theme.NeonColors
import kotlinx.coroutines.delay

@Composable
fun ToastContainer(modifier: Modifier = Modifier) {
    val toast by SnackbarManager.toast.collectAsState()

    LaunchedEffect(toast) {
        if (toast != null) {
            delay(3000)
            SnackbarManager.clear()
        }
    }

    if (toast != null && toast?.message?.isNotEmpty() == true) {
        val bgColor = when (toast?.type) {
            ToastType.SUCCESS -> Color(0xFF1B5E20)
            ToastType.ERROR -> Color(0xFFB71C1C)
            ToastType.INFO -> NeonColors.ElectricVioletContainer.copy(alpha = 0.8f)
            else -> NeonColors.ElectricVioletContainer.copy(alpha = 0.8f)
        }

        Box(
            modifier = modifier
                .fillMaxWidth()
                .padding(16.dp),
            contentAlignment = Alignment.TopCenter
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(bgColor)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Text(
                    text = toast!!.message,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    color = NeonColors.OnSurface
                )
            }
        }
    }
}
