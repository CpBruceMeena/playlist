package com.playlist.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import com.playlist.app.data.api.models.SavedSongVideoDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.data.repository.DownloadManager
import com.playlist.app.data.repository.DownloadRepository
import com.playlist.app.data.repository.SongRepository
import com.playlist.app.navigation.PlaylistNavHost
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.theme.NeonColors
import com.playlist.app.ui.theme.PlaylistTheme
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject
    lateinit var downloadManager: DownloadManager

    @Inject
    lateinit var downloadRepository: DownloadRepository

    @Inject
    lateinit var songRepository: SongRepository

    private val sharedUrlState = mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Handle incoming intent
        handleIntent(intent)

        setContent {
            PlaylistTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = NeonColors.DeepObsidian
                ) {
                    val currentUrl = sharedUrlState.value
                    var navigateToPlayer by remember { mutableStateOf(false) }

                    PlaylistNavHost(
                        externalNavigateToPlayer = navigateToPlayer,
                        onExternalNavigationHandled = { navigateToPlayer = false }
                    )

                    // Share intent bottom sheet
                    if (currentUrl != null) {
                        ShareLinkBottomSheet(
                            url = currentUrl,
                            onDismiss = {
                                sharedUrlState.value = null
                            },
                            onPlayVideo = {
                                sharedUrlState.value = null
                                // Play the video within the app instead of opening externally
                                try {
                                    val url = currentUrl
                                    val videoId = extractVideoIdFromUrl(url)
                                    if (videoId != null && !videoId.startsWith("http")) {
                                        // YouTube video — set up PlayerState and navigate
                                        PlayerState.setQueue(listOf(
                                            YouTubeVideoDto(
                                                id = videoId,
                                                title = "Shared Video",
                                                channelTitle = "",
                                                thumbnailUrl = "https://i.ytimg.com/vi/$videoId/hqdefault.jpg"
                                            )
                                        ))
                                        navigateToPlayer = true
                                    } else {
                                        // Non-YouTube URL — try external as fallback
                                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                        }
                                        startActivity(intent)
                                    }
                                } catch (e: Exception) {
                                    Toast.makeText(this@MainActivity, "Could not open video", Toast.LENGTH_SHORT).show()
                                }
                            },
                            onSaveSong = {
                                sharedUrlState.value = null
                                lifecycleScope.launch(Dispatchers.IO) {
                                    val url = currentUrl
                                    if (url.isNullOrBlank()) {
                                        withContext(Dispatchers.Main) {
                                            Toast.makeText(this@MainActivity, "No URL to save", Toast.LENGTH_SHORT).show()
                                        }
                                        return@launch
                                    }

                                    val videoId = extractVideoIdFromUrl(url)
                                    if (videoId != null && !videoId.startsWith("http")) {
                                        // YouTube URL: save with extracted video ID and minimal info
                                        // Avoids triggering a full server download just to save a bookmark
                                        val result = songRepository.saveSong(
                                            video = SavedSongVideoDto(
                                                id = videoId,
                                                title = "Shared video",
                                                channelTitle = "",
                                                thumbnailUrl = null
                                            ),
                                            singerName = null
                                        )
                                        withContext(Dispatchers.Main) {
                                            if (result.isSuccess) {
                                                Toast.makeText(this@MainActivity, "Song saved!", Toast.LENGTH_SHORT).show()
                                            } else {
                                                Toast.makeText(this@MainActivity, "Failed to save song", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    } else {
                                        // Non-YouTube URL (Instagram, TikTok, etc.):
                                        // Download first to get metadata, then save
                                        val downloadResult = downloadRepository.startDownload(url)
                                        if (downloadResult.isSuccess) {
                                            val dl = downloadResult.getOrNull()!!
                                            val pseudoId = "shared_${(url.hashCode().toLong() and 0xFFFFFFFFL).toString(16)}"
                                            val result = songRepository.saveSong(
                                                video = SavedSongVideoDto(
                                                    id = pseudoId,
                                                    title = dl.title.ifEmpty { "Shared video" },
                                                    channelTitle = dl.filename ?: "",
                                                    thumbnailUrl = dl.thumbnailUrl,
                                                    durationSeconds = dl.duration
                                                ),
                                                singerName = null
                                            )
                                            withContext(Dispatchers.Main) {
                                                if (result.isSuccess) {
                                                    Toast.makeText(this@MainActivity, "Song saved!", Toast.LENGTH_SHORT).show()
                                                } else {
                                                    Toast.makeText(this@MainActivity, "Failed to save song", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        } else {
                                            withContext(Dispatchers.Main) {
                                                Toast.makeText(this@MainActivity, "Could not process video", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    }
                                }
                            },
                            onDownload = {
                                sharedUrlState.value = null
                                if (!currentUrl.isNullOrBlank()) {
                                    downloadManager.startDownload(currentUrl, "Shared video")
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        when (intent?.action) {
            Intent.ACTION_SEND -> {
                if (intent.type?.startsWith("text/") == true) {
                    val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT)
                    if (sharedText != null) {
                        sharedUrlState.value = extractUrl(sharedText)
                    }
                }
            }
            Intent.ACTION_VIEW -> {
                intent.data?.let { uri ->
                    sharedUrlState.value = uri.toString()
                }
            }
        }
    }

    private fun extractUrl(text: String): String? {
        // Extract YouTube or Instagram URL from shared text.
        // Include common URL characters: letters, digits, and special chars
        // like ?&=#@:;,+ which appear in query strings and paths.
        val urlPattern = Regex("https?://[\\w./%?=&:#@_;,+!~*()-]+")
        return urlPattern.find(text)?.value
    }

    private fun extractVideoIdFromUrl(url: String): String? {
        return when {
            url.contains("youtube.com/watch") -> {
                val params = url.substringAfter("?").split("&")
                params.firstOrNull { it.startsWith("v=") }?.removePrefix("v=")
            }
            url.contains("youtu.be/") -> url.substringAfter("youtu.be/").substringBefore("?")
            url.contains("instagram.com") -> {
                // Instagram reels/links - use the URL as-is
                url
            }
            else -> null
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShareLinkBottomSheet(
    url: String,
    onDismiss: () -> Unit,
    onPlayVideo: () -> Unit,
    onSaveSong: () -> Unit,
    onDownload: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = NeonColors.SurfaceDark,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Shared URL preview
            Text(
                text = "Link detected!",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = NeonColors.OnSurface
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = url,
                style = MaterialTheme.typography.bodySmall,
                color = NeonColors.OnSurfaceVariant,
                textAlign = TextAlign.Center,
                maxLines = 2
            )

            Spacer(Modifier.height(24.dp))

            // Action buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                // Play
                ShareActionButton(
                    icon = Icons.Filled.PlayCircleFilled,
                    label = "Play",
                    color = NeonColors.NeonCyan,
                    onClick = onPlayVideo
                )

                // Save
                ShareActionButton(
                    icon = Icons.Outlined.BookmarkAdd,
                    label = "Save",
                    color = NeonColors.ElectricViolet,
                    onClick = onSaveSong
                )

                // Download
                ShareActionButton(
                    icon = Icons.Outlined.Download,
                    label = "Download",
                    color = NeonColors.NeonCyan,
                    onClick = onDownload
                )
            }

            Spacer(Modifier.height(16.dp))

            // Cancel
            TextButton(onClick = onDismiss) {
                Text(
                    text = "Cancel",
                    style = MaterialTheme.typography.labelMedium,
                    color = NeonColors.OnSurfaceVariant
                )
            }

            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
private fun ShareActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = color.copy(alpha = 0.15f),
            modifier = Modifier.size(56.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = label,
                    tint = color,
                    modifier = Modifier.size(28.dp)
                )
            }
        }
        Spacer(Modifier.height(6.dp))
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Medium,
            color = NeonColors.OnSurfaceVariant,
            fontSize = 12.sp
        )
    }
}
