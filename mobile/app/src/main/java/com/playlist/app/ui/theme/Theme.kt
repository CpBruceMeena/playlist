package com.playlist.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val PlaylistDarkColorScheme = darkColorScheme(
    primary = NeonColors.ElectricViolet,
    onPrimary = NeonColors.DeepObsidian,
    primaryContainer = NeonColors.ElectricVioletContainer,
    onPrimaryContainer = NeonColors.OnElectricVioletContainer,

    secondary = NeonColors.NeonCyan,
    onSecondary = NeonColors.DeepObsidian,
    secondaryContainer = NeonColors.NeonCyanContainer,
    onSecondaryContainer = NeonColors.OnNeonCyanContainer,

    tertiary = NeonColors.ElectricRose,
    onTertiary = NeonColors.DeepObsidian,
    tertiaryContainer = NeonColors.ElectricRoseContainer,
    onTertiaryContainer = NeonColors.OnElectricRoseContainer,

    error = NeonColors.ErrorRed,
    errorContainer = NeonColors.ErrorRedContainer,
    onErrorContainer = NeonColors.OnErrorRedContainer,

    background = NeonColors.DeepObsidian,
    onBackground = NeonColors.OnSurface,
    surface = NeonColors.SurfaceDark,
    onSurface = NeonColors.OnSurface,
    surfaceVariant = NeonColors.SurfaceContainer,
    onSurfaceVariant = NeonColors.OnSurfaceVariant,
    outline = NeonColors.Outline,
    outlineVariant = NeonColors.OutlineVariant
)

@Composable
fun PlaylistTheme(
    content: @Composable () -> Unit
) {
    val colorScheme = PlaylistDarkColorScheme
    val view = LocalView.current

    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = PlaylistTypography,
        shapes = PlaylistShapes,
        content = content
    )
}
