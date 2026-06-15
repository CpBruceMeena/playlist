package com.playlist.app.ui.player

import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.webkit.JavascriptInterface
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
import androidx.compose.material.icons.filled.OpenInNew
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
                YouTubePlayerCard(
                    currentVideo = currentVideo,
                    onOpenYouTube = { videoId ->
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.youtube.com/watch?v=$videoId")).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        context.startActivity(intent)
                    }
                )
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

/**
 * JavaScript interface bridge for YouTube IFrame Player API events.
 * Called from JavaScript in the WebView via Android.onPlayerError() etc.
 */
class YouTubeJsBridge(
    private val onError: (errorCode: Int) -> Unit,
    private val onStateChange: (state: Int) -> Unit,
    private val onReady: () -> Unit
) {
    private val handler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun onPlayerError(errorCode: Int) {
        handler.post { onError(errorCode) }
    }

    @JavascriptInterface
    fun onPlayerStateChange(state: Int) {
        handler.post { onStateChange(state) }
    }

    @JavascriptInterface
    fun onPlayerReady() {
        handler.post { onReady() }
    }
}

@Composable
private fun YouTubePlayerCard(
    currentVideo: YouTubeVideoDto?,
    onOpenYouTube: (videoId: String) -> Unit = {}
) {
    if (currentVideo == null) return

    val videoId = currentVideo.id
    var playerError by remember { mutableStateOf<Int?>(null) }
    var playerReady by remember { mutableStateOf(false) }
    var lastVideoId by remember { mutableStateOf("") }

    // Reset state when video changes
    if (lastVideoId != videoId) {
        lastVideoId = videoId
        playerError = null
        playerReady = false
    }

    Box(modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f)) {
        Card(
            modifier = Modifier.fillMaxSize(),
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(containerColor = NeonColors.SurfaceDark)
        ) {
            if (playerError != null) {
                // YouTube embed failed — show fallback UI
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Filled.OpenInNew,
                            contentDescription = null,
                            tint = NeonColors.OnSurfaceVariant.copy(alpha = 0.6f),
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(Modifier.height(12.dp))
                        Text(
                            text = "Video unavailable",
                            style = MaterialTheme.typography.titleSmall,
                            color = NeonColors.OnSurface
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = "Playback not available in this app.",
                            style = MaterialTheme.typography.bodySmall,
                            color = NeonColors.OnSurfaceVariant
                        )
                        Spacer(Modifier.height(16.dp))
                        OutlinedButton(
                            onClick = { onOpenYouTube(videoId) },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = NeonColors.NeonCyan
                            ),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Open in YouTube")
                        }
                    }
                }
            } else {
                // YouTube IFrame Player API embed
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

                            webChromeClient = android.webkit.WebChromeClient()

                            // JavaScript bridge for error handling
                            val bridge = YouTubeJsBridge(
                                onError = { code ->
                                    android.util.Log.w("YouTubePlayer", "Player error code: $code")
                                    playerError = code
                                },
                                onStateChange = { state ->
                                    android.util.Log.d("YouTubePlayer", "Player state: $state")
                                },
                                onReady = {
                                    playerReady = true
                                }
                            )
                            addJavascriptInterface(bridge, "Android")

                            // Load custom HTML with YouTube IFrame Player API
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
                            playerError = null
                            playerReady = false
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

        // Loading indicator while player initializes
        if (!playerReady && playerError == null) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(
                    color = NeonColors.ElectricViolet,
                    modifier = Modifier.size(36.dp)
                )
            }
        }
    }
}

/**
 * Build an HTML page using the YouTube IFrame Player API.
 * Loaded via loadDataWithBaseURL to set the Referer header.
 * Communicates errors and state changes to native code via Android.onPlayerError() bridge.
 */
private fun buildEmbedHtml(videoId: String): String = """
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
    * { margin: 0; padding: 0; }
    body { background: #000; overflow: hidden; }
    #player { width: 100vw; height: 100vh; }
</style>
</head>
<body>
<div id="player"></div>
<script>
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: '$videoId',
        playerVars: {
            'autoplay': 1,
            'playsinline': 1,
            'rel': 0
        },
        events: {
            'onReady': function(event) {
                try { Android.onPlayerReady(); } catch(e) {}
                event.target.playVideo();
            },
            'onStateChange': function(event) {
                try { Android.onPlayerStateChange(event.data); } catch(e) {}
            },
            'onError': function(event) {
                try { Android.onPlayerError(event.data); } catch(e) {}
            }
        }
    });
}

// Timeout fallback: if player hasn't reported ready in 10s, treat as error
setTimeout(function() {
    try {
        if (player && player.getPlayerState && player.getPlayerState() === -1) {
            // Still unstarted after 10s - likely blocked
            try { Android.onPlayerError(150); } catch(e) {}
        }
    } catch(e) {}
}, 10000);
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
