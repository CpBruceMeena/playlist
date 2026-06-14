package com.playlist.app.ui.singers

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
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
    var customInput by remember { mutableStateOf("") }

    LaunchedEffect(uiState.generatedVideos) {
        if (uiState.generatedVideos.isNotEmpty()) {
            PlayerState.setQueue(uiState.generatedVideos)
            onNavigateToPlayer()
        }
    }

    val totalSelected = uiState.selectedSingerIds.size + uiState.customSingerNames.size
    val canGenerate = totalSelected >= 1 && totalSelected <= 5

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Singers", color = NeonColors.OnSurface, style = MaterialTheme.typography.titleLarge) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = NeonColors.DeepObsidian)
            )
        },
        containerColor = NeonColors.DeepObsidian
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            SearchBar(
                query = uiState.searchQuery,
                onQueryChange = { viewModel.onSearchQueryChange(it) },
                onSearch = {},
                placeholder = "Search singers..."
            )

            // Genre filters
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(vertical = 4.dp)
            ) {
                items(uiState.genres) { genre ->
                    FilterChip(
                        selected = uiState.selectedGenre == genre,
                        onClick = { viewModel.onGenreSelect(if (uiState.selectedGenre == genre) null else genre) },
                        label = { Text(genre, style = MaterialTheme.typography.labelSmall, color = if (uiState.selectedGenre == genre) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant) },
                        colors = FilterChipDefaults.filterChipColors(containerColor = NeonColors.SurfaceContainer, selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f))
                    )
                }
            }

            // Selection info + generate
            if (totalSelected > 0) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("$totalSelected selected (max 5)", style = MaterialTheme.typography.labelSmall, color = NeonColors.ElectricViolet)
                }
            }

            if (totalSelected >= 1) {
                if (uiState.isGenerating) {
                    Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = NeonColors.ElectricViolet, modifier = Modifier.size(32.dp))
                    }
                } else {
                    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp)) {
                        com.playlist.app.ui.components.NeonButton(
                            text = if (totalSelected > 1) "Generate ($totalSelected singers)" else "Generate (1 singer)",
                            onClick = { viewModel.generateMultiSinger() }
                        )
                    }
                }
            }

            // Custom singer input
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = customInput,
                    onValueChange = { customInput = it },
                    placeholder = { Text("Add custom singer...", color = NeonColors.OnSurfaceVariant.copy(alpha = 0.5f)) },
                    singleLine = true,
                    textStyle = MaterialTheme.typography.bodySmall.copy(color = NeonColors.OnSurface),
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { if (customInput.isNotBlank()) { viewModel.addCustomSinger(customInput); customInput = "" } }),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = NeonColors.ElectricViolet.copy(alpha = 0.5f),
                        unfocusedBorderColor = NeonColors.OutlineVariant.copy(alpha = 0.3f),
                        cursorColor = NeonColors.ElectricViolet,
                        unfocusedContainerColor = NeonColors.SurfaceContainer,
                        focusedContainerColor = NeonColors.SurfaceContainer
                    ),
                    modifier = Modifier.weight(1f)
                )
                FilledIconButton(
                    onClick = { if (customInput.isNotBlank()) { viewModel.addCustomSinger(customInput); customInput = "" } },
                    enabled = customInput.isNotBlank() && totalSelected < 5,
                    modifier = Modifier.size(36.dp),
                    colors = IconButtonDefaults.filledIconButtonColors(containerColor = NeonColors.ElectricViolet)
                ) {
                    Icon(Icons.Filled.Add, contentDescription = "Add", tint = NeonColors.DeepObsidian, modifier = Modifier.size(18.dp))
                }
            }

            // Custom singer chips
            if (uiState.customSingerNames.isNotEmpty()) {
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(uiState.customSingerNames) { name ->
                        AssistChip(
                            onClick = {},
                            label = { Text(name, style = MaterialTheme.typography.labelSmall, color = NeonColors.OnSurface) },
                            trailingIcon = { Icon(Icons.Filled.Close, contentDescription = "Remove", modifier = Modifier.clickable { viewModel.removeCustomSinger(name) }.size(14.dp), tint = NeonColors.OnSurfaceVariant) },
                            colors = AssistChipDefaults.assistChipColors(containerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.2f))
                        )
                    }
                }
            }

            // Error
            uiState.error?.let { error ->
                Text(error, color = NeonColors.ErrorRed, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp))
            }

            // Singer list
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(uiState.filteredSingers) { singer ->
                    val isSelected = uiState.selectedSingerIds.contains(singer.id)
                    Row(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) NeonColors.ElectricVioletContainer.copy(alpha = 0.2f) else NeonColors.SurfaceContainer)
                            .clickable { viewModel.toggleSinger(singer.id) }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.size(44.dp).clip(CircleShape).background(NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)), contentAlignment = Alignment.Center) {
                            Text(singer.name.take(2).uppercase(), style = MaterialTheme.typography.titleSmall, color = NeonColors.ElectricViolet)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(singer.name, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Medium, color = NeonColors.OnSurface)
                            Text(singer.genre, style = MaterialTheme.typography.labelSmall, color = NeonColors.OnSurfaceVariant)
                        }
                        if (isSelected) Icon(Icons.Filled.Check, contentDescription = "Selected", tint = NeonColors.ElectricViolet)
                    }
                }
            }
        }
    }
}
