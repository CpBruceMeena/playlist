package com.playlist.app.ui.merge

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.playlist.app.data.api.models.MergedVideoDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.ui.components.GlassCard
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.theme.NeonColors

@Composable
private fun MergedVideoCard(
    merged: MergedVideoDto,
    thumbnailUrl: String? = null,
    onPlay: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onPlay)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Thumbnail
            if (thumbnailUrl != null) {
                AsyncImage(
                    model = thumbnailUrl,
                    contentDescription = null,
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(NeonColors.SurfaceDark),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                )
                Spacer(Modifier.width(12.dp))
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = merged.title ?: merged.name ?: merged.filename ?: "Merged Video",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = NeonColors.OnSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    val mins = merged.duration / 60
                    val secs = merged.duration % 60
                    Text(
                        text = String.format("%d:%02d", mins, secs),
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurfaceVariant
                    )
                    Text(
                        text = merged.status ?: "completed",
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.NeonCyan
                    )
                }
                Spacer(modifier = Modifier.height(2.dp))
                merged.songs?.let { songs ->
                    val count = songs.size
                    Text(
                        text = "$count tracks",
                        style = MaterialTheme.typography.bodySmall,
                        color = NeonColors.OnSurfaceVariant.copy(alpha = 0.7f),
                        maxLines = 1
                    )
                }
            }
            IconButton(onClick = onPlay) {
                Icon(
                    Icons.Filled.PlayArrow,
                    contentDescription = "Play",
                    tint = NeonColors.ElectricViolet
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MergeScreen(
    onNavigateToPlayer: () -> Unit = {},
    onNavigateBack: () -> Unit = {},
    onPlayMergedVideo: ((url: String, title: String, thumbnailUrl: String?, allMerged: List<MergedVideoDto>) -> Unit)? = null,
    viewModel: MergeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Merged Videos",
                        style = MaterialTheme.typography.titleMedium,
                        color = NeonColors.OnSurface
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = NeonColors.OnSurface)
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
                .padding(top = padding.calculateTopPadding())
        ) {
            // Success/Error messages
            uiState.mergeSuccess?.let { msg ->
                Text(
                    text = msg,
                    color = NeonColors.NeonCyan,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )
            }

            uiState.error?.let { error ->
                Text(
                    text = error,
                    color = NeonColors.ErrorRed,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )
            }

            // Merge history
            if (uiState.isMerging) {
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        color = NeonColors.ElectricViolet,
                        modifier = Modifier
                            .padding(24.dp)
                            .size(32.dp)
                    )
                }
            }

            if (uiState.mergedVideos.isEmpty() && uiState.isLoaded) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Filled.VideoLibrary,
                            contentDescription = null,
                            tint = NeonColors.OnSurfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(Modifier.height(16.dp))
                        Text(
                            text = "No merged videos yet",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = NeonColors.OnSurface
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = "Select songs from a playlist and merge them into a single video",
                            style = MaterialTheme.typography.bodyMedium,
                            color = NeonColors.OnSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 48.dp),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.mergedVideos) { merged ->
                        MergedVideoCard(
                            merged = merged,
                            thumbnailUrl = merged.thumbnailUrl,
                            onPlay = {
                                // Use the merged video file URL if available
                                val videoUrl = merged.videoUrl ?: merged.url
                                if (videoUrl != null) {
                                    val fullUrl = if (videoUrl.startsWith("http")) videoUrl
                                        else "http://10.0.2.2:3001$videoUrl"
                                    val title = merged.title ?: merged.name ?: merged.filename ?: "Merged Video"
                                    onPlayMergedVideo?.invoke(fullUrl, title, merged.thumbnailUrl, uiState.mergedVideos)
                                } else {
                                    // Fallback: play individual songs
                                    val songs = merged.songs ?: emptyList()
                                    val videos = songs.map { song ->
                                        YouTubeVideoDto(
                                            id = song.id,
                                            title = song.title,
                                            channelTitle = "",
                                            thumbnailUrl = null
                                        )
                                    }
                                    if (videos.isNotEmpty()) {
                                        PlayerState.setQueue(videos)
                                        onNavigateToPlayer()
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
    }
}
