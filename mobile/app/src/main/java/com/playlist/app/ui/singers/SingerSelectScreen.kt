package com.playlist.app.ui.singers

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.playlist.app.ui.components.SearchBar
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SingerSelectScreen(
    onNavigateToPlayer: () -> Unit,
    viewModel: SingerViewModel = hiltViewModel()
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
                title = {
                    Text(
                        text = "Singers",
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
            // Search
            SearchBar(
                query = uiState.searchQuery,
                onQueryChange = { viewModel.onSearchQueryChange(it) },
                onSearch = {},
                placeholder = "Search singers..."
            )

            // Genre filter chips
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(vertical = 8.dp)
            ) {
                items(uiState.genres) { genre ->
                    FilterChip(
                        selected = uiState.selectedGenre == genre,
                        onClick = {
                            viewModel.onGenreSelect(
                                if (uiState.selectedGenre == genre) null else genre
                            )
                        },
                        label = {
                            Text(
                                text = genre,
                                style = MaterialTheme.typography.labelMedium,
                                color = if (uiState.selectedGenre == genre)
                                    NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            containerColor = NeonColors.SurfaceContainer,
                            selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                        )
                    )
                }
            }

            // Selected count and generate
            if (uiState.selectedSingerIds.isNotEmpty() || uiState.customSingerNames.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${uiState.selectedSingerIds.size + uiState.customSingerNames.size} selected (min 2, max 5)",
                        style = MaterialTheme.typography.labelMedium,
                        color = NeonColors.ElectricViolet
                    )
                }
            }

            // Custom singer chips
            if (uiState.customSingerNames.isNotEmpty()) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.customSingerNames) { name ->
                        AssistChip(
                            onClick = {},
                            label = { Text(name, style = MaterialTheme.typography.labelSmall) },
                            trailingIcon = {
                                Icon(
                                    Icons.Filled.Close,
                                    contentDescription = "Remove",
                                    modifier = Modifier.clickable {
                                        viewModel.removeCustomSinger(name)
                                    }
                                )
                            }
                        )
                    }
                }
            }

            // Generate button
            if (uiState.selectedSingerIds.size + uiState.customSingerNames.size >= 2) {
                if (uiState.isGenerating) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            color = NeonColors.ElectricViolet,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                } else {
                    com.playlist.app.ui.components.NeonButton(
                        text = "Generate with Selected Singers",
                        onClick = { viewModel.generateMultiSinger() }
                    )
                }
            }

            // Error
            uiState.error?.let { error ->
                Text(
                    text = error,
                    color = NeonColors.ErrorRed,
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                )
            }

            // Singer list
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(uiState.filteredSingers) { singer ->
                    SingerItem(
                        name = singer.name,
                        genre = singer.genre,
                        thumbnailUrl = singer.thumbnailUrl,
                        isSelected = uiState.selectedSingerIds.contains(singer.id),
                        canSelect = uiState.selectedSingerIds.size < 5,
                        onClick = { viewModel.toggleSinger(singer.id) }
                    )
                }
            }
        }
    }
}

@Composable
private fun SingerItem(
    name: String,
    genre: String,
    thumbnailUrl: String?,
    isSelected: Boolean,
    canSelect: Boolean,
    onClick: () -> Unit
) {
    val bgColor = if (isSelected) {
        NeonColors.ElectricVioletContainer.copy(alpha = 0.2f)
    } else {
        NeonColors.SurfaceContainer
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .clickable(enabled = canSelect || isSelected, onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)),
            contentAlignment = Alignment.Center
        ) {
            if (thumbnailUrl != null) {
                AsyncImage(
                    model = thumbnailUrl,
                    contentDescription = name,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Text(
                    text = name.take(2).uppercase(),
                    style = MaterialTheme.typography.titleSmall,
                    color = NeonColors.ElectricViolet
                )
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = name,
                style = MaterialTheme.typography.bodyLarge,
                color = NeonColors.OnSurface,
                fontWeight = FontWeight.Medium
            )
            Text(
                text = genre,
                style = MaterialTheme.typography.labelSmall,
                color = NeonColors.OnSurfaceVariant
            )
        }

        if (isSelected) {
            Icon(
                imageVector = Icons.Filled.Check,
                contentDescription = "Selected",
                tint = NeonColors.ElectricViolet
            )
        }
    }
}
