package com.playlist.app.ui.songs

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.MergeType
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SongsScreen(
    onNavigateToPlayer: () -> Unit = {},
    viewModel: SongsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val filteredSongs = viewModel.getFilteredSongs()
    val singers = viewModel.getUniqueSingers()
    val selectedCount = uiState.selectedIds.size

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "My Songs",
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
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = NeonColors.ElectricViolet)
                }
            } else if (uiState.songs.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No saved songs yet.",
                        style = MaterialTheme.typography.bodyLarge,
                        color = NeonColors.OnSurfaceVariant
                    )
                }
            } else {
                // Singer filter chips
                if (singers.isNotEmpty()) {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.padding(vertical = 8.dp)
                    ) {
                        item {
                            FilterChip(
                                selected = uiState.singerFilter == null,
                                onClick = { viewModel.setSingerFilter(null) },
                                label = {
                                    Text(
                                        text = "All",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (uiState.singerFilter == null) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainer,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                                )
                            )
                        }
                        items(singers) { name ->
                            val count = uiState.songs.count { it.singerName == name }
                            FilterChip(
                                selected = uiState.singerFilter == name,
                                onClick = { viewModel.setSingerFilter(if (uiState.singerFilter == name) null else name) },
                                label = {
                                    Text(
                                        text = "$name ($count)",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (uiState.singerFilter == name) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainer,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                                )
                            )
                        }
                    }
                }

                // Action bar (select all, play, merge)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${filteredSongs.size} songs",
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurfaceVariant
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        if (selectedCount > 0) {
                            TextButton(onClick = {
                                if (selectedCount == filteredSongs.size) viewModel.deselectAll()
                                else viewModel.selectAll()
                            }) {
                                Text(
                                    text = if (selectedCount == filteredSongs.size) "Deselect all" else "Select all",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = NeonColors.ElectricViolet
                                )
                            }
                        }
                    }
                }

                // Bulk action buttons
                if (selectedCount >= 2) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                viewModel.playSelected()
                                onNavigateToPlayer()
                            },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = NeonColors.NeonCyan
                            )
                        ) {
                            Icon(
                                Icons.Filled.PlayArrow,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(4.dp))
                            Text("Play $selectedCount", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }

                // Song list
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(filteredSongs) { song ->
                        SavedSongCard(
                            title = song.title,
                            channelTitle = song.channelTitle,
                            singerName = song.singerName,
                            isSelected = uiState.selectedIds.contains(song.id),
                            onToggleSelect = { viewModel.toggleSelection(song.id) },
                            onDelete = { viewModel.deleteSong(song.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SavedSongCard(
    title: String,
    channelTitle: String,
    singerName: String?,
    isSelected: Boolean,
    onToggleSelect: () -> Unit,
    onDelete: () -> Unit
) {
    val bgColor = if (isSelected) {
        NeonColors.ElectricVioletContainer.copy(alpha = 0.2f)
    } else {
        NeonColors.SurfaceContainer
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(bgColor)
            .clickable(onClick = onToggleSelect)
            .padding(start = 8.dp, end = 4.dp, top = 8.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Checkbox
        Icon(
            imageVector = if (isSelected) Icons.Filled.CheckCircle else Icons.Filled.MusicNote,
            contentDescription = if (isSelected) "Selected" else "Not selected",
            tint = if (isSelected) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant.copy(alpha = 0.5f),
            modifier = Modifier
                .size(24.dp)
                .padding(end = 8.dp)
        )

        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = NeonColors.OnSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = channelTitle,
                style = MaterialTheme.typography.labelSmall,
                color = NeonColors.OnSurfaceVariant
            )
            singerName?.let {
                Text(
                    text = it,
                    style = MaterialTheme.typography.labelSmall,
                    color = NeonColors.ElectricViolet
                )
            }
        }
        IconButton(onClick = onDelete) {
            Icon(
                imageVector = Icons.Filled.Delete,
                contentDescription = "Remove song",
                tint = NeonColors.ErrorRed.copy(alpha = 0.7f),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}
