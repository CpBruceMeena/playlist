package com.playlist.app.ui.playlists

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.ui.components.GlassCard
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.theme.NeonColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlaylistsScreen(
    onNavigateToPlayer: () -> Unit,
    viewModel: PlaylistsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showDeleteDialog by remember { mutableStateOf<String?>(null) }
    var showRenameDialog by remember { mutableStateOf<String?>(null) }
    var renameText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "My Playlists",
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
        if (uiState.playlists.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No playlists saved yet.\nGenerate a playlist and save it!",
                    style = MaterialTheme.typography.bodyLarge,
                    color = NeonColors.OnSurfaceVariant
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(uiState.playlists) { playlist ->
                    PlaylistCard(
                        name = playlist.name,
                        songCount = playlist.videoCount ?: 0,
                        query = playlist.query,
                        onClick = {
                            playlist.videos?.let { videos ->
                                @Suppress("UNCHECKED_CAST")
                                PlayerState.setQueue(videos as List<YouTubeVideoDto>)
                                onNavigateToPlayer()
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

        // Rename dialog
        showRenameDialog?.let { id ->
            AlertDialog(
                onDismissRequest = { showRenameDialog = null },
                title = { Text("Rename Playlist", color = NeonColors.OnSurface) },
                text = {
                    OutlinedTextField(
                        value = renameText,
                        onValueChange = { renameText = it },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = NeonColors.OnSurface,
                            unfocusedTextColor = NeonColors.OnSurface,
                            cursorColor = NeonColors.ElectricViolet,
                            focusedBorderColor = NeonColors.ElectricViolet
                        )
                    )
                },
                confirmButton = {
                    TextButton(onClick = {
                        viewModel.renamePlaylist(id, renameText)
                        showRenameDialog = null
                    }) {
                        Text("Rename", color = NeonColors.ElectricViolet)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showRenameDialog = null }) {
                        Text("Cancel", color = NeonColors.OnSurfaceVariant)
                    }
                },
                containerColor = NeonColors.SurfaceDark
            )
        }
    }
}

@Composable
private fun PlaylistCard(
    name: String,
    songCount: Int,
    query: String,
    onClick: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit
) {
    GlassCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
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
    }
}
