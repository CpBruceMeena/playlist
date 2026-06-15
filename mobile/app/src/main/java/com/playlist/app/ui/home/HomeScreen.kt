package com.playlist.app.ui.home

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.playlist.app.data.api.models.SingerDto
import com.playlist.app.data.api.models.TVSeriesDto
import com.playlist.app.ui.components.FilterPanel
import com.playlist.app.ui.components.SearchBar
import com.playlist.app.ui.components.VideoResultsGrid
import com.playlist.app.ui.theme.NeonColors
import androidx.compose.ui.text.style.TextAlign
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToPlayer: () -> Unit,
    onNavigateToSingerSheet: () -> Unit = {},
    onNavigateToTVSeries: () -> Unit = {},
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

    // Save as Playlist dialog (improved UI)
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
                    Text("Give your playlist a name so you can find it later", style = MaterialTheme.typography.bodySmall, color = NeonColors.OnSurfaceVariant, textAlign = TextAlign.Center)
                }
            },
            text = {
                OutlinedTextField(
                    value = nameText, onValueChange = { nameText = it },
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
                title = { Text("Playlist", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = NeonColors.ElectricViolet) },
                actions = {
                    FilledIconButton(
                        onClick = onNavigateToSingerSheet,
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
            Column(modifier = Modifier.fillMaxSize().padding(top = padding.calculateTopPadding())) {
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
                    onSaveToMySongs = { viewModel.saveSelectedToMySongs() },
                    onSaveAsPlaylist = { viewModel.showSavePlaylistDialog() },
                    onClearSelection = { viewModel.clearVideoSelection() }
                )
            }
            return@Scaffold
        }

        // ── Main home content ──
        val homeScrollState = rememberLazyListState()
        Box(Modifier.fillMaxSize().padding(top = padding.calculateTopPadding())) {
            LazyColumn(
                state = homeScrollState,
                modifier = Modifier.fillMaxSize(),
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
                        onClick = { viewModel.showSingerSheet() },
                        label = { Text("Singers", style = MaterialTheme.typography.labelSmall) },
                        leadingIcon = { Icon(Icons.Filled.Person, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        colors = AssistChipDefaults.assistChipColors(containerColor = NeonColors.SurfaceContainer)
                    )
                    AssistChip(
                        onClick = { viewModel.showTVSheet() },
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

    // ── TV Series Bottom Sheet ─────────────────────────────────
    if (uiState.showTVSheet) {
        TVSeriesBottomSheet(
            series = uiState.tvFilteredSeries,
            channels = uiState.tvChannels,
            searchQuery = uiState.tvSearchQuery,
            channelFilter = uiState.tvChannelFilter,
            selectedSeriesId = uiState.tvSelectedSeriesId,
            savedSeriesIds = uiState.tvSavedSeriesIds,
            isLoading = uiState.tvIsLoading,
            onSearchQueryChange = { viewModel.onTVSearchQueryChange(it) },
            onChannelFilterSelect = { viewModel.onTVChannelFilterSelect(it) },
            onSeriesSelect = { id, name -> viewModel.onTVSeriesSelect(id, name) },
            onToggleSave = { id, name, channel -> viewModel.toggleTVSaveSeries(id, name, channel) },
            onGenerate = { viewModel.generateFromTVSeries() },
            onDismiss = { viewModel.hideTVSheet() }
        )
    }

    // ── Singer Bottom Sheet ────────────────────────────────────
    if (uiState.showSingerSheet) {
        SingerBottomSheet(
            singers = uiState.singerFilteredSingers,
            genres = uiState.singerGenres,
            searchQuery = uiState.singerSearchQuery,
            selectedGenre = uiState.singerSelectedGenre,
            selectedSingerIds = uiState.selectedSingerIds,
            isLoading = uiState.singerIsLoading,
            onSearchQueryChange = { viewModel.onSingerSearchQueryChange(it) },
            onGenreSelect = { viewModel.onSingerGenreSelect(it) },
            onToggleSelect = { viewModel.toggleSingerSelection(it) },
            onGenerate = { viewModel.generateFromSingers() },
            onDismiss = { viewModel.hideSingerSheet() }
        )
    }
}
}

// ── TV Series Bottom Sheet ─────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun TVSeriesBottomSheet(
    series: List<TVSeriesDto>,
    channels: List<String>,
    searchQuery: String,
    channelFilter: String?,
    selectedSeriesId: String?,
    savedSeriesIds: Set<String>,
    isLoading: Boolean,
    onSearchQueryChange: (String) -> Unit,
    onChannelFilterSelect: (String?) -> Unit,
    onSeriesSelect: (String, String) -> Unit,
    onToggleSave: (String, String, String) -> Unit,
    onGenerate: () -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = NeonColors.DeepObsidian
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp)) {
            // Header
            Text(
                text = "Browse TV Series",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = NeonColors.OnSurface,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            // Search
            SearchBar(
                query = searchQuery,
                onQueryChange = onSearchQueryChange,
                onSearch = {},
                placeholder = "Search TV series..."
            )

            if (isLoading) {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NeonColors.ElectricViolet)
                }
            } else {
                // Channel filter chips
                if (channels.isNotEmpty()) {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        item {
                            FilterChip(
                                selected = channelFilter == null,
                                onClick = { onChannelFilterSelect(null) },
                                label = { Text("All", style = MaterialTheme.typography.labelSmall) },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainer,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                                )
                            )
                        }
                        items(channels) { ch ->
                            FilterChip(
                                selected = channelFilter == ch,
                                onClick = { onChannelFilterSelect(if (channelFilter == ch) null else ch) },
                                label = { Text(ch, style = MaterialTheme.typography.labelSmall) },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainer,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                                )
                            )
                        }
                    }
                }

                // Series grid
                if (series.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = if (searchQuery.isNotBlank()) "No matches for \"$searchQuery\"" else "No series available",
                            style = MaterialTheme.typography.bodySmall,
                            color = NeonColors.OnSurfaceVariant
                        )
                    }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.heightIn(max = 400.dp)
                    ) {
                        items(series) { s ->
                            TVSeriesSheetItem(
                                series = s,
                                isSelected = selectedSeriesId == s.id,
                                isSaved = savedSeriesIds.contains(s.id),
                                onSelect = { onSeriesSelect(s.id, s.name) },
                                onToggleSave = { onToggleSave(s.id, s.name, s.channel) }
                            )
                        }
                    }
                }
            }

            // Generate button
            if (selectedSeriesId != null) {
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "Selected: ${series.find { it.id == selectedSeriesId }?.name ?: ""}",
                    style = MaterialTheme.typography.labelSmall,
                    color = NeonColors.ElectricViolet,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
                Button(
                    onClick = onGenerate,
                    colors = ButtonDefaults.buttonColors(containerColor = NeonColors.ElectricViolet, contentColor = NeonColors.DeepObsidian),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Icon(Icons.Filled.Tv, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Generate Episodes", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun TVSeriesSheetItem(
    series: TVSeriesDto,
    isSelected: Boolean,
    isSaved: Boolean,
    onSelect: () -> Unit,
    onToggleSave: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onSelect),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) NeonColors.ElectricVioletContainer.copy(alpha = 0.2f) else NeonColors.SurfaceContainer
        )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(40.dp).clip(CircleShape).background(
                    if (isSelected) NeonColors.ElectricVioletContainer.copy(alpha = 0.3f) else NeonColors.SurfaceContainer.copy(alpha = 0.5f)
                ),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Tv, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(18.dp))
            }
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(series.name, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium, color = NeonColors.OnSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(series.channel, style = MaterialTheme.typography.labelSmall, color = NeonColors.OnSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (isSelected) {
                Icon(Icons.Filled.CheckCircle, contentDescription = "Selected", tint = NeonColors.ElectricViolet, modifier = Modifier.size(20.dp))
            } else {
                IconButton(onClick = onToggleSave, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = if (isSaved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                        contentDescription = if (isSaved) "Unsave" else "Save",
                        tint = if (isSaved) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

// ── Singer Bottom Sheet ────────────────────────────────────────

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SingerBottomSheet(
    singers: List<SingerDto>,
    genres: List<String>,
    searchQuery: String,
    selectedGenre: String?,
    selectedSingerIds: Set<String>,
    isLoading: Boolean,
    onSearchQueryChange: (String) -> Unit,
    onGenreSelect: (String?) -> Unit,
    onToggleSelect: (String) -> Unit,
    onGenerate: () -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = NeonColors.DeepObsidian
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp)) {
            Text(
                text = "Select Singers",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = NeonColors.OnSurface,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            // Search
            SearchBar(
                query = searchQuery,
                onQueryChange = onSearchQueryChange,
                onSearch = {},
                placeholder = "Search singers..."
            )

            if (isLoading) {
                Box(modifier = Modifier.fillMaxWidth().height(200.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = NeonColors.ElectricViolet)
                }
            } else {
                // Genre chips
                if (genres.isNotEmpty()) {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(vertical = 4.dp)
                    ) {
                        item {
                            FilterChip(
                                selected = selectedGenre == null,
                                onClick = { onGenreSelect(null) },
                                label = { Text("All", style = MaterialTheme.typography.labelSmall) },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainer,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                                )
                            )
                        }
                        items(genres) { genre ->
                            FilterChip(
                                selected = selectedGenre == genre,
                                onClick = { onGenreSelect(if (selectedGenre == genre) null else genre) },
                                label = { Text(genre, style = MaterialTheme.typography.labelSmall) },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainer,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                                )
                            )
                        }
                    }
                }

                // Singer list
                if (singers.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = if (searchQuery.isNotBlank()) "No matches for \"$searchQuery\"" else "No singers available",
                            style = MaterialTheme.typography.bodySmall,
                            color = NeonColors.OnSurfaceVariant
                        )
                    }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.heightIn(max = 400.dp)
                    ) {
                        items(singers) { singer ->
                            SingerSheetItem(
                                singer = singer,
                                isSelected = selectedSingerIds.contains(singer.id),
                                onToggleSelect = { onToggleSelect(singer.id) }
                            )
                        }
                    }
                }
            }

            // Selection info + generate
            if (selectedSingerIds.isNotEmpty()) {
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "${selectedSingerIds.size} selected",
                    style = MaterialTheme.typography.labelSmall,
                    color = NeonColors.ElectricViolet,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
                Button(
                    onClick = onGenerate,
                    colors = ButtonDefaults.buttonColors(containerColor = NeonColors.ElectricViolet, contentColor = NeonColors.DeepObsidian),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    enabled = selectedSingerIds.size in 1..5
                ) {
                    Icon(Icons.Filled.Person, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Generate", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
private fun SingerSheetItem(
    singer: SingerDto,
    isSelected: Boolean,
    onToggleSelect: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(if (isSelected) NeonColors.ElectricVioletContainer.copy(alpha = 0.2f) else NeonColors.SurfaceContainer)
            .clickable(onClick = onToggleSelect)
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier.size(36.dp).clip(CircleShape).background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)),
            contentAlignment = Alignment.Center
        ) {
            Text(singer.name.take(2).uppercase(), style = MaterialTheme.typography.labelMedium, color = NeonColors.ElectricViolet, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(singer.name, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.Medium, color = NeonColors.OnSurface, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(singer.genre, style = MaterialTheme.typography.labelSmall, color = NeonColors.OnSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        if (isSelected) {
            Icon(Icons.Filled.CheckCircle, contentDescription = "Selected", tint = NeonColors.ElectricViolet, modifier = Modifier.size(18.dp))
        }
    }
}
