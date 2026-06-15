package com.playlist.app.ui.player

import android.content.Intent
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebView
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import com.playlist.app.data.api.models.SavedSongVideoDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.data.repository.DownloadManager
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
    downloadRepository: DownloadRepository? = null,
    downloadManager: DownloadManager? = null
) {
    val queue by PlayerState.queue.collectAsState()
    val currentIndex by PlayerState.currentIndex.collectAsState()
    val videoFileItem by PlayerState.videoFileItem.collectAsState()
    val videoFileQueue by PlayerState.videoFileQueue.collectAsState()
    val videoFileIndex by PlayerState.videoFileIndex.collectAsState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val isVideoFile = videoFileItem != null
    val isEmpty = queue.isEmpty() && !isVideoFile

    if (isEmpty) {
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

    val currentVideo = queue.getOrNull(currentIndex)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isVideoFile) "Video Player" else "Now Playing",
                        style = MaterialTheme.typography.titleMedium,
                        color = NeonColors.OnSurface
                    )
                },
                navigationIcon = {
                    IconButton(onClick = {
                        if (isVideoFile) PlayerState.clear()
                        onNavigateBack()
                    }) {
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
                .padding(top = padding.calculateTopPadding())
                .padding(horizontal = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(4.dp))

            // Player area — ExoPlayer for video files, YouTube WebView for YouTube videos
            if (isVideoFile) {
                // ── Video File Player (ExoPlayer) ──
                VideoFilePlayerCard(
                    videoFileItem = videoFileItem!!
                )
            } else {
                // ── YouTube Player via WebView ──
                YouTubePlayerCard(currentVideo = currentVideo)
            }

            Spacer(Modifier.height(12.dp))

            // Video info
            val displayTitle = if (isVideoFile) videoFileItem!!.title else currentVideo?.title ?: ""
            val displayChannel = if (!isVideoFile) (currentVideo?.channelTitle ?: currentVideo?.singerName ?: "") else ""

            Text(
                text = displayTitle,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = NeonColors.OnSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth()
            )

            if (!isVideoFile) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 2.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = displayChannel,
                        style = MaterialTheme.typography.bodySmall,
                        color = NeonColors.ElectricViolet,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    if (currentVideo != null && currentVideo.durationSeconds > 0) {
                        Text(
                            text = formatDuration(currentVideo.durationSeconds),
                            style = MaterialTheme.typography.labelSmall,
                            color = NeonColors.OnSurfaceVariant
                        )
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // Queue list (only for YouTube mode)
            if (!isVideoFile) {
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
            } else {
                // ── Queue list for video file mode (other downloads) ──
                if (videoFileQueue.size > 1) {
                    Text(
                        text = "All Downloads (${videoFileQueue.size} videos)",
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
                        itemsIndexed(videoFileQueue) { index, item ->
                            VideoFileQueueItem(
                                item = item,
                                isCurrent = index == videoFileIndex,
                                onClick = { PlayerState.setVideoFileIndex(index) }
                            )
                        }
                    }
                } else {
                    Spacer(Modifier.weight(1f))
                }
            }

            Spacer(Modifier.height(8.dp))

            // Action buttons row (only for YouTube mode)
            if (!isVideoFile && currentVideo != null) {
                YouTubeActionButtons(
                    currentVideo = currentVideo,
                    songRepository = songRepository,
                    downloadRepository = downloadRepository,
                    downloadManager = downloadManager,
                    context = context,
                    scope = scope
                )
            }
        }
    }
}

@Composable
private fun VideoFilePlayerCard(
    videoFileItem: VideoFileItem
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    // Use videoFileItem as key so ExoPlayer re-creates when switching videos
    val exoPlayer = remember(videoFileItem.url) {
        ExoPlayer.Builder(context).build().apply {
            val mediaItem = MediaItem.fromUri(Uri.parse(videoFileItem.url))
            setMediaItem(mediaItem)
            prepare()
            playWhenReady = true
        }
    }

    // Lifecycle-aware pause/resume — key includes url so old ExoPlayer is released on video switch
    DisposableEffect(lifecycleOwner, videoFileItem.url) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_PAUSE -> {
                    exoPlayer.playWhenReady = false
                }
                Lifecycle.Event.ON_RESUME -> {
                    exoPlayer.playWhenReady = true
                }
                else -> {}
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            exoPlayer.apply {
                stop()
                release()
            }
        }
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = NeonColors.SurfaceDark)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        player = exoPlayer
                        useController = true
                        resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                        setShowSubtitleButton(false)
                        layoutParams = ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.MATCH_PARENT
                        )
                    }
                }
            )
        }
    }
}

