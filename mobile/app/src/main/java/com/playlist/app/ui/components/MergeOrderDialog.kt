package com.playlist.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.playlist.app.ui.theme.NeonColors

data class MergeSongItem(
    val id: String,
    val videoId: String,
    val title: String,
    val thumbnailUrl: String? = null
)

@Composable
fun MergeOrderDialog(
    songs: List<MergeSongItem>,
    onConfirm: (ordered: List<MergeSongItem>) -> Unit,
    onClose: () -> Unit
) {
    var ordered by remember { mutableStateOf<List<MergeSongItem>>(emptyList()) }
    val orderedIds = ordered.map { it.videoId }.toSet()
    val unselected = songs.filter { it.videoId !in orderedIds }

    Dialog(onDismissRequest = onClose) {
        Surface(
            shape = RoundedCornerShape(16.dp),
            color = NeonColors.SurfaceDark
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Order Songs for Merge",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurface
                    )
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
                    ) {
                        Text(
                            text = "${ordered.size} of ${songs.size}",
                            style = MaterialTheme.typography.labelSmall,
                            color = NeonColors.ElectricViolet,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Selected order
                if (ordered.isNotEmpty()) {
                    Text(
                        text = "Your Order",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.ElectricViolet,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(ordered) { song ->
                            MergeTile(
                                title = song.title,
                                isSelected = true,
                                orderNumber = ordered.indexOf(song) + 1,
                                onClick = {
                                    ordered = ordered.filter { it.videoId != song.videoId }
                                }
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Unselected songs
                if (unselected.isNotEmpty()) {
                    Text(
                        text = "Tap to add",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = NeonColors.OnSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(unselected) { song ->
                            MergeTile(
                                title = song.title,
                                isSelected = false,
                                onClick = {
                                    ordered = ordered + song
                                }
                            )
                        }
                    }
                }

                // Action buttons
                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onClose) {
                        Text(
                            text = "Cancel",
                            style = MaterialTheme.typography.labelMedium,
                            color = NeonColors.OnSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onConfirm(ordered) },
                        enabled = ordered.size >= 2,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = NeonColors.ElectricViolet,
                            contentColor = NeonColors.DeepObsidian,
                            disabledContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f),
                            disabledContentColor = NeonColors.OnSurfaceVariant
                        ),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(
                            text = "Merge ${ordered.size} song${if (ordered.size != 1) "s" else ""}",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MergeTile(
    title: String,
    isSelected: Boolean,
    orderNumber: Int? = null,
    onClick: () -> Unit
) {
    val bgColor = if (isSelected) {
        NeonColors.ElectricVioletContainer.copy(alpha = 0.2f)
    } else {
        NeonColors.SurfaceContainer
    }
    val borderColor = if (isSelected) {
        NeonColors.ElectricViolet.copy(alpha = 0.5f)
    } else {
        NeonColors.OutlineVariant.copy(alpha = 0.2f)
    }

    Box(
        modifier = Modifier
            .size(width = 100.dp, height = 80.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            if (isSelected) {
                Surface(
                    shape = CircleShape,
                    color = NeonColors.ElectricViolet,
                    modifier = Modifier.size(20.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = orderNumber?.toString() ?: "",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = NeonColors.DeepObsidian
                        )
                    }
                }
            } else {
                Icon(
                    imageVector = Icons.Filled.Add,
                    contentDescription = "Add",
                    tint = NeonColors.OnSurfaceVariant.copy(alpha = 0.5f),
                    modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = if (isSelected) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                textAlign = TextAlign.Center
            )
        }
    }
}
