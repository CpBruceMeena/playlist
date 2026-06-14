package com.playlist.app.ui.tvseries

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.playlist.app.data.api.models.TVSeriesDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.ui.components.NeonButton
import com.playlist.app.ui.components.SearchBar
import com.playlist.app.ui.components.SnackbarManager
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TVSeriesScreen(
    onNavigateToPlayer: () -> Unit,
    viewModel: TVSeriesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var nameDialogText by remember { mutableStateOf("") }

    // Auto-navigate to player when videos are generated
    LaunchedEffect(uiState.generatedVideos) {
        if (uiState.generatedVideos.isNotEmpty()) {
            PlayerState.setQueue(uiState.generatedVideos)
            onNavigateToPlayer()
        }
    }

    // Name dialog for save-as-playlist / merge
    if (uiState.showNameDialog) {
        val title = when (uiState.nameDialogType) {
            NameDialogType.SavePlaylist -> "Save as Playlist"
            NameDialogType.Merge -> "Merge Videos"
        }
        val buttonLabel = when (uiState.nameDialogType) {
            NameDialogType.SavePlaylist -> "Save"
            NameDialogType.Merge -> "Merge"
        }

        AlertDialog(
            onDismissRequest = { viewModel.dismissNameDialog(); nameDialogText = "" },
            title = { Text(title, color = NeonColors.OnSurface) },
            text = {
                OutlinedTextField(
                    value = nameDialogText,
                    onValueChange = { nameDialogText = it },
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
                TextButton(
                    onClick = {
                        when (uiState.nameDialogType) {
                            NameDialogType.SavePlaylist -> viewModel.saveAsPlaylist(nameDialogText)
                            NameDialogType.Merge -> viewModel.mergeVideos(nameDialogText)
                        }
                        nameDialogText = ""
                    },
                    enabled = nameDialogText.isNotBlank()
                ) {
                    Text(buttonLabel, color = NeonColors.ElectricViolet)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissNameDialog(); nameDialogText = "" }) {
                    Text("Cancel", color = NeonColors.OnSurfaceVariant)
                }
            },
            containerColor = NeonColors.SurfaceDark
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("TV Series", color = NeonColors.OnSurface, style = MaterialTheme.typography.titleLarge) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NeonColors.DeepObsidian)
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            // Search
            item {
                SearchBar(
                    query = uiState.searchQuery,
                    onQueryChange = { viewModel.onSearchQueryChange(it) },
                    onSearch = {},
                    placeholder = "Search TV series by name or channel..."
                )
            }

            // Channel filter chips
            if (uiState.channels.isNotEmpty()) {
                item {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        item {
                            FilterChip(
                                selected = uiState.channelFilter == null,
                                onClick = { viewModel.onChannelSelect(null) },
                                label = { Text("All", style = MaterialTheme.typography.labelSmall, color = if (uiState.channelFilter == null) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant) },
                                colors = FilterChipDefaults.filterChipColors(containerColor = NeonColors.SurfaceContainer, selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f))
                            )
                        }
                        items(uiState.channels) { ch ->
                            FilterChip(
                                selected = uiState.channelFilter == ch,
                                onClick = { viewModel.onChannelSelect(if (uiState.channelFilter == ch) null else ch) },
                                label = { Text(ch, style = MaterialTheme.typography.labelSmall, color = if (uiState.channelFilter == ch) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant) },
                                colors = FilterChipDefaults.filterChipColors(containerColor = NeonColors.SurfaceContainer, selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f))
                            )
                        }
                    }
                }
            }

            // Generation progress
            if (uiState.isGenerating) {
                item {
                    Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = NeonColors.ElectricViolet, modifier = Modifier.size(32.dp))
                    }
                }
            }

            // Selection + action buttons
            val hasSelection = uiState.selectedSeriesId != null || uiState.customSeriesName.isNotBlank()
            if (hasSelection) {
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Selected: ${uiState.selectedSeriesName ?: uiState.customSeriesName}",
                            color = NeonColors.ElectricViolet,
                            style = MaterialTheme.typography.labelMedium
                        )
                        TextButton(onClick = { viewModel.clearSelection() }) {
                            Text("Clear", color = NeonColors.OnSurfaceVariant, style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }

                if (!uiState.isGenerating) {
                    item {
                        NeonButton(
                            text = "Generate Episodes",
                            onClick = { viewModel.generatePlaylist(null) }
                        )
                    }
                }

                // Save-as-playlist and merge buttons (after generation)
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.showSavePlaylistDialog() },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonColors.ElectricViolet),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Outlined.PlaylistAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Save as Playlist", style = MaterialTheme.typography.labelSmall)
                        }
                        OutlinedButton(
                            onClick = { viewModel.showMergeDialog() },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonColors.NeonCyan),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Filled.Merge, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Merge", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }

            // Error
            uiState.error?.let { error ->
                item {
                    Text(error, color = NeonColors.ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
                }
            }

            // Saved series section
            if (uiState.savedSeries.isNotEmpty()) {
                item {
                    Text(
                        text = "Saved Series (${uiState.savedSeries.size})",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurface,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
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

            // Series grid header
            item {
                Text(
                    text = "All Series",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.SemiBold,
                    color = NeonColors.OnSurface,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
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
                    Text(
                        text = "No TV series found",
                        color = NeonColors.OnSurfaceVariant,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 24.dp)
                    )
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
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }
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
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = when {
                isSelected -> NeonColors.ElectricVioletContainer.copy(alpha = 0.2f)
                isSaved -> NeonColors.SurfaceContainer.copy(alpha = 0.9f)
                else -> NeonColors.SurfaceContainer
            }
        ),
        border = CardDefaults.outlinedCardBorder()?.let { border ->
            border.copy(
                width = if (isSelected) 2.dp else 1.dp,
                brush = androidx.compose.ui.graphics.SolidColor(
                    if (isSelected) NeonColors.ElectricViolet.copy(alpha = 0.5f)
                    else if (isSaved) NeonColors.NeonCyan.copy(alpha = 0.3f)
                    else NeonColors.OutlineVariant.copy(alpha = 0.2f)
                )
            )
        }
    ) {
        Box {
            Column(
                modifier = Modifier.fillMaxWidth().padding(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)), contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.Tv, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(22.dp))
                    if (isSelected) {
                        Icon(Icons.Filled.Check, contentDescription = null, tint = NeonColors.NeonCyan, modifier = Modifier.size(14.dp).align(Alignment.BottomEnd))
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(series.name, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium, color = NeonColors.OnSurface, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(series.channel, style = MaterialTheme.typography.labelSmall, color = NeonColors.OnSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }

            // Bookmark button
            IconButton(
                onClick = onToggleSave,
                modifier = Modifier.align(Alignment.TopEnd).size(28.dp)
            ) {
                Icon(
                    imageVector = if (isSaved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                    contentDescription = if (isSaved) "Unsave" else "Save",
                    tint = if (isSaved) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant.copy(alpha = 0.5f),
                    modifier = Modifier.size(16.dp)
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
            .width(120.dp)
            .clickable(onClick = onSelect),
        shape = RoundedCornerShape(12.dp),
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
                modifier = Modifier.fillMaxWidth().padding(10.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(modifier = Modifier.size(40.dp).clip(CircleShape).background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)), contentAlignment = Alignment.Center) {
                    Icon(Icons.Filled.Tv, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(18.dp))
                }
                Spacer(Modifier.height(4.dp))
                Text(series.name, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Medium, color = NeonColors.OnSurface, maxLines = 2, overflow = TextOverflow.Ellipsis)
            }

            IconButton(
                onClick = onUnsave,
                modifier = Modifier.align(Alignment.TopEnd).size(24.dp)
            ) {
                Icon(Icons.Filled.Bookmark, contentDescription = "Unsave", tint = NeonColors.ElectricViolet, modifier = Modifier.size(14.dp))
            }
        }
    }
}
