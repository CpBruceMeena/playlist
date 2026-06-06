package com.playlist.app.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.playlist.app.ui.theme.NeonColors

// ─── Filter Panel Composable ───────────────────────────────────

@Composable
fun FilterPanel(
    expanded: Boolean,
    videoTypes: List<String>,
    selectedDurationPresets: List<String>,
    uploadDateType: String,
    minViews: Long?,
    maxResults: Int,
    safeSearch: Boolean,
    includeKeywords: List<String>,
    excludeKeywords: List<String>,
    activeFilterCount: Int,
    onToggleExpanded: () -> Unit,
    onToggleVideoType: (String) -> Unit,
    onToggleDurationPreset: (String) -> Unit,
    onSetDurationCustom: (Int?, Int?) -> Unit,
    onSetUploadDate: (String) -> Unit,
    onSetMinViews: (Long?) -> Unit,
    onSetMaxResults: (Int) -> Unit,
    onSetSafeSearch: (Boolean) -> Unit,
    onAddIncludeKeyword: (String) -> Unit,
    onRemoveIncludeKeyword: (String) -> Unit,
    onAddExcludeKeyword: (String) -> Unit,
    onRemoveExcludeKeyword: (String) -> Unit,
    onResetFilters: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(NeonColors.SurfaceContainer.copy(alpha = 0.5f))
    ) {
        // ── Toggle Header ──
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onToggleExpanded)
                .padding(horizontal = 14.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Filled.FilterList,
                    contentDescription = "Filters",
                    tint = NeonColors.OnSurfaceVariant,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Filters & Refinements",
                    style = MaterialTheme.typography.labelMedium,
                    color = NeonColors.OnSurface
                )
                if (activeFilterCount > 0) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        shape = RoundedCornerShape(10.dp),
                        color = NeonColors.ElectricViolet.copy(alpha = 0.9f)
                    ) {
                        Text(
                            text = activeFilterCount.toString(),
                            style = MaterialTheme.typography.labelSmall,
                            color = NeonColors.DeepObsidian,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                        )
                    }
                }
            }
            Icon(
                imageVector = Icons.Filled.ExpandMore,
                contentDescription = if (expanded) "Collapse" else "Expand",
                tint = NeonColors.OnSurfaceVariant,
                modifier = Modifier.size(18.dp)
            )
        }

        // ── Collapsible Content ──
        AnimatedVisibility(visible = expanded) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 14.dp, end = 14.dp, bottom = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                HorizontalDivider(color = NeonColors.OutlineVariant.copy(alpha = 0.3f))

                // ── Video Type ──
                FilterSection(label = "Video Type") {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(listOf("music", "live", "shorts", "standard")) { type ->
                            val isActive = videoTypes.contains(type)
                            val displayName = type.replaceFirstChar { it.uppercase() }
                            FilterChip(
                                selected = isActive,
                                onClick = { onToggleVideoType(type) },
                                label = {
                                    Text(
                                        text = displayName,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (isActive) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainerHigh,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.25f)
                                ),
                                border = FilterChipDefaults.filterChipBorder(
                                    borderColor = if (isActive) NeonColors.ElectricViolet.copy(alpha = 0.4f) else NeonColors.OutlineVariant.copy(alpha = 0.2f),
                                    selectedBorderColor = NeonColors.ElectricViolet.copy(alpha = 0.5f),
                                    enabled = true,
                                    selected = isActive
                                )
                            )
                        }
                    }
                }

                // ── Duration ──
                FilterSection(label = "Duration") {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(listOf("< 1 min", "1-4 min", "4-10 min", "10-20 min", "> 20 min")) { preset ->
                            val isActive = selectedDurationPresets.contains(preset)
                            FilterChip(
                                selected = isActive,
                                onClick = { onToggleDurationPreset(preset) },
                                label = {
                                    Text(
                                        text = preset,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (isActive) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainerHigh,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.25f)
                                ),
                                border = FilterChipDefaults.filterChipBorder(
                                    borderColor = if (isActive) NeonColors.ElectricViolet.copy(alpha = 0.4f) else NeonColors.OutlineVariant.copy(alpha = 0.2f),
                                    selectedBorderColor = NeonColors.ElectricViolet.copy(alpha = 0.5f),
                                    enabled = true,
                                    selected = isActive
                                )
                            )
                        }
                    }
                }

                // ── Upload Date ──
                FilterSection(label = "Upload Date") {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        val options = listOf(
                            "any" to "Any time",
                            "last_week" to "Past week",
                            "last_month" to "Past month",
                            "last_year" to "Past year"
                        )
                        items(options) { (value, label) ->
                            val isActive = uploadDateType == value
                            FilterChip(
                                selected = isActive,
                                onClick = { onSetUploadDate(value) },
                                label = {
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (isActive) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainerHigh,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.25f)
                                ),
                                border = FilterChipDefaults.filterChipBorder(
                                    borderColor = if (isActive) NeonColors.ElectricViolet.copy(alpha = 0.4f) else NeonColors.OutlineVariant.copy(alpha = 0.2f),
                                    selectedBorderColor = NeonColors.ElectricViolet.copy(alpha = 0.5f),
                                    enabled = true,
                                    selected = isActive
                                )
                            )
                        }
                    }
                }

                // ── Min Views ──
                FilterSection(label = "Min Views") {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(listOf(null to "Any", 1000L to "1K", 10000L to "10K", 100000L to "100K", 1000000L to "1M")) { (value, label) ->
                            val isActive = minViews == value
                            FilterChip(
                                selected = isActive,
                                onClick = { onSetMinViews(value) },
                                label = {
                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = if (isActive) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    containerColor = NeonColors.SurfaceContainerHigh,
                                    selectedContainerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.25f)
                                ),
                                border = FilterChipDefaults.filterChipBorder(
                                    borderColor = if (isActive) NeonColors.ElectricViolet.copy(alpha = 0.4f) else NeonColors.OutlineVariant.copy(alpha = 0.2f),
                                    selectedBorderColor = NeonColors.ElectricViolet.copy(alpha = 0.5f),
                                    enabled = true,
                                    selected = isActive
                                )
                            )
                        }
                    }
                }

                // ── Keywords ──
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Include keywords
                    KeywordInput(
                        label = "Must include",
                        keywords = includeKeywords,
                        onAdd = onAddIncludeKeyword,
                        onRemove = onRemoveIncludeKeyword,
                        modifier = Modifier.weight(1f)
                    )
                    // Exclude keywords
                    KeywordInput(
                        label = "Exclude",
                        keywords = excludeKeywords,
                        onAdd = onAddExcludeKeyword,
                        onRemove = onRemoveExcludeKeyword,
                        modifier = Modifier.weight(1f)
                    )
                }

                // ── Max Results + Safe Search + Reset ──
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        // Max Results dropdown
                        Column {
                            Text(
                                text = "Max",
                                style = MaterialTheme.typography.labelSmall,
                                color = NeonColors.OnSurfaceVariant
                            )
                            var expandedDropdown by remember { mutableStateOf(false) }
                            Box {
                                OutlinedButton(
                                    onClick = { expandedDropdown = true },
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(
                                        contentColor = NeonColors.OnSurface
                                    ),
                                    border = FilterChipDefaults.filterChipBorder(
                                        borderColor = NeonColors.OutlineVariant.copy(alpha = 0.3f),
                                        selectedBorderColor = NeonColors.OutlineVariant,
                                        enabled = true,
                                        selected = false
                                    )
                                ) {
                                    Text(
                                        text = maxResults.toString(),
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                                DropdownMenu(
                                    expanded = expandedDropdown,
                                    onDismissRequest = { expandedDropdown = false }
                                ) {
                                    listOf(10, 15, 25, 50).forEach { count ->
                                        DropdownMenuItem(
                                            text = {
                                                Text(
                                                    text = count.toString(),
                                                    style = MaterialTheme.typography.labelMedium
                                                )
                                            },
                                            onClick = {
                                                onSetMaxResults(count)
                                                expandedDropdown = false
                                            }
                                        )
                                    }
                                }
                            }
                        }

                        // Safe search toggle
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "Safe",
                                style = MaterialTheme.typography.labelSmall,
                                color = NeonColors.OnSurfaceVariant
                            )
                            Switch(
                                checked = safeSearch,
                                onCheckedChange = onSetSafeSearch,
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = NeonColors.ElectricViolet,
                                    checkedTrackColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.5f),
                                    uncheckedThumbColor = NeonColors.OnSurfaceVariant,
                                    uncheckedTrackColor = NeonColors.SurfaceContainerHigh
                                ),
                                modifier = Modifier.height(24.dp)
                            )
                        }
                    }

                    // Reset button
                    if (activeFilterCount > 0) {
                        TextButton(
                            onClick = onResetFilters,
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "Reset all",
                                style = MaterialTheme.typography.labelSmall,
                                color = NeonColors.OnSurfaceVariant
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─── Filter Section Helper ─────────────────────────────────────

@Composable
private fun FilterSection(
    label: String,
    content: @Composable () -> Unit
) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.Medium,
            color = NeonColors.OnSurfaceVariant,
            modifier = Modifier.padding(bottom = 6.dp)
        )
        content()
    }
}