@Composable
private fun YouTubePlayerCard(currentVideo: YouTubeVideoDto?) {
    if (currentVideo == null) return

    val videoId = currentVideo.id

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = NeonColors.SurfaceDark)
    ) {
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
                    settings.userAgentString = "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36"
                    settings.allowContentAccess = true
                    settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    settings.cacheMode = android.webkit.WebSettings.LOAD_CACHE_ELSE_NETWORK
                    settings.allowFileAccess = true

                    // WebChromeClient is needed for proper media playback
                    webChromeClient = android.webkit.WebChromeClient()

                    webViewClient = object : android.webkit.WebViewClient() {
                        override fun onReceivedHttpError(
                            view: WebView?,
                            request: android.webkit.WebResourceRequest?,
                            errorResponse: android.webkit.WebResourceResponse?
                        ) {
                            super.onReceivedHttpError(view, request, errorResponse)
                            android.util.Log.w("YouTubePlayer", "HTTP error loading video: ${errorResponse?.statusCode}")
                        }
                    }

                    // Use the YouTube embed URL via iframe loaded with loadDataWithBaseURL.
                    // This sets the Referer header to youtube.com, avoiding the "playback id" error.
                    loadDataWithBaseURL(
                        "https://www.youtube.com",
                        buildEmbedHtml(videoId),
                        "text/html",
                        "UTF-8",
                        null
                    )
                }
            },
            update = { view ->
                val currentId = currentVideo.id
                if (view.tag != currentId) {
                    view.tag = currentId
                    view.loadDataWithBaseURL(
                        "https://www.youtube.com",
                        buildEmbedHtml(currentId),
                        "text/html",
                        "UTF-8",
                        null
                    )
                }
            }
        )
    }
}

/**
 * Build an HTML page with a YouTube iframe embed for the given video ID.
 * Uses loadDataWithBaseURL to set the Referer header so YouTube allows playback.
 * Includes JS error detection and fallback URL loading.
 */
private fun buildEmbedHtml(videoId: String): String = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <style>
            * { margin: 0; padding: 0; }
            body { background: #000; overflow: hidden; }
            .embed-container {
                position: relative;
                width: 100vw;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            iframe {
                width: 100%;
                height: 100%;
                border: none;
            }
            .error-overlay {
                display: none;
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                color: #aaa;
                font-family: sans-serif;
                text-align: center;
                padding: 40px 20px;
                box-sizing: border-box;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            .error-overlay.visible {
                display: flex;
            }
            .error-overlay h3 { color: #eee; margin-bottom: 8px; font-size: 16px; }
            .error-overlay p { font-size: 13px; margin-bottom: 16px; }
            .error-overlay a {
                color: #8ab4f8;
                text-decoration: underline;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="embed-container" id="container">
            <iframe id="ytplayer"
                src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&enablejsapi=0&origin=https://www.youtube.com"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
            <div class="error-overlay" id="errorOverlay">
                <h3>Video unavailable</h3>
                <p>This video may not be available for playback in this app.</p>
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">Open in YouTube</a>
            </div>
        </div>
        <script>
            // Detect if the iframe loaded successfully after a timeout
            var iframe = document.getElementById('ytplayer');
            var overlay = document.getElementById('errorOverlay');
            setTimeout(function() {
                try {
                    // If we can't access the iframe content, assume it loaded (normal for cross-origin)
                    // Check if the iframe's document has an error indicator
                    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc.body.innerHTML.indexOf('unavailable') !== -1 ||
                        iframeDoc.body.innerHTML.indexOf('error') !== -1) {
                        overlay.classList.add('visible');
                    }
                } catch(e) {
                    // Cross-origin: iframe likely loaded fine (normal state)
                }
            }, 5000);
            // Add direct click handler for error overlay link
            document.addEventListener('click', function(e) {
                var target = e.target;
                if (target.tagName === 'A' && target.getAttribute('target') === '_blank') {
                    e.preventDefault();
                    window.location.href = target.href;
                }
            });
        </script>
    </body>
    </html>
""".trimIndent()

@Composable
private fun YouTubeActionButtons(
    currentVideo: YouTubeVideoDto,
    songRepository: SongRepository?,
    downloadRepository: DownloadRepository?,
    downloadManager: DownloadManager?,
    context: android.content.Context,
    scope: kotlinx.coroutines.CoroutineScope
) {
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
                downloadManager?.let { dm ->
                    dm.startDownload("https://www.youtube.com/watch?v=${currentVideo.id}", currentVideo.title)
                } ?: run {
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

@Composable
private fun VideoFileQueueItem(
    item: VideoFileItem,
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
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Thumbnail
            if (item.thumbnailUrl != null) {
                AsyncImage(
                    model = item.thumbnailUrl,
                    contentDescription = null,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(6.dp)),
                    contentScale = ContentScale.Crop
                )
                Spacer(Modifier.width(10.dp))
            }

            // Play indicator
            if (isCurrent) {
                Icon(
                    imageVector = Icons.Filled.PlayArrow,
                    contentDescription = "Now playing",
                    tint = NeonColors.ElectricViolet,
                    modifier = Modifier
                        .size(18.dp)
                        .padding(end = 6.dp)
                )
            } else {
                Box(modifier = Modifier.size(24.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = if (isCurrent) FontWeight.SemiBold else FontWeight.Medium,
                    color = if (isCurrent) NeonColors.OnSurface else NeonColors.OnSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(2.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (item.duration > 0) {
                        Text(
                            text = formatDuration(item.duration),
                            style = MaterialTheme.typography.labelSmall,
                            color = NeonColors.OnSurfaceVariant.copy(alpha = 0.7f)
                        )
                    }
                    if (item.fileSize > 0) {
                        Text(
                            text = "${item.fileSize / 1024 / 1024}MB",
                            style = MaterialTheme.typography.labelSmall,
                            color = NeonColors.OnSurfaceVariant.copy(alpha = 0.7f)
                        )
                    }
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
