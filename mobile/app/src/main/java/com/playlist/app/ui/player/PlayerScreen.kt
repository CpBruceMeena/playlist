package com.playlist.app.ui.player

import android.content.Intent
import android.graphics.Bitmap
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.outlined.BookmarkAdd
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.playlist.app.data.api.models.SavedSongVideoDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.data.repository.DownloadRepository
import com.playlist.app.data.repository.SongRepository
import com.playlist.app.ui.components.SnackbarManager
import com.playlist.app.ui.components.ToastType
import com.playlist.app.ui.theme.NeonColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen(
    onNavigateBack: () -> Unit = {},
    songRepository: SongRepository? = null,
    downloadRepository: DownloadRepository? = null
) {
    val queue by PlayerState.queue.collectAsState()
    val currentIndex by PlayerState.currentIndex.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    if (queue.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(NeonColors.DeepObsidian),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Filled.MusicNote,
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
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = NeonColors.OnSurface)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NeonColors.DeepObsidian)
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(8.dp))

            // In-app YouTube player via WebView
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = NeonColors.SurfaceDark)
            ) {
                val videoId = currentVideo.id

                AndroidView(
                    modifier = Modifier.fillMaxSize(),
                    factory = { ctx ->
                        WebView(ctx).apply {
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            settings.loadWithOverviewMode = true
                            settings.useWideViewPort = true
                            settings.mediaPlaybackRequiresUserGesture = false

                            webChromeClient = object : WebChromeClient() {}
                            webViewClient = object : WebViewClient() {}

                            val embedHtml = """
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                                    <style>
                                        * { margin: 0; padding: 0; box-sizing: border-box; }
                                        body { background: #000; overflow: hidden; }
                                        .container { position: relative; width: 100vw; height: 100vh; }
                                        iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <iframe src="https://www.youtube.com/embed/$videoId?autoplay=1&playsinline=1&rel=0&modestbranding=1"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowfullscreen>
                                        </iframe>
                                    </div>
                                </body>
                                </html>
                            """.trimIndent()

                            loadDataWithBaseURL("https://www.youtube.com", embedHtml, "text/html", "UTF-8", null)
                        }
                    },
                    update = { view ->
                        // Reload if video changes
                        if (currentVideo.id != videoId) {
                            val newEmbed = """
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                                    <style>
                                        * { margin: 0; padding: 0; box-sizing: border-box; }
                                        body { background: #000; overflow: hidden; }
                                        .container { position: relative; width: 100vw; height: 100vh; }
                                        iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <iframe src="https://www.youtube.com/embed/${currentVideo.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowfullscreen>
                                        </iframe>
                                    </div>
                                </body>
                                </html>
                            """.trimIndent()
                            view.loadDataWithBaseURL("https://www.youtube.com", newEmbed, "text/html", "UTF-8", null)
                        }
                    }
                )
            }

            Spacer(Modifier.height(12.dp))

            // Song info
            Text(
                text = currentVideo.title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = NeonColors.OnSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth()
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = currentVideo.channelTitle ?: currentVideo.singerName ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = NeonColors.ElectricViolet,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                if (currentVideo.durationSeconds > 0) {
                    Text(
                        text = formatDuration(currentVideo.durationSeconds),
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurfaceVariant
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            // Queue list
            Text(
                text = "Queue (${queue.size} videos)",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.SemiBold,
                color = NeonColors.OnSurfaceVariant,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 4.dp)
            )

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                itemsIndexed(queue) { index, video ->
                    QueueItem(
                        title = video.title,
                        channelName = video.channelTitle ?: video.singerName ?: "",
                        isCurrent = index == currentIndex,
                        onClick = { PlayerState.setCurrentIndex(index) }
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            // Action buttons row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // Save song button
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            songRepository?.let { repo ->
                                val result = repo.saveSong(
                                    video = SavedSongVideoDto(
                                        id = currentVideo.id,
                                        title = currentVideo.title,
                                        channelTitle = currentVideo.channelTitle ?: "",
                                        thumbnailUrl = currentVideo.thumbnailUrl,
                                        duration = currentVideo.duration,
                                        durationSeconds = currentVideo.durationSeconds
                                    ),
                                    singerId = currentVideo.singerId,
                                    singerName = currentVideo.singerName
                                )
                                result.fold(
                                    onSuccess = { SnackbarManager.show("Song saved!", ToastType.SUCCESS) },
                                    onFailure = { e ->
                                        if (e.message?.contains("DUPLICATE") == true) {
                                            SnackbarManager.show("Song already saved", ToastType.INFO)
                                        } else {
                                            SnackbarManager.show("Failed to save: ${e.message ?: "error"}", ToastType.ERROR)
                                        }
                                    }
                                )
                            } ?: run {
                                Toast.makeText(context, "Song saved!", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonColors.NeonCyan),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Outlined.BookmarkAdd, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Save", style = MaterialTheme.typography.labelSmall)
                }

                // Download button
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            downloadRepository?.let { repo ->
                                val result = repo.startDownload("https://www.youtube.com/watch?v=${currentVideo.id}")
                                result.fold(
                                    onSuccess = { SnackbarManager.show("Download started: ${currentVideo.title}", ToastType.SUCCESS) },
                                    onFailure = { e -> SnackbarManager.show("Download failed: ${e.message ?: "error"}", ToastType.ERROR) }
                                )
                            } ?: run {
                                Toast.makeText(context, "Download started: ${currentVideo.title}", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonColors.ElectricViolet),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Outlined.Download, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Download", style = MaterialTheme.typography.labelSmall)
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
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonColors.NeonCyan),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Outlined.Share, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Share", style = MaterialTheme.typography.labelSmall)
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
    onClick: () -> Unit
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
        }
    }
}

private fun formatDuration(seconds: Int): String {
    val mins = seconds / 60
    val secs = seconds % 60
    return String.format("%d:%02d", mins, secs)
}
