package com.playlist.app.ui.player

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Repeat
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.outlined.Repeat
import androidx.compose.material.icons.outlined.Shuffle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.PlayerConstants
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.YouTubePlayer
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.listeners.AbstractYouTubePlayerListener
import com.pierfrancescosoffritti.androidyoutubeplayer.core.player.views.YouTubePlayerView
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.ui.components.formatDuration
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlayerScreen() {
    val queue by PlayerState.queue.collectAsState()
    val currentIndex by PlayerState.currentIndex.collectAsState()
    var isPlaying by remember { mutableStateOf(true) }
    var isShuffled by remember { mutableStateOf(false) }
    var repeatMode by remember { mutableStateOf("none") } // none, all

    val currentVideo = queue.getOrNull(currentIndex)

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Player",
                        style = MaterialTheme.typography.titleLarge,
                        color = NeonColors.OnSurface
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = NeonColors.DeepObsidian
                )
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        if (queue.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No songs in queue.\nSearch and generate a playlist first.",
                    style = MaterialTheme.typography.bodyLarge,
                    color = NeonColors.OnSurfaceVariant
                )
            }
            return@Scaffold
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // YouTube Player
            currentVideo?.let { video ->
                YouTubePlayerEmbed(
                    videoId = video.id,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(240.dp)
                )

                // Video info
                Column(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                ) {
                    Text(
                        text = video.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Medium,
                        color = NeonColors.OnSurface,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )

                    video.singerName?.let { singer ->
                        Text(
                            text = singer,
                            style = MaterialTheme.typography.labelMedium,
                            color = NeonColors.ElectricViolet,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Text(
                        text = video.channelTitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = NeonColors.OnSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))
            }

            // Playback controls
            PlaybackControls(
                isPlaying = isPlaying,
                isShuffled = isShuffled,
                repeatMode = repeatMode,
                onPlayPause = { isPlaying = !isPlaying },
                onNext = {
                    val next = currentIndex + 1
                    if (next < queue.size) {
                        PlayerState.setCurrentIndex(next)
                    } else if (repeatMode == "all") {
                        PlayerState.setCurrentIndex(0)
                    }
                },
                onPrevious = {
                    val prev = currentIndex - 1
                    if (prev >= 0) {
                        PlayerState.setCurrentIndex(prev)
                    }
                },
                onShuffle = { isShuffled = !isShuffled },
                onRepeat = {
                    repeatMode = when (repeatMode) {
                        "none" -> "all"
                        "all" -> "none"
                        else -> "none"
                    }
                }
            )

            // Queue list
            Text(
                text = "Queue (${queue.size} songs)",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = NeonColors.OnSurface,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
            )

            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                itemsIndexed(queue) { index, video ->
                    QueueItemView(
                        video = video,
                        isCurrent = index == currentIndex,
                        onClick = { PlayerState.setCurrentIndex(index) }
                    )
                }
            }
        }
    }
}

@Composable
private fun YouTubePlayerEmbed(
    videoId: String,
    modifier: Modifier = Modifier
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    var player by remember { mutableStateOf<YouTubePlayer?>(null) }
    var hasError by remember { mutableStateOf(false) }

    // Reset error state when navigating to a new video
    LaunchedEffect(videoId) {
        hasError = false
    }

    Column(modifier = modifier) {
        if (hasError) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
                    .background(NeonColors.SurfaceContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Unable to play this video.\nIt may be unavailable or restricted.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = NeonColors.ErrorRed,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(24.dp)
                )
            }
        } else {
            AndroidView(
                factory = { context ->
                    YouTubePlayerView(context).apply {
                        lifecycleOwner.lifecycle.addObserver(this)

                        addYouTubePlayerListener(object : AbstractYouTubePlayerListener() {
                            override fun onReady(youTubePlayer: YouTubePlayer) {
                                player = youTubePlayer
                                youTubePlayer.loadVideo(videoId, 0f)
                            }

                            override fun onError(youTubePlayer: YouTubePlayer, error: PlayerConstants.PlayerError) {
                                hasError = true
                            }
                        })
                    }
                },
                update = { _ ->
                    player?.let { p ->
                        hasError = false
                        p.loadVideo(videoId, 0f)
                    }
                },
                onRelease = { view ->
                    player = null
                    view.release()
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
            )
        }
    }
}

@Composable
private fun PlaybackControls(
    isPlaying: Boolean,
    isShuffled: Boolean,
    repeatMode: String,
    onPlayPause: () -> Unit,
    onNext: () -> Unit,
    onPrevious: () -> Unit,
    onShuffle: () -> Unit,
    onRepeat: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 32.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Shuffle
        IconButton(onClick = onShuffle) {
            Icon(
                imageVector = if (isShuffled) Icons.Filled.Shuffle else Icons.Outlined.Shuffle,
                contentDescription = "Shuffle",
                tint = if (isShuffled) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
            )
        }

        // Previous
        IconButton(onClick = onPrevious) {
            Icon(
                imageVector = Icons.Filled.SkipPrevious,
                contentDescription = "Previous",
                tint = NeonColors.OnSurface,
                modifier = Modifier.size(36.dp)
            )
        }

        // Play/Pause
        FilledIconButton(
            onClick = onPlayPause,
            modifier = Modifier.size(56.dp),
            colors = IconButtonDefaults.filledIconButtonColors(
                containerColor = NeonColors.ElectricViolet
            ),
            shape = CircleShape
        ) {
            Icon(
                imageVector = if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                contentDescription = if (isPlaying) "Pause" else "Play",
                tint = NeonColors.DeepObsidian,
                modifier = Modifier.size(32.dp)
            )
        }

        // Next
        IconButton(onClick = onNext) {
            Icon(
                imageVector = Icons.Filled.SkipNext,
                contentDescription = "Next",
                tint = NeonColors.OnSurface,
                modifier = Modifier.size(36.dp)
            )
        }

        // Repeat
        IconButton(onClick = onRepeat) {
            Icon(
                imageVector = if (repeatMode == "all") Icons.Filled.Repeat else Icons.Outlined.Repeat,
                contentDescription = "Repeat",
                tint = if (repeatMode == "all") NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
            )
        }
    }
}

@Composable
private fun QueueItemView(
    video: YouTubeVideoDto,
    isCurrent: Boolean,
    onClick: () -> Unit
) {
    val bgColor = if (isCurrent) {
        NeonColors.ElectricVioletContainer.copy(alpha = 0.2f)
    } else {
        NeonColors.SurfaceContainer
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(bgColor)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = video.title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isCurrent) FontWeight.SemiBold else FontWeight.Normal,
                color = if (isCurrent) NeonColors.ElectricViolet else NeonColors.OnSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            video.singerName?.let { singer ->
                Text(
                    text = singer,
                    style = MaterialTheme.typography.labelSmall,
                    color = NeonColors.ElectricViolet
                )
            }

            Text(
                text = video.channelTitle,
                style = MaterialTheme.typography.labelSmall,
                color = NeonColors.OnSurfaceVariant
            )
        }

        if (video.durationSeconds > 0) {
            Text(
                text = formatDuration(video.durationSeconds),
                style = MaterialTheme.typography.labelSmall,
                color = NeonColors.OnSurfaceVariant
            )
        }
    }
}
