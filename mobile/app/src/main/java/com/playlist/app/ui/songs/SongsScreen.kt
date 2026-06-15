package com.playlist.app.ui.songs

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.MergeType
import androidx.compose.material.icons.outlined.PlaylistAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.playlist.app.ui.components.SnackbarManager
import com.playlist.app.ui.components.ToastType
import androidx.compose.ui.text.style.TextAlign
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SongsScreen(
    onNavigateToPlayer: () -> Unit = {},
    onNavigateBack: () -> Unit = {},
    viewModel: SongsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val filteredSongs = viewModel.getFilteredSongs()
    val singers = viewModel.getUniqueSingers()
    val selectedCount = uiState.selectedIds.size
    var nameDialogText by remember { mutableStateOf("") }

    // Name dialog for save-as-playlist / merge
    if (uiState.showNameDialog) {
        val isMerge = uiState.nameDialogType == NameDialogType.Merge
        var nameText by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { viewModel.dismissNameDialog() },
            shape = RoundedCornerShape(20.dp),
            containerColor = NeonColors.SurfaceDark,
            title = {
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Surface(shape = RoundedCornerShape(16.dp), color = NeonColors.ElectricVioletContainer.copy(alpha = 0.25f), modifier = Modifier.size(56.dp)) {
                        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Icon(if (isMerge) Icons.Filled.Merge else Icons.Filled.PlaylistAdd, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(28.dp))
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    Text(if (isMerge) "Merge Videos" else "Save as Playlist", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = NeonColors.OnSurface, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(4.dp))
                    Text(if (isMerge) "Give your merged video a name" else "Save these songs as a playlist", style = MaterialTheme.typography.bodySmall, color = NeonColors.OnSurfaceVariant, textAlign = TextAlign.Center)
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
                Button(onClick = { if (isMerge) viewModel.mergeSelected(nameText) else viewModel.saveAsPlaylist(nameText); viewModel.dismissNameDialog() }, enabled = nameText.isNotBlank(), colors = ButtonDefaults.buttonColors(containerColor = NeonColors.ElectricViolet, contentColor = NeonColors.DeepObsidian), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp)) {
                    Text(if (isMerge) "Merge" else "Save", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissNameDialog() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Cancel", color = NeonColors.OnSurfaceVariant, fontWeight = FontWeight.Medium)
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "My Songs",
                        style = MaterialTheme.typography.titleMedium,
                        color = NeonColors.OnSurface
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = NeonColors.OnSurface)
                    }
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
                .padding(top = padding.calculateTopPadding())
        ) {
            if (uiState.isSavingPlaylist || uiState.isMerging) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth(),
                    color = NeonColors.ElectricViolet,
                    trackColor = NeonColors.SurfaceContainer
                )
            }

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
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Filled.MusicNote,
                            contentDescription = null,
                            tint = NeonColors.OnSurfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(Modifier.height(16.dp))
                        Text(
                            text = "No saved songs yet",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            color = NeonColors.OnSurface
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            text = "Generate a playlist, select songs you like, and save them here",
                            style = MaterialTheme.typography.bodyMedium,
                            color = NeonColors.OnSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 48.dp),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            } else {
                // Singer filter chips
                if (singers.isNotEmpty()) {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = 12.dp),
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

                // Compact action bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 2.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${filteredSongs.size} songs",
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurfaceVariant
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
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
                if (selectedCount >= 1) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Play button
                        OutlinedButton(
                            onClick = {
                                viewModel.playSelected()
                                onNavigateToPlayer()
                            },
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = NeonColors.NeonCyan
                            ),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(
                                Icons.Filled.PlayArrow,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(4.dp))
                            Text("Play $selectedCount", style = MaterialTheme.typography.labelSmall)
                        }

                        // Save as Playlist button
                        if (selectedCount >= 1) {
                            OutlinedButton(
                                onClick = { viewModel.showSavePlaylistDialog() },
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = NeonColors.ElectricViolet
                                ),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(
                                    Icons.Outlined.PlaylistAdd,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(Modifier.width(4.dp))
                                Text("Save as Playlist", style = MaterialTheme.typography.labelSmall)
                            }
                        }

                        // Merge button
                        if (selectedCount >= 2) {
                            OutlinedButton(
                                onClick = { viewModel.showMergeDialog() },
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = NeonColors.NeonCyan
                                ),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(
                                    Icons.Filled.Merge,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(Modifier.width(4.dp))
                                Text("Merge", style = MaterialTheme.typography.labelSmall)
                            }
                        }

                        // Download button (for individual songs)
                        if (selectedCount == 1) {
                            OutlinedButton(
                                onClick = {
                                    val song = filteredSongs.find { uiState.selectedIds.contains(it.id) }
                                    if (song != null) {
                                        viewModel.downloadSong(song)
                                    }
                                },
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = NeonColors.NeonCyan
                                ),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(
                                    Icons.Outlined.Download,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(Modifier.width(4.dp))
                                Text("Download", style = MaterialTheme.typography.labelSmall)
                            }
                        }
                    }
                }

                // Song grid
                val songGridState = rememberLazyGridState()
                Box(Modifier.fillMaxSize()) {
                    LazyVerticalGrid(
                        state = songGridState,
                        columns = GridCells.Adaptive(160.dp),
                        contentPadding = PaddingValues(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                    items(filteredSongs) { song ->
                        SavedSongTile(
                            title = song.title,
                            thumbnailUrl = song.thumbnailUrl,
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
}

@Composable
private fun SavedSongTile(
    title: String,
    thumbnailUrl: String?,
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
    val borderColor = if (isSelected) NeonColors.ElectricViolet else NeonColors.Outline.copy(alpha = 0.3f)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggleSelect),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        border = CardDefaults.outlinedCardBorder().copy(
            width = if (isSelected) 2.dp else 1.dp,
            brush = androidx.compose.ui.graphics.SolidColor(borderColor)
        )
    ) {
        Box {
            // Thumbnail
            AsyncImage(
                model = thumbnailUrl ?: "",
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp)
                    .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)),
                contentScale = ContentScale.Crop
            )

            // Selection overlay
            if (isSelected) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(NeonColors.ElectricViolet.copy(alpha = 0.15f))
                )
            }

            // Checkbox indicator
            if (isSelected) {
                Icon(
                    imageVector = Icons.Filled.CheckCircle,
                    contentDescription = "Selected",
                    tint = NeonColors.ElectricViolet,
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(6.dp)
                        .size(22.dp)
                )
            }
        }

        // Info section
        Column(
            modifier = Modifier.padding(8.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                color = NeonColors.OnSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 16.sp
            )
            if (singerName != null) {
                Spacer(Modifier.height(2.dp))
                Text(
                    text = singerName,
                    style = MaterialTheme.typography.labelSmall,
                    color = NeonColors.ElectricViolet,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
