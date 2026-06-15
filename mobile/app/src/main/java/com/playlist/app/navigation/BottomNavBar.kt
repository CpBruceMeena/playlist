package com.playlist.app.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
        route = NavRoutes.PROFILE,
        label = "Profile",
        selectedIcon = Icons.Filled.Person,
        unselectedIcon = Icons.Outlined.Person
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
                    if (item.route == NavRoutes.HOME) {
                        // For Home, pop everything and start fresh (clears generated state)
                        navController.navigate(item.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    } else {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
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
                modifier = Modifier.height(20.dp)
            )
        },
        label = {
            Text(
                text = item.label,
                color = textColor,
                maxLines = 1,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontSize = 10.sp
                )
            )
        },
        selected = selected,
        onClick = onClick,
        colors = NavigationBarItemDefaults.colors(
            indicatorColor = NeonColors.ElectricVioletContainer.copy(alpha = 0.3f)
        ),
        modifier = Modifier.height(56.dp)
    )
}
