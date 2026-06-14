package com.playlist.app.ui.player

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import coil.compose.AsyncImage
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.ui.theme.NeonColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(
    onNavigateBack: () -> Unit = {}
) {
    val queue by PlayerState.queue.collectAsState()
    val currentIndex by PlayerState.currentIndex.collectAsState()
    val downloadingVideoId by PlayerState.downloadingVideoId.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Bottom sheet state for share/save/download
    var showActionSheet by remember { mutableStateOf(false) }
    // Save song dialog
    var showSaveDialog by remember { mutableStateOf(false) }

    if (queue.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(NeonColors.DeepObsidian),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Outlined.MusicNote,
                    contentDescription = null,
                    tint = NeonColors.OnSurfaceVariant.copy(alpha = 0.5f),
                    modifier = Modifier.size(64.dp)
                )
                Spacer(Modifier.height(16.dp))
                Text(
                    text = "No videos in queue",
                    style = MaterialTheme.typography.bodyLarge,
                    color = NeonColors.OnSurfaceVariant
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Generate a playlist or open a shared link to start",
                    style = MaterialTheme.typography.bodySmall,
                    color = NeonColors.OnSurfaceVariant.copy(alpha = 0.7f)
                )
            }
        }
        return
    }

    val currentVideo = queue.getOrNull(currentIndex) ?: queue.first()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Now Playing",
                        style = MaterialTheme.typography.titleMedium,
                        color = NeonColors.OnSurface
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            Icons.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = NeonColors.OnSurface
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = NeonColors.DeepObsidian
                )
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(16.dp))

            // Video thumbnail
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = NeonColors.SurfaceDark)
            ) {
                Box {
                    AsyncImage(
                        model = currentVideo.thumbnailUrl?.replace("hqdefault", "maxresdefault")
                            ?: currentVideo.thumbnailUrl ?: "",
                        contentDescription = currentVideo.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Fit
                    )

                    // Play overlay
                    Icon(
                        imageVector = Icons.Filled.PlayCircleFilled,
                        contentDescription = "Play",
                        tint = Color.White.copy(alpha = 0.8f),
                        modifier = Modifier
                            .align(Alignment.Center)
                            .size(56.dp)
                    )
                }
            }

            Spacer(Modifier.height(20.dp))

            // Song info
            Text(
                text = currentVideo.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = NeonColors.OnSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = currentVideo.channelTitle ?: currentVideo.singerName ?: "",
                style = MaterialTheme.typography.bodyMedium,
                color = NeonColors.ElectricViolet,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            if (currentVideo.durationSeconds != null && currentVideo.durationSeconds > 0) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = formatDuration(currentVideo.durationSeconds),
                    style = MaterialTheme.typography.bodySmall,
                    color = NeonColors.OnSurfaceVariant
                )
            }

            Spacer(Modifier.height(24.dp))

            // Queue list
            Text(
                text = "Queue (${queue.size} videos)",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.SemiBold,
                color = NeonColors.OnSurfaceVariant,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp)
            )

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                itemsIndexed(queue) { index, video ->
                    QueueItem(
                        title = video.title,
                        channelName = video.channelTitle ?: video.singerName ?: "",
                        isCurrent = index == currentIndex,
                        onClick = { PlayerState.setCurrentIndex(index) },
                        isDownloading = downloadingVideoId == video.id,
                        onDownload = {
                            scope.launch {
                                downloadVideo(context, video)
                            }
                        }
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Action buttons row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // Save song button
                OutlinedButton(
                    onClick = { showActionSheet = true },
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = NeonColors.NeonCyan
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        Icons.Outlined.BookmarkAdd,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text("Save", style = MaterialTheme.typography.labelMedium)
                }

                // Download button
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            downloadVideo(context, currentVideo)
                        }
                    },
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = NeonColors.ElectricViolet
                    ),
                    shape = RoundedCornerShape(12.dp),
                    enabled = downloadingVideoId != currentVideo.id
                ) {
                    if (downloadingVideoId == currentVideo.id) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = NeonColors.ElectricViolet
                        )
                    } else {
                        Icon(
                            Icons.Outlined.Download,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = if (downloadingVideoId == currentVideo.id) "Downloading..." else "Download",
                        style = MaterialTheme.typography.labelMedium
                    )
                }

                // Share button
                OutlinedButton(
                    onClick = {
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_TEXT, "https://www.youtube.com/watch?v=${currentVideo.id}")
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "Share video"))
                    },
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = NeonColors.NeonCyan
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        Icons.Outlined.Share,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text("Share", style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}

@Composable
private fun QueueItem(
    title: String,
    channelName: String,
    isCurrent: Boolean,
    onClick: () -> Unit,
    isDownloading: Boolean,
    onDownload: () -> Unit
) {
    val bgColor = if (isCurrent) {
        NeonColors.ElectricVioletContainer.copy(alpha = 0.15f)
    } else {
        NeonColors.SurfaceContainer
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Play indicator
            if (isCurrent) {
                Icon(
                    imageVector = Icons.Filled.PlayArrow,
                    contentDescription = "Now playing",
                    tint = NeonColors.ElectricViolet,
                    modifier = Modifier
                        .size(20.dp)
                        .padding(end = 8.dp)
                )
            } else {
                Box(modifier = Modifier.size(20.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (isCurrent) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (isCurrent) NeonColors.OnSurface else NeonColors.OnSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                if (channelName.isNotBlank()) {
                    Text(
                        text = channelName,
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurfaceVariant.copy(alpha = 0.7f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Download button per item
            IconButton(
                onClick = onDownload,
                modifier = Modifier.size(32.dp)
            ) {
                if (isDownloading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = NeonColors.ElectricViolet
                    )
                } else {
                    Icon(
                        Icons.Outlined.Download,
                        contentDescription = "Download",
                        tint = NeonColors.OnSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

private fun formatDuration(seconds: Int): String {
    val mins = seconds / 60
    val secs = seconds % 60
    return String.format("%d:%02d", mins, secs)
}

private suspend fun downloadVideo(context: Context, video: YouTubeVideoDto) {
    PlayerState.setDownloading(video.id)
    try {
        val videoUrl = "https://www.youtube.com/watch?v=${video.id}"
        val apiBase = "https://helpful-supposedly-moose.ngrok-free.app"

        // Request download via backend
        val downloadUrl = withContext(Dispatchers.IO) {
            val url = URL("$apiBase/playlist/api/v1/downloads")
            val conn = url.openConnection() as java.net.HttpURLConnection
            conn.requestMethod = "POST"
            conn.doOutput = true
            conn.setRequestProperty("Content-Type", "application/json")
            val jsonInput = """{"url":"$videoUrl","format":"mp4"}"""
            conn.outputStream.use { os ->
                os.write(jsonInput.toByteArray())
            }
            val responseCode = conn.responseCode
            if (responseCode == 200) {
                val body = conn.inputStream.bufferedReader().readText()
                // Parse JSON response to get download URL
                body
            } else {
                throw Exception("Download request failed: $responseCode")
            }
        }

        withContext(Dispatchers.Main) {
            Toast.makeText(context, "Download started: ${video.title}", Toast.LENGTH_SHORT).show()
        }
    } catch (e: Exception) {
        withContext(Dispatchers.Main) {
            Toast.makeText(context, "Download failed: ${e.message}", Toast.LENGTH_LONG).show()
        }
    } finally {
        PlayerState.setDownloading(null)
    }
}
