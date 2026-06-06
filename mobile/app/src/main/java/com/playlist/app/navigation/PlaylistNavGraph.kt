package com.playlist.app.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Alignment
import com.playlist.app.ui.components.ToastContainer
import com.playlist.app.ui.home.HomeScreen
import com.playlist.app.ui.singers.SingerSelectScreen
import com.playlist.app.ui.playlists.PlaylistsScreen
import com.playlist.app.ui.player.PlayerScreen
import com.playlist.app.ui.songs.SongsScreen
import com.playlist.app.ui.merge.MergeScreen

@Composable
fun PlaylistNavHost() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    // Routes where bottom nav is visible
    val bottomNavRoutes = bottomNavItems.map { it.route }
    val showBottomNav = currentDestination?.route in bottomNavRoutes

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            bottomBar = {
                if (showBottomNav) {
                    BottomNavBar(navController = navController)
                }
            }
        ) { innerPadding ->
            Box(modifier = Modifier.fillMaxSize()) {
                NavHost(
                    navController = navController,
                    startDestination = NavRoutes.HOME,
                    modifier = Modifier.padding(innerPadding)
                ) {
                    composable(NavRoutes.HOME) {
                        HomeScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            },
                            onNavigateToSingers = {
                                navController.navigate(NavRoutes.SINGERS)
                            }
                        )
                    }

                    composable(NavRoutes.SINGERS) {
                        SingerSelectScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            }
                        )
                    }

                    composable(NavRoutes.PLAYLISTS) {
                        PlaylistsScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            }
                        )
                    }

                    composable(NavRoutes.PLAYER) {
                        PlayerScreen()
                    }

                    composable(NavRoutes.SONGS) {
                        SongsScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            }
                        )
                    }

                    composable(NavRoutes.MERGE) {
                        MergeScreen()
                    }
                }

                // Toast overlay at top
                ToastContainer(
                    modifier = Modifier.align(Alignment.TopCenter)
                )
            }
        }
    }
}
