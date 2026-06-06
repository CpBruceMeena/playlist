package com.playlist.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
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

    // When videos are generated, update player state and navigate
    LaunchedEffect(uiState.generatedVideos) {
        if (uiState.generatedVideos.isNotEmpty()) {
            PlayerState.setQueue(uiState.generatedVideos)
            onNavigateToPlayer()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Playlist",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = NeonColors.ElectricViolet
                    )
                },
                actions = {
                    IconButton(onClick = {}) {
                        Icon(
                            imageVector = Icons.Filled.Person,
                            contentDescription = "Profile",
                            tint = NeonColors.OnSurface
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = NeonColors.DeepObsidian
                )
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
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

            // Filter Panel
            item {
                Spacer(modifier = Modifier.height(4.dp))
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
                Spacer(modifier = Modifier.height(4.dp))
            }

            // Generate button
            item {
                if (uiState.isGenerating) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            color = NeonColors.ElectricViolet,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                } else {
                    NeonButton(
                        text = "Generate Playlist",
                        onClick = { viewModel.generatePlaylist() }
                    )
                }
            }

            // Error
            uiState.error?.let { error ->
                item {
                    Text(
                        text = error,
                        color = NeonColors.ErrorRed,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }
            }

            // Featured Singers section
            item {
                Text(
                    text = "Featured Singers",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = NeonColors.OnSurface,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                )
            }

            item {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.featuredSingers) { singer ->
                        FeaturedSingerItem(name = singer)
                    }
                }
            }

            // Recommended section
            item {
                Text(
                    text = "Recommended for You",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = NeonColors.OnSurface,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
                )
            }

            // Placeholder recommended items
            items(4) { index ->
                GlassCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Search for music to get started",
                        style = MaterialTheme.typography.bodyMedium,
                        color = NeonColors.OnSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun FeaturedSingerItem(name: String) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(72.dp)
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .then(
                    Modifier
                        .clip(CircleShape)
                        .background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f))
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = name.take(2).uppercase(),
                style = MaterialTheme.typography.titleSmall,
                color = NeonColors.ElectricViolet,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = name,
            style = MaterialTheme.typography.labelSmall,
            color = NeonColors.OnSurface,
            maxLines = 1
        )
    }
}
