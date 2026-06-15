package com.playlist.app.ui.playlists

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
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
import com.playlist.app.ui.components.GlassCard
import androidx.compose.ui.text.style.TextAlign
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlaylistsScreen(
    onNavigateToPlayer: () -> Unit,
    onNavigateBack: () -> Unit = {},
    viewModel: PlaylistsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showDeleteDialog by remember { mutableStateOf<String?>(null) }
    var showRenameDialog by remember { mutableStateOf<String?>(null) }
    var renameText by remember { mutableStateOf("") }

    // Navigate only after playPlaylist async fetch completes
    var pendingPlayId by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(uiState.playingId) {
        if (uiState.playingId == null && pendingPlayId != null) {
            pendingPlayId = null
            onNavigateToPlayer()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "My Playlists",
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
        if (uiState.playlists.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = padding.calculateTopPadding()),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No playlists saved yet.\nGenerate a playlist and save it!",
                    style = MaterialTheme.typography.bodyLarge,
                    color = NeonColors.OnSurfaceVariant
                )
            }
        } else {
            val playlistScrollState = rememberLazyListState()
            Box(Modifier.fillMaxSize().padding(top = padding.calculateTopPadding())) {
                LazyColumn(
                    state = playlistScrollState,
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(uiState.playlists) { playlist ->
                        val isPlaying = uiState.playingId == playlist.id
                        PlaylistCard(
                            name = playlist.name,
                            songCount = playlist.videoCount ?: 0,
                            query = playlist.query,
                            thumbnailUrl = playlist.thumbnailUrl,
                            isPlaying = isPlaying,
                            onClick = {
                                if (!isPlaying) {
                                    pendingPlayId = playlist.id
                                    viewModel.playPlaylist(playlist.id)
                                }
                            },
                            onRename = {
                                renameText = playlist.name
                                showRenameDialog = playlist.id
                            },
                            onDelete = { showDeleteDialog = playlist.id }
                        )
                    }
                }

            }

        // Delete confirmation
        showDeleteDialog?.let { id ->
            AlertDialog(
                onDismissRequest = { showDeleteDialog = null },
                title = { Text("Delete Playlist", color = NeonColors.OnSurface) },
                text = { Text("Are you sure?", color = NeonColors.OnSurfaceVariant) },
                confirmButton = {
                    TextButton(onClick = {
                        viewModel.deletePlaylist(id)
                        showDeleteDialog = null
                    }) {
                        Text("Delete", color = NeonColors.ErrorRed)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = null }) {
                        Text("Cancel", color = NeonColors.OnSurfaceVariant)
                    }
                },
                containerColor = NeonColors.SurfaceDark
            )
        }

        // Rename dialog (improved)
        showRenameDialog?.let { id ->
            var nameText by remember { mutableStateOf("") }
            AlertDialog(
                onDismissRequest = { showRenameDialog = null },
                shape = RoundedCornerShape(20.dp),
                containerColor = NeonColors.SurfaceDark,
                title = {
                    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                        Surface(shape = RoundedCornerShape(16.dp), color = NeonColors.ElectricVioletContainer.copy(alpha = 0.25f), modifier = Modifier.size(56.dp)) {
                            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                Icon(Icons.Filled.Edit, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(28.dp))
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                        Text("Rename Playlist", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = NeonColors.OnSurface, textAlign = TextAlign.Center)
                        Spacer(Modifier.height(4.dp))
                        Text("Choose a new name for this playlist", style = MaterialTheme.typography.bodySmall, color = NeonColors.OnSurfaceVariant, textAlign = TextAlign.Center)
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
                    Button(onClick = { viewModel.renamePlaylist(id, nameText); showRenameDialog = null }, enabled = nameText.isNotBlank(), colors = ButtonDefaults.buttonColors(containerColor = NeonColors.ElectricViolet, contentColor = NeonColors.DeepObsidian), shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp)) {
                        Text("Rename", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showRenameDialog = null }, modifier = Modifier.fillMaxWidth()) {
                        Text("Cancel", color = NeonColors.OnSurfaceVariant, fontWeight = FontWeight.Medium)
                    }
                }
            )
        }
    }
}
}

@Composable
private fun PlaylistCard(
    name: String,
    songCount: Int,
    query: String,
    thumbnailUrl: String? = null,
    isPlaying: Boolean = false,
    onClick: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = !isPlaying, onClick = onClick)
    ) {
        Box {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Thumbnail
                if (thumbnailUrl != null) {
                    AsyncImage(
                        model = thumbnailUrl,
                        contentDescription = null,
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonColors.SurfaceDark),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(Modifier.width(12.dp))
                } else {
                    // Placeholder when no thumbnail
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(NeonColors.ElectricVioletContainer.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Filled.LibraryMusic,
                            contentDescription = null,
                            tint = NeonColors.ElectricViolet.copy(alpha = 0.5f),
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Spacer(Modifier.width(12.dp))
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = name,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "$songCount songs",
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurfaceVariant
                    )
                    if (query.isNotBlank()) {
                        Text(
                            text = "\"$query\"",
                            style = MaterialTheme.typography.labelSmall,
                            color = NeonColors.NeonCyan,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }

                IconButton(onClick = onRename) {
                    Icon(
                        imageVector = Icons.Outlined.Edit,
                        contentDescription = "Rename",
                        tint = NeonColors.OnSurfaceVariant,
                        modifier = Modifier.size(20.dp)
                    )
                }

                IconButton(onClick = onDelete) {
                    Icon(
                        imageVector = Icons.Outlined.Delete,
                        contentDescription = "Delete",
                        tint = NeonColors.ErrorRed.copy(alpha = 0.7f),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // Loading overlay when fetching videos for playback
            if (isPlaying) {
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(NeonColors.DeepObsidian.copy(alpha = 0.5f)),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        color = NeonColors.ElectricViolet,
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp
                    )
                }
            }
        }
    }
}
