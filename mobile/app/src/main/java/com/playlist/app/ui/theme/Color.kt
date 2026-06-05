package com.playlist.app.ui.theme

import androidx.compose.ui.graphics.Color

// Obsidian Neon Palette — Deep Dark + Electric Accents
object NeonColors {
    // Core backgrounds
    val DeepObsidian = Color(0xFF131313)
    val SurfaceDark = Color(0xFF1A1A1A)
    val SurfaceContainer = Color(0xFF222222)
    val SurfaceContainerHigh = Color(0xFF2A2A2A)

    // Primary — Electric Violet
    val ElectricViolet = Color(0xFFD0BCFF)
    val ElectricVioletDim = Color(0xFFB89EFF)
    val ElectricVioletContainer = Color(0xFF4A3E6B)
    val OnElectricVioletContainer = Color(0xFFE8DEFF)

    // Secondary — Neon Cyan
    val NeonCyan = Color(0xFF4CD7F6)
    val NeonCyanDim = Color(0xFF2BC0E6)
    val NeonCyanContainer = Color(0xFF1A5C6E)
    val OnNeonCyanContainer = Color(0xFFB8F0FF)

    // Tertiary — Electric Rose
    val ElectricRose = Color(0xFFFFB2B7)
    val ElectricRoseDim = Color(0xFFFF8A92)
    val ElectricRoseContainer = Color(0xFF6E3B40)
    val OnElectricRoseContainer = Color(0xFFFFD8DA)

    // Error
    val ErrorRed = Color(0xFFFF5449)
    val ErrorRedContainer = Color(0xFF6E1A1A)
    val OnErrorRedContainer = Color(0xFFFFDAD6)

    // Neutrals
    val OnSurface = Color(0xFFE6E1E5)
    val OnSurfaceVariant = Color(0xFFCAC4D0)
    val Outline = Color(0xFF938F99)
    val OutlineVariant = Color(0xFF49454F)

    // Glass effects (used as alpha composites in composables)
    val GlassWhite = Color(0x0DFFFFFF)     // 5% white
    val GlassWhiteMedium = Color(0x1AFFFFFF) // 10% white
    val GlassWhiteStrong = Color(0x33FFFFFF)  // 20% white

    // Gradients
    val GradientVioletCyan = listOf(ElectricViolet, NeonCyan)
    val GradientCyanRose = listOf(NeonCyan, ElectricRose)
}
