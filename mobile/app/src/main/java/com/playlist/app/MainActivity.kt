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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.playlist.app.navigation.PlaylistNavHost
import com.playlist.app.ui.theme.NeonColors
import com.playlist.app.ui.theme.PlaylistTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private var sharedUrl: String? = null

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
                    var showShareSheet by remember { mutableStateOf(sharedUrl != null) }
                    val currentUrl = sharedUrl

                    PlaylistNavHost()

                    // Share intent bottom sheet
                    if (showShareSheet && currentUrl != null) {
                        ShareLinkBottomSheet(
                            url = currentUrl,
                            onDismiss = {
                                showShareSheet = false
                                sharedUrl = null
                            },
                            onPlayVideo = {
                                showShareSheet = false
                                sharedUrl = null
                                // Navigate to player with this video
                                Toast.makeText(
                                    this@MainActivity,
                                    "Opening video...",
                                    Toast.LENGTH_SHORT
                                ).show()
                            },
                            onSaveSong = {
                                showShareSheet = false
                                sharedUrl = null
                                Toast.makeText(
                                    this@MainActivity,
                                    "Song saved!",
                                    Toast.LENGTH_SHORT
                                ).show()
                            },
                            onDownload = {
                                showShareSheet = false
                                sharedUrl = null
                                Toast.makeText(
                                    this@MainActivity,
                                    "Download started!",
                                    Toast.LENGTH_SHORT
                                ).show()
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
                        sharedUrl = extractUrl(sharedText)
                    }
                }
            }
            Intent.ACTION_VIEW -> {
                intent.data?.let { uri ->
                    sharedUrl = uri.toString()
                }
            }
        }
    }

    private fun extractUrl(text: String): String? {
        // Extract YouTube or Instagram URL from shared text
        val urlPattern = Regex("https?://[\\w./%-]+")
        return urlPattern.find(text)?.value
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
