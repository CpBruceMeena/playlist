package com.playlist.app.ui.merge

import androidx.compose.foundation.background
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.playlist.app.ui.components.GlassCard
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MergeScreen(
    viewModel: MergeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Merged Videos",
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
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
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
                    Text(
                        text = "No merged videos yet.\nSelect songs from a playlist and merge them!",
                        style = MaterialTheme.typography.bodyLarge,
                        color = NeonColors.OnSurfaceVariant
                    )
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.mergedVideos) { merged ->
                        GlassCard(modifier = Modifier.fillMaxWidth()) {
                            Column {
                                Text(
                                    text = merged.name ?: merged.filename ?: "Merged Video",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = NeonColors.OnSurface,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )

                                Spacer(modifier = Modifier.height(4.dp))

                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Text(
                                        text = "${merged.duration}s",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = NeonColors.OnSurfaceVariant
                                    )
                                    Text(
                                        text = merged.status ?: "completed",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = NeonColors.NeonCyan
                                    )
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                // Songs in this merge
                                merged.songs?.forEach { song ->
                                    Text(
                                        text = "• ${song.title}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = NeonColors.OnSurfaceVariant,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
