package com.playlist.app.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LibraryMusic
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Tv
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material.icons.outlined.Download
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LibraryMusic
import androidx.compose.material.icons.outlined.MusicNote
import androidx.compose.material.icons.outlined.Tv
import androidx.compose.material.icons.outlined.VideoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState
import com.playlist.app.ui.theme.NeonColors

data class BottomNavItem(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

val bottomNavItems = listOf(
    BottomNavItem(
        route = NavRoutes.HOME,
        label = "Home",
        selectedIcon = Icons.Filled.Home,
        unselectedIcon = Icons.Outlined.Home
    ),
    BottomNavItem(
        route = NavRoutes.TV_SERIES,
        label = "TV Series",
        selectedIcon = Icons.Filled.Tv,
        unselectedIcon = Icons.Outlined.Tv
    ),
    BottomNavItem(
        route = NavRoutes.SONGS,
        label = "My Songs",
        selectedIcon = Icons.Filled.MusicNote,
        unselectedIcon = Icons.Outlined.MusicNote
    ),
    BottomNavItem(
        route = NavRoutes.MERGED,
        label = "Merged",
        selectedIcon = Icons.Filled.VideoLibrary,
        unselectedIcon = Icons.Outlined.VideoLibrary
    ),
    BottomNavItem(
        route = NavRoutes.DOWNLOADS,
        label = "Downloads",
        selectedIcon = Icons.Filled.Download,
        unselectedIcon = Icons.Outlined.Download
    ),
    BottomNavItem(
        route = NavRoutes.PLAYLISTS,
        label = "Playlists",
        selectedIcon = Icons.Filled.LibraryMusic,
        unselectedIcon = Icons.Outlined.LibraryMusic
    )
)

@Composable
fun BottomNavBar(navController: NavHostController) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    NavigationBar(
        containerColor = NeonColors.SurfaceDark,
        tonalElevation = 0.dp
    ) {
        bottomNavItems.forEach { item ->
            AddNavigationBarItem(
                item = item,
                selected = currentDestination?.hierarchy?.any {
                    it.route == item.route
                } == true,
                onClick = {
                    navController.navigate(item.route) {
                        popUpTo(navController.graph.findStartDestination().id) {
                            saveState = true
                        }
                        launchSingleTop = true
                        restoreState = true
                    }
                }
            )
        }
    }
}

@Composable
private fun RowScope.AddNavigationBarItem(
    item: BottomNavItem,
    selected: Boolean,
    onClick: () -> Unit
) {
    val iconColor by animateColorAsState(
        targetValue = if (selected) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant,
        label = "navIconColor"
    )
    val textColor by animateColorAsState(
        targetValue = if (selected) NeonColors.ElectricViolet else NeonColors.OnSurfaceVariant,
        label = "navTextColor"
    )

    NavigationBarItem(
        icon = {
            Icon(
                imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                contentDescription = item.label,
                tint = iconColor,
                modifier = Modifier.height(22.dp)
            )
        },
        label = {
            Text(
                text = item.label,
                color = textColor,
                style = MaterialTheme.typography.labelSmall
            )
        },
        selected = selected,
        onClick = onClick,
        colors = NavigationBarItemDefaults.colors(
            indicatorColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
        )
    )
}
