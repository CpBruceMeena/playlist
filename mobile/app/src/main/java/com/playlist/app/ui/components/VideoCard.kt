package com.playlist.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.playlist.app.ui.theme.NeonColors

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

/**
 * Parse an ISO 8601 date string and format it in human-readable form like "15th June" or "4th May".
 * Handles formats like "2026-06-15T12:09:09.576566Z" and "2026-06-15".
 */
fun formatDate(isoDate: String?): String {
    if (isoDate.isNullOrBlank()) return ""
    return try {
        val inputFormats = listOf(
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'", Locale.US),
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US),
            SimpleDateFormat("yyyy-MM-dd", Locale.US)
        )
        for (fmt in inputFormats) {
            fmt.timeZone = TimeZone.getTimeZone("UTC")
            try {
                val date = fmt.parse(isoDate)
                if (date != null) {
                    val cal = Calendar.getInstance()
                    cal.time = date
                    val day = cal.get(Calendar.DAY_OF_MONTH)
                    val month = cal.getDisplayName(Calendar.MONTH, Calendar.SHORT, Locale.US)
                    val year = cal.get(Calendar.YEAR)
                    val suffix = when {
                        day in 11..13 -> "th"
                        day % 10 == 1 -> "st"
                        day % 10 == 2 -> "nd"
                        day % 10 == 3 -> "rd"
                        else -> "th"
                    }
                    return "${day}$suffix $month"
                }
            } catch (_: Exception) { }
        }
        // Fallback: extract date portion
        if (isoDate.length >= 10) {
            val datePart = isoDate.substring(0, 10)
            val parts = datePart.split("-")
            if (parts.size == 3) {
                val day = parts[2].toIntOrNull() ?: return isoDate
                val monthIdx = parts[1].toIntOrNull() ?: return isoDate
                if (monthIdx in 1..12) {
                    val monthNames = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
                    val month = monthNames[monthIdx - 1]
                    val suffix = when {
                        day in 11..13 -> "th"
                        day % 10 == 1 -> "st"
                        day % 10 == 2 -> "nd"
                        day % 10 == 3 -> "rd"
                        else -> "th"
                    }
                    return "${day}$suffix $month"
                }
            }
        }
        isoDate
    } catch (_: Exception) {
        isoDate ?: ""
    }
}

@Composable
fun VideoCard(
    thumbnailUrl: String?,
    title: String,
    channelTitle: String,
    durationSeconds: Int,
    singerName: String? = null,
    onClick: () -> Unit = {},
    modifier: Modifier = Modifier,
    imageHeight: Dp = 120.dp
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .background(NeonColors.GlassWhite)
    ) {
        // Thumbnail
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(imageHeight)
                .clip(RoundedCornerShape(12.dp))
        ) {
            AsyncImage(
                model = thumbnailUrl ?: "",
                contentDescription = title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )

            // Duration badge
            if (durationSeconds > 0) {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(4.dp)
                        .background(
                            color = NeonColors.DeepObsidian.copy(alpha = 0.85f),
                            shape = RoundedCornerShape(4.dp)
                        )
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = formatDuration(durationSeconds),
                        style = MaterialTheme.typography.labelSmall,
                        color = NeonColors.OnSurface
                    )
                }
            }
        }

        // Title + channel info
        Column(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = NeonColors.OnSurface,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(2.dp))

            // Singer badge
            if (!singerName.isNullOrBlank()) {
                Text(
                    text = singerName,
                    style = MaterialTheme.typography.labelSmall,
                    color = NeonColors.ElectricViolet,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Text(
                text = channelTitle,
                style = MaterialTheme.typography.labelSmall,
                color = NeonColors.OnSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

fun formatDuration(totalSeconds: Int): String {
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60

    return if (hours > 0) {
        "%d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%d:%02d".format(minutes, seconds)
    }
}
