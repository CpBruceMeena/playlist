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
import com.playlist.app.ui.components.*
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToPlayer: () -> Unit,
    onNavigateToSingers: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.generatedVideos) {
        if (uiState.generatedVideos.isNotEmpty()) {
            PlayerState.setQueue(uiState.generatedVideos)
            onNavigateToPlayer()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Playlist", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = NeonColors.ElectricViolet) },
                actions = {
                    IconButton(onClick = onNavigateToSingers) {
                        Icon(Icons.Filled.Person, contentDescription = "Singers", tint = NeonColors.OnSurface)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NeonColors.DeepObsidian)
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(bottom = 16.dp)
        ) {
            // Search bar + singer button
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SearchBar(
                        query = uiState.searchQuery,
                        onQueryChange = { viewModel.onSearchQueryChange(it) },
                        onSearch = { viewModel.generatePlaylist() },
                        placeholder = "Search songs, artists...",
                        modifier = Modifier.weight(1f)
                    )
                    FilledIconButton(
                        onClick = onNavigateToSingers,
                        modifier = Modifier.size(48.dp),
                        colors = IconButtonDefaults.filledIconButtonColors(containerColor = NeonColors.ElectricViolet)
                    ) {
                        Icon(Icons.Filled.MusicNote, contentDescription = "Singers", tint = NeonColors.DeepObsidian)
                    }
                }
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
                        CircularProgressIndicator(color = NeonColors.ElectricViolet, modifier = Modifier.size(32.dp))
                    }
                } else {
                    NeonButton(text = "Generate Playlist", onClick = { viewModel.generatePlaylist() }, modifier = Modifier.padding(vertical = 8.dp))
                }
            }

            // Error
            uiState.error?.let { error ->
                item {
                    Text(error, color = NeonColors.ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
                }
            }

            // Quick actions row
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AssistChip(
                        onClick = onNavigateToSingers,
                        label = { Text("Singers", style = MaterialTheme.typography.labelSmall) },
                        leadingIcon = { Icon(Icons.Filled.MusicNote, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        colors = AssistChipDefaults.assistChipColors(containerColor = NeonColors.SurfaceContainer)
                    )
                    AssistChip(
                        onClick = { },
                        label = { Text("TV Series", style = MaterialTheme.typography.labelSmall) },
                        leadingIcon = { Icon(Icons.Filled.Tv, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        colors = AssistChipDefaults.assistChipColors(containerColor = NeonColors.SurfaceContainer)
                    )
                }
            }

            // Featured section
            item {
                Text("Featured Singers", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = NeonColors.OnSurface,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp))
            }

            item {
                LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(uiState.featuredSingers) { name ->
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(72.dp)) {
                            Box(modifier = Modifier.size(60.dp).clip(CircleShape).background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)), contentAlignment = Alignment.Center) {
                                Text(name.take(2).uppercase(), style = MaterialTheme.typography.titleSmall, color = NeonColors.ElectricViolet, fontWeight = FontWeight.Bold)
                            }
                            Spacer(Modifier.height(6.dp))
                            Text(name, style = MaterialTheme.typography.labelSmall, color = NeonColors.OnSurface, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}
