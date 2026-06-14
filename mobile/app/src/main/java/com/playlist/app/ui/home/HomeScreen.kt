package com.playlist.app.ui.home

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.playlist.app.ui.components.FilterPanel
import com.playlist.app.ui.components.NeonButton
import com.playlist.app.ui.components.SearchBar
import com.playlist.app.ui.components.VideoResultsGrid
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToPlayer: () -> Unit,
    onNavigateToSingers: () -> Unit,
    onNavigateToTVSeries: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    // Navigate when user taps Play
    LaunchedEffect(uiState.navigateToPlayer) {
        if (uiState.navigateToPlayer) {
            onNavigateToPlayer()
            viewModel.onNavigatedToPlayer()
        }
    }

    // Save as Playlist dialog
    if (uiState.showNameDialog) {
        var nameText by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { viewModel.dismissNameDialog() },
            title = { Text("Save as Playlist", color = NeonColors.OnSurface) },
            text = {
                OutlinedTextField(
                    value = nameText,
                    onValueChange = { nameText = it },
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
                TextButton(onClick = { viewModel.saveAsPlaylist(nameText); nameText = "" }, enabled = nameText.isNotBlank()) {
                    Text("Save", color = NeonColors.ElectricViolet)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissNameDialog() }) {
                    Text("Cancel", color = NeonColors.OnSurfaceVariant)
                }
            },
            containerColor = NeonColors.SurfaceDark
        )
    }

    // Download dialog
    if (uiState.showDownloadDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.dismissDownloadDialog() },
            title = { Text("Download Videos", color = NeonColors.OnSurface, style = MaterialTheme.typography.titleSmall) },
            text = {
                Text(
                    "Download ${uiState.videoIdsToDownload.size} selected video(s)?",
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
                title = { Text("Playlist", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = NeonColors.ElectricViolet) },
                actions = {
                    FilledIconButton(
                        onClick = onNavigateToSingers,
                        modifier = Modifier.size(36.dp).padding(end = 8.dp),
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f))
                    ) {
                        Icon(Icons.Filled.MusicNote, contentDescription = "Singers", tint = NeonColors.ElectricViolet, modifier = Modifier.size(18.dp))
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NeonColors.DeepObsidian)
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        // ── If videos generated, show results grid instead ──
        if (uiState.hasGenerated && uiState.generatedVideos.isNotEmpty()) {
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                // Header with back + count
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { viewModel.clearGenerated() }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = NeonColors.OnSurface, modifier = Modifier.size(20.dp))
                    }
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "${uiState.generatedVideos.size} results",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurface
                    )
                    Spacer(Modifier.weight(1f))
                    Text(
                        text = "\"${uiState.searchQuery}\"",
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurfaceVariant,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )
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
            return@Scaffold
        }

        // ── Main home content ──
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            // Search bar
            item {
                SearchBar(
                    query = uiState.searchQuery,
                    onQueryChange = { viewModel.onSearchQueryChange(it) },
                    onSearch = { viewModel.generatePlaylist() },
                    placeholder = "Search songs, artists..."
                )
            }

            // Filter panel
            item {
                FilterPanel(
                    expanded = uiState.filterExpanded,
                    videoTypes = uiState.videoTypes,
                    selectedDurationPresets = uiState.selectedDurationPresets,
                    uploadDateType = uiState.uploadDateType,
                    minViews = uiState.minViews,
                    maxResults = uiState.maxResults,
                    safeSearch = uiState.safeSearch,
                    includeKeywords = uiState.includeKeywords,
                    excludeKeywords = uiState.excludeKeywords,
                    activeFilterCount = viewModel.getActiveFilterCount(),
                    onToggleExpanded = { viewModel.toggleFilterExpanded() },
                    onToggleVideoType = { viewModel.toggleVideoType(it) },
                    onToggleDurationPreset = { viewModel.toggleDurationPreset(it) },
                    onSetDurationCustom = { min, max -> viewModel.setDurationRange(min, max) },
                    onSetUploadDate = { viewModel.setUploadDate(it) },
                    onSetMinViews = { viewModel.setMinViews(it) },
                    onSetMaxResults = { viewModel.setMaxResults(it) },
                    onSetSafeSearch = { viewModel.setSafeSearch(it) },
                    onAddIncludeKeyword = { viewModel.addIncludeKeyword(it) },
                    onRemoveIncludeKeyword = { viewModel.removeIncludeKeyword(it) },
                    onAddExcludeKeyword = { viewModel.addExcludeKeyword(it) },
                    onRemoveExcludeKeyword = { viewModel.removeExcludeKeyword(it) },
                    onResetFilters = { viewModel.resetFilters() }
                )
            }

            // Generate button
            item {
                if (uiState.isGenerating) {
                    Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = NeonColors.ElectricViolet, modifier = Modifier.size(28.dp))
                    }
                } else {
                    Button(
                        onClick = { viewModel.generatePlaylist() },
                        colors = ButtonDefaults.buttonColors(containerColor = NeonColors.ElectricViolet, contentColor = NeonColors.DeepObsidian),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Filled.Search, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Generate", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                    }
                }
            }

            // Error
            uiState.error?.let { error ->
                item {
                    Text(error, color = NeonColors.ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp))
                }
            }

            // Quick actions
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AssistChip(
                        onClick = onNavigateToSingers,
                        label = { Text("Singers", style = MaterialTheme.typography.labelSmall) },
                        leadingIcon = { Icon(Icons.Filled.Person, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        colors = AssistChipDefaults.assistChipColors(containerColor = NeonColors.SurfaceContainer)
                    )
                    AssistChip(
                        onClick = onNavigateToTVSeries,
                        label = { Text("TV Series", style = MaterialTheme.typography.labelSmall) },
                        leadingIcon = { Icon(Icons.Filled.Tv, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        colors = AssistChipDefaults.assistChipColors(containerColor = NeonColors.SurfaceContainer)
                    )
                }
            }

            // Featured singers
            if (uiState.featuredSingers.isNotEmpty()) {
                item {
                    Text(
                        "Featured",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurface,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                    )
                }
                item {
                    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(uiState.featuredSingers) { name ->
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(64.dp)) {
                                Box(modifier = Modifier.size(52.dp).clip(CircleShape).background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)), contentAlignment = Alignment.Center) {
                                    Text(name.take(2).uppercase(), style = MaterialTheme.typography.titleSmall, color = NeonColors.ElectricViolet, fontWeight = FontWeight.Bold)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(name, style = MaterialTheme.typography.labelSmall, color = NeonColors.OnSurface, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                            }
                        }
                    }
                }
            }
        }
    }
}