// ─── Keyword Input Helper ──────────────────────────────────────

@Composable
private fun KeywordInput(
    label: String,
    keywords: List<String>,
    onAdd: (String) -> Unit,
    onRemove: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var input by remember { mutableStateOf("") }

    Column(modifier = modifier) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = NeonColors.OnSurfaceVariant,
            modifier = Modifier.padding(bottom = 4.dp)
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = { input = it },
                placeholder = {
                    Text(
                        text = "keyword...",
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurfaceVariant.copy(alpha = 0.5f)
                    )
                },
                singleLine = true,
                textStyle = MaterialTheme.typography.labelSmall.copy(
                    color = NeonColors.OnSurface
                ),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(
                    onDone = {
                        if (input.isNotBlank()) {
                            onAdd(input)
                            input = ""
                        }
                    }
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = NeonColors.ElectricViolet.copy(alpha = 0.5f),
                    unfocusedBorderColor = NeonColors.OutlineVariant.copy(alpha = 0.3f),
                    cursorColor = NeonColors.ElectricViolet,
                    unfocusedContainerColor = NeonColors.SurfaceContainerHigh,
                    focusedContainerColor = NeonColors.SurfaceContainerHigh
                ),
                modifier = Modifier
                    .weight(1f)
                    .heightIn(min = 40.dp)
            )
            IconButton(
                onClick = {
                    if (input.isNotBlank()) {
                        onAdd(input)
                        input = ""
                    }
                },
                modifier = Modifier.size(28.dp),
                enabled = input.isNotBlank()
            ) {
                Icon(
                    imageVector = Icons.Filled.Add,
                    contentDescription = "Add",
                    tint = if (input.isNotBlank()) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant.copy(alpha = 0.4f),
                    modifier = Modifier.size(16.dp)
                )
            }
        }
        if (keywords.isNotEmpty()) {
            Spacer(modifier = Modifier.height(4.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                items(keywords) { kw ->
                    InputChip(
                        selected = false,
                        onClick = {},
                        label = {
                            Text(
                                text = kw,
                                style = MaterialTheme.typography.labelSmall,
                                color = NeonColors.ElectricViolet
                            )
                        },
                        trailingIcon = {
                            Icon(
                                imageVector = Icons.Filled.Close,
                                contentDescription = "Remove $kw",
                                modifier = Modifier
                                    .size(12.dp)
                                    .clickable { onRemove(kw) },
                                tint = NeonColors.ElectricViolet.copy(alpha = 0.7f)
                            )
                        },
                        colors = InputChipDefaults.inputChipColors(
                            containerColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.15f)
                        ),
                        border = InputChipDefaults.inputChipBorder(
                            borderColor = NeonColors.ElectricViolet.copy(alpha = 0.2f),
                            enabled = true,
                            selected = false
                        ),
                        modifier = Modifier.height(28.dp)
                    )
                }
            }
        }
    }
}
