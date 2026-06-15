package com.playlist.app.ui.tvseries

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.text.style.TextAlign
import com.playlist.app.ui.components.VideoResultsGrid
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TVSeriesScreen(
    onNavigateToPlayer: () -> Unit,
    onNavigateBack: () -> Unit = {},
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
        var nameText by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { viewModel.dismissNameDialog() },
            shape = RoundedCornerShape(20.dp),
            containerColor = NeonColors.SurfaceDark,
            title = {
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Surface(shape = RoundedCornerShape(16.dp), color = NeonColors.ElectricVioletContainer.copy(alpha = 0.25f), modifier = Modifier.size(56.dp)) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Icon(Icons.Filled.PlaylistAdd, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(28.dp))
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text("Save as Playlist", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = NeonColors.OnSurface, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(4.dp))
                    Text("Save these episodes as a playlist to access them later", style = MaterialTheme.typography.bodySmall, color = NeonColors.OnSurfaceVariant, textAlign = TextAlign.Center)
                }
            },
            text = {
                OutlinedTextField(value = nameText, onValueChange = { nameText = it },
                    label = { Text("Name") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = NeonColors.OnSurface, unfocusedTextColor = NeonColors.OnSurface, cursorColor = NeonColors.ElectricViolet, focusedBorderColor = NeonColors.ElectricViolet, unfocusedBorderColor = NeonColors.Outline.copy(alpha = 0.3f), unfocusedContainerColor = NeonColors.SurfaceContainer, focusedContainerColor = NeonColors.SurfaceContainer),
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(onClick = { viewModel.saveAsPlaylist(nameText); viewModel.dismissNameDialog() }, enabled = nameText.isNotBlank(), colors = ButtonDefaults.buttonColors(containerColor = NeonColors.ElectricViolet, contentColor = NeonColors.DeepObsidian), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp)) {
                    Text("Save", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissNameDialog() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Cancel", color = NeonColors.OnSurfaceVariant, fontWeight = FontWeight.Medium)
                }
            }
        )
    }

    // Download confirmation dialog
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

    // Download progress dialog
    if (uiState.showDownloadProgress) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Downloading...", color = NeonColors.OnSurface, style = MaterialTheme.typography.titleSmall) },
            text = {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    CircularProgressIndicator(
                        color = NeonColors.ElectricViolet,
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(Modifier.height(16.dp))
                    Text(
                        text = uiState.downloadProgressMessage,
                        color = NeonColors.OnSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                    if (uiState.downloadProgressTotal > 0) {
                        Spacer(Modifier.height(8.dp))
                        LinearProgressIndicator(
                            progress = {
                                if (uiState.downloadProgressTotal > 0)
                                    uiState.downloadProgressCompleted.toFloat() / uiState.downloadProgressTotal.toFloat()
                                else 0f
                            },
                            modifier = Modifier.fillMaxWidth(),
                            color = NeonColors.ElectricViolet,
                            trackColor = NeonColors.SurfaceContainer
                        )
                    }
                }
            },
            confirmButton = {},
            containerColor = NeonColors.SurfaceDark
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Saved TV Series", color = NeonColors.OnSurface, style = MaterialTheme.typography.titleMedium) },
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
        if (uiState.hasGenerated && uiState.generatedVideos.isNotEmpty()) {
            // ── Show generated episodes with selection mode ──
            Column(modifier = Modifier.fillMaxSize().padding(top = padding.calculateTopPadding())) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${uiState.generatedVideos.size} episodes from ${uiState.selectedSeriesName ?: "selected series"}",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurface
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        OutlinedButton(
                            onClick = {
                                viewModel.clearGenerated()
                                viewModel.loadSavedSeries()
                            },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = NeonColors.OnSurfaceVariant),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Filled.ArrowBack, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(Modifier.width(3.dp))
                            Text("Back to Series", style = MaterialTheme.typography.labelSmall)
                        }
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
                    onSaveToMySongs = { viewModel.saveSelectedToMySongs() },
                    onSaveAsPlaylist = { viewModel.showSavePlaylistDialog() },
                    onClearSelection = { viewModel.clearVideoSelection() }
                )
            }
        } else {
            // ── Saved series list ──
            val tvScrollState = rememberLazyListState()
            Box(Modifier.fillMaxSize().padding(top = padding.calculateTopPadding())) {
                LazyColumn(
                    state = tvScrollState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                if (uiState.isLoading || uiState.isLoadingSaved) {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = NeonColors.ElectricViolet)
                        }
                    }
                } else if (uiState.savedSeries.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(top = 32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(
                                    imageVector = Icons.Filled.Tv,
                                    contentDescription = null,
                                    tint = NeonColors.OnSurfaceVariant.copy(alpha = 0.4f),
                                    modifier = Modifier.size(48.dp)
                                )
                                Spacer(Modifier.height(12.dp))
                                Text(
                                    text = "No saved TV series",
                                    style = MaterialTheme.typography.titleSmall,
                                    fontWeight = FontWeight.SemiBold,
                                    color = NeonColors.OnSurface
                                )
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    text = "Browse TV series on the Home page and save your favorites",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = NeonColors.OnSurfaceVariant,
                                    modifier = Modifier.padding(horizontal = 32.dp),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                            }
                        }
                    }
                } else {
                    // Saved series section
                    item {
                        Text(
                            text = "Saved (${uiState.savedSeries.size})",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = NeonColors.OnSurface,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp)
                        )
                    }

                    // Grid layout
                    val gridItems = uiState.savedSeries.chunked(3)
                    items(gridItems.size) { rowIndex ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            gridItems[rowIndex].forEach { series ->
                                SeriesCard(
                                    series = series,
                                    isSelected = uiState.selectedSeriesId == series.id,
                                    isSaved = true,
                                    onSelect = { viewModel.selectSeries(series.id, series.name) },
                                    onToggleSave = { viewModel.toggleSavedSeries(series) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    // Generate button when series selected
                    val hasSelection = uiState.selectedSeriesId != null
                    if (hasSelection) {
                        item {
                            Spacer(Modifier.height(8.dp))
                            Text(
                                text = "Selected: ${uiState.selectedSeriesName}",
                                color = NeonColors.ElectricViolet,
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 4.dp)
                            )
                        }
                        if (uiState.isGenerating) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(color = NeonColors.ElectricViolet, modifier = Modifier.size(28.dp))
                                }
                            }
                        } else {
                            item {
                                Button(
                                    onClick = { viewModel.generatePlaylist(null) },
                                    colors = ButtonDefaults.buttonColors(containerColor = NeonColors.ElectricViolet, contentColor = NeonColors.DeepObsidian),
                                    shape = RoundedCornerShape(10.dp),
                                    modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 4.dp)
                                ) {
                                    Icon(Icons.Filled.Tv, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text("Generate Episodes", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                        uiState.error?.let { error ->
                            item {
                                Text(error, color = NeonColors.ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                            }
                        }
                    }
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
