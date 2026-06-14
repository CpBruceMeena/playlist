package com.playlist.app.ui.tvseries

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.PlaylistAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.playlist.app.data.api.models.TVSeriesDto
import com.playlist.app.ui.components.SearchBar
import com.playlist.app.ui.components.VideoResultsGrid
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TVSeriesScreen(
    onNavigateToPlayer: () -> Unit,
    viewModel: TVSeriesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    // Auto-navigate when user explicitly taps Play
    LaunchedEffect(uiState.navigateToPlayer) {
        if (uiState.navigateToPlayer) {
            onNavigateToPlayer()
            viewModel.onNavigatedToPlayer()
        }
    }

    // Name dialog for save-as-playlist
    if (uiState.showNameDialog) {
        NameDialog(
            title = "Save as Playlist",
            buttonLabel = "Save",
            onConfirm = { name -> viewModel.saveAsPlaylist(name) },
            onDismiss = { viewModel.dismissNameDialog() }
        )
    }

    // Download dialog
    if (uiState.showDownloadDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.dismissDownloadDialog() },
            title = { Text("Download Videos", color = NeonColors.OnSurface, style = MaterialTheme.typography.titleSmall) },
            text = {
                Text(
                    "Download ${uiState.videoIdsToDownload.size} selected video(s)?\n\nVideos are saved server-side and accessible from the Downloads tab.",
                    color = NeonColors.OnSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall
                )
            },
            confirmButton = {
                TextButton(onClick = { viewModel.confirmDownload() }) {
                    Text("Download", color = NeonColors.ElectricViolet)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissDownloadDialog() }) {
                    Text("Cancel", color = NeonColors.OnSurfaceVariant)
                }
            },
            containerColor = NeonColors.SurfaceDark
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("TV Series", color = NeonColors.OnSurface, style = MaterialTheme.typography.titleMedium) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NeonColors.DeepObsidian)
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        if (uiState.hasGenerated && uiState.generatedVideos.isNotEmpty()) {
            // ── Show generated episodes with selection mode ──
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${uiState.generatedVideos.size} episodes",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurface
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        OutlinedButton(
                            onClick = { viewModel.showSavePlaylistDialog() },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonColors.ElectricViolet),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Outlined.PlaylistAdd, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(3.dp))
                            Text("Save", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }

                VideoResultsGrid(
                    videos = uiState.generatedVideos,
                    selectedVideoIds = uiState.selectedVideoIds,
                    onToggleSelect = { viewModel.toggleVideoSelection(it) },
                    onLongPress = { viewModel.toggleVideoSelection(it) },
                    onPlay = { viewModel.playSelected() },
                    onDownload = { viewModel.showDownloadDialog() },
                    onSaveAsPlaylist = { viewModel.showSavePlaylistDialog() },
                    onClearSelection = { viewModel.clearVideoSelection() }
                )
            }
        } else {
            // ── Show series list (saved + all) ──
            val hasSelection = uiState.selectedSeriesId != null || uiState.customSeriesName.isNotBlank()

            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(bottom = 16.dp)
            ) {
                // Compact Search
                item {
                    SearchBar(
                        query = uiState.searchQuery,
                        onQueryChange = { viewModel.onSearchQueryChange(it) },
                        onSearch = {},
                        placeholder = "Search TV series..."
                    )
                }

                // Channel filter chips (compact)
                if (uiState.channels.isNotEmpty()) {
                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(vertical = 2.dp)
                        ) {
                            item {
                                FilterChip(
                                    selected = uiState.channelFilter == null,
                                    onClick = { viewModel.onChannelSelect(null) },
                                    label = { Text("All", style = MaterialTheme.typography.labelSmall) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        containerColor = NeonColors.SurfaceContainer,
                                        selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                                    )
                                )
                            }
                            items(uiState.channels) { ch ->
                                FilterChip(
                                    selected = uiState.channelFilter == ch,
                                    onClick = { viewModel.onChannelSelect(if (uiState.channelFilter == ch) null else ch) },
                                    label = { Text(ch, style = MaterialTheme.typography.labelSmall) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        containerColor = NeonColors.SurfaceContainer,
                                        selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                                    )
                                )
                            }
                        }
                    }
                }

                // Generation progress
                if (uiState.isGenerating) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = NeonColors.ElectricViolet, modifier = Modifier.size(28.dp))
                        }
                    }
                }

                // Selection + generate row
                if (hasSelection) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 2.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = uiState.selectedSeriesName ?: uiState.customSeriesName,
                                color = NeonColors.ElectricViolet,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f)
                            )
                            TextButton(onClick = { viewModel.clearSelection() }, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)) {
                                Text("Clear", color = NeonColors.OnSurfaceVariant, style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }

                if (hasSelection && !uiState.isGenerating) {
                    item {
                        Button(
                            onClick = { viewModel.generatePlaylist(null) },
                            colors = ButtonDefaults.buttonColors(containerColor = NeonColors.ElectricViolet, contentColor = NeonColors.DeepObsidian),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Filled.Tv, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Generate Episodes", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                // Error
                uiState.error?.let { error ->
                    item {
                        Text(error, color = NeonColors.ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp))
                    }
                }

                // Saved series section
                if (uiState.savedSeries.isNotEmpty()) {
                    item {
                        Text(
                            text = "Saved (${uiState.savedSeries.size})",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = NeonColors.OnSurface,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                        )
                    }

                    item {
                        LazyRow(
                            contentPadding = PaddingValues(horizontal = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(uiState.savedSeries) { series ->
                                SavedSeriesCard(
                                    series = series,
                                    isSelected = uiState.selectedSeriesId == series.id,
                                    onSelect = { viewModel.selectSeries(series.id, series.name) },
                                    onUnsave = { viewModel.toggleSavedSeries(series) }
                                )
                            }
                        }
                    }
                }

                // All Series header
                item {
                    Text(
                        text = "All Series",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurface,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }

                // Series grid
                if (uiState.isLoading) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = NeonColors.ElectricViolet)
                        }
                    }
                } else if (uiState.filteredSeries.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(top = 24.dp, bottom = 48.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Filled.Tv,
                                    contentDescription = null,
                                    tint = NeonColors.OnSurfaceVariant.copy(alpha = 0.4f),
                                    modifier = Modifier.size(40.dp)
                                )
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = if (uiState.searchQuery.isNotBlank() || uiState.channelFilter != null)
                                        "No matches"
                                    else
                                        "No series yet",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = NeonColors.OnSurface
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = if (uiState.searchQuery.isNotBlank())
                                        "Try a different search"
                                    else
                                        "Check back later",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = NeonColors.OnSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    val gridItems = uiState.filteredSeries.chunked(3)
                    items(gridItems.size) { rowIndex ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            gridItems[rowIndex].forEach { series ->
                                SeriesCard(
                                    series = series,
                                    isSelected = uiState.selectedSeriesId == series.id,
                                    isSaved = viewModel.isSeriesSaved(series.id),
                                    onSelect = { viewModel.selectSeries(series.id, series.name) },
                                    onToggleSave = { viewModel.toggleSavedSeries(series) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun NameDialog(
    title: String,
    buttonLabel: String,
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var text by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, color = NeonColors.OnSurface) },
        text = {
            OutlinedTextField(
                value = text,
                onValueChange = { text = it },
                label = { Text("Name") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = NeonColors.OnSurface,
                    unfocusedTextColor = NeonColors.OnSurface,
                    cursorColor = NeonColors.ElectricViolet,
                    focusedBorderColor = NeonColors.ElectricViolet,
                    unfocusedBorderColor = NeonColors.Outline.copy(alpha = 0.3f)
                )
            )
        },
        confirmButton = {
            TextButton(onClick = { onConfirm(text); text = "" }, enabled = text.isNotBlank()) {
                Text(buttonLabel, color = NeonColors.ElectricViolet)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = NeonColors.OnSurfaceVariant)
            }
        },
        containerColor = NeonColors.SurfaceDark
    )
}

@Composable
private fun SeriesCard(
    series: TVSeriesDto,
    isSelected: Boolean,
    isSaved: Boolean,
    onSelect: () -> Unit,
    onToggleSave: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable(onClick = onSelect),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = when {
                isSelected -> NeonColors.ElectricVioletContainer.copy(alpha = 0.2f)
                else -> NeonColors.SurfaceContainer
            }
        ),
        border = CardDefaults.outlinedCardBorder()?.let { border ->
            border.copy(
                width = if (isSelected) 2.dp else 1.dp,
                brush = androidx.compose.ui.graphics.SolidColor(
                    if (isSelected) NeonColors.ElectricViolet.copy(alpha = 0.5f)
                    else NeonColors.OutlineVariant.copy(alpha = 0.2f)
                )
            )
        }
    ) {
        Box {
            Column(
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(modifier = Modifier.size(42.dp).clip(CircleShape).background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)), contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.Tv, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.height(4.dp))
                Text(series.name, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Medium, color = NeonColors.OnSurface, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(series.channel, style = MaterialTheme.typography.labelSmall, color = NeonColors.OnSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }

            IconButton(
                onClick = onToggleSave,
                modifier = Modifier.align(Alignment.TopEnd).size(24.dp)
            ) {
                Icon(
                    imageVector = if (isSaved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                    contentDescription = if (isSaved) "Unsave" else "Save",
                    tint = if (isSaved) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant.copy(alpha = 0.5f),
                    modifier = Modifier.size(14.dp)
                )
            }
        }
    }
}

@Composable
private fun SavedSeriesCard(
    series: TVSeriesDto,
    isSelected: Boolean,
    onSelect: () -> Unit,
    onUnsave: () -> Unit
) {
    Card(
        modifier = Modifier
            .width(110.dp)
            .clickable(onClick = onSelect),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) NeonColors.ElectricVioletContainer.copy(alpha = 0.2f) else NeonColors.SurfaceContainer.copy(alpha = 0.9f)
        ),
        border = CardDefaults.outlinedCardBorder()?.let { border ->
            border.copy(
                width = if (isSelected) 2.dp else 1.dp,
                brush = androidx.compose.ui.graphics.SolidColor(
                    if (isSelected) NeonColors.ElectricViolet.copy(alpha = 0.5f)
                    else NeonColors.NeonCyan.copy(alpha = 0.2f)
                )
            )
        }
    ) {
        Box {
            Column(
                modifier = Modifier.fillMaxWidth().padding(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)), contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.Tv, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(16.dp))
                }
                Spacer(Modifier.height(4.dp))
                Text(series.name, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Medium, color = NeonColors.OnSurface, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }

            IconButton(
                onClick = onUnsave,
                modifier = Modifier.align(Alignment.TopEnd).size(22.dp)
            ) {
                Icon(Icons.Filled.Bookmark, contentDescription = "Unsave", tint = NeonColors.ElectricViolet, modifier = Modifier.size(12.dp))
            }
        }
    }
}
