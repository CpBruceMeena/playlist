package com.playlist.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.playlist.app.ui.theme.NeonColors

data class ProfileSection(
    val title: String,
    val icon: ImageVector,
    val count: Int,
    val route: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onSectionClick: (String) -> Unit,
    onNavigateBack: () -> Unit = {},
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadAllCounts()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile", style = MaterialTheme.typography.titleMedium, color = NeonColors.OnSurface) },
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
        val profileScrollState = rememberLazyListState()
        Box(Modifier.fillMaxSize().padding(top = padding.calculateTopPadding())) {
            LazyColumn(
                state = profileScrollState,
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
            // Profile header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier.size(56.dp).clip(CircleShape)
                            .background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.Person, contentDescription = null, tint = NeonColors.ElectricViolet, modifier = Modifier.size(28.dp))
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Your Library", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = NeonColors.OnSurface)
                        Text("All your saved content in one place", style = MaterialTheme.typography.bodySmall, color = NeonColors.OnSurfaceVariant)
                    }
                }
            }

            // My Songs section
            item {
                ProfileSectionCard(
                    title = "My Songs",
                    subtitle = "${uiState.songCount} saved songs",
                    icon = Icons.Filled.MusicNote,
                    iconColor = NeonColors.ElectricViolet,
                    count = uiState.songCount,
                    onClick = { onSectionClick("songs") }
                )
            }

            // TV Series section
            item {
                ProfileSectionCard(
                    title = "TV Series",
                    subtitle = if (uiState.tvSeriesEpisodeCount > 0)
                        "${uiState.tvSeriesCount} series, ${uiState.tvSeriesEpisodeCount} saved episodes"
                    else
                        "${uiState.tvSeriesCount} saved series",
                    icon = Icons.Filled.Tv,
                    iconColor = NeonColors.NeonCyan,
                    count = uiState.tvSeriesCount + uiState.tvSeriesEpisodeCount,
                    onClick = { onSectionClick("tv_series") }
                )
            }

            // Downloads section
            item {
                ProfileSectionCard(
                    title = "Downloads",
                    subtitle = "${uiState.downloadCount} downloaded videos",
                    icon = Icons.Filled.Download,
                    iconColor = NeonColors.ElectricViolet,
                    count = uiState.downloadCount,
                    onClick = { onSectionClick("downloads") }
                )
            }

            // Playlists section
            item {
                ProfileSectionCard(
                    title = "Playlists",
                    subtitle = "${uiState.playlistCount} playlists",
                    icon = Icons.Filled.LibraryMusic,
                    iconColor = NeonColors.NeonCyan,
                    count = uiState.playlistCount,
                    onClick = { onSectionClick("playlists") }
                )
            }

            // Merged section
            item {
                ProfileSectionCard(
                    title = "Merged Videos",
                    subtitle = "${uiState.mergedCount} merged videos",
                    icon = Icons.Filled.VideoLibrary,
                    iconColor = NeonColors.ElectricViolet,
                    count = uiState.mergedCount,
                    onClick = { onSectionClick("merged") }
                )
            }

        }
    }
}
}

@Composable
private fun ProfileSectionCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconColor: androidx.compose.ui.graphics.Color,
    count: Int,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = NeonColors.SurfaceContainer)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.size(44.dp).clip(RoundedCornerShape(12.dp))
                    .background(iconColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold, color = NeonColors.OnSurface)
                Spacer(Modifier.height(2.dp))
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = NeonColors.OnSurfaceVariant)
            }
            if (count > 0) {
                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = iconColor.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = if (count > 99) "99+" else count.toString(),
                        style = MaterialTheme.typography.labelSmall,
                        color = iconColor,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                    )
                }
            }
            Spacer(Modifier.width(8.dp))
            Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = NeonColors.OnSurfaceVariant.copy(alpha = 0.5f), modifier = Modifier.size(20.dp))
        }
    }
}
