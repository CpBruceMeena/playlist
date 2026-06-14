package com.playlist.app.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.playlist.app.ui.components.ToastContainer
import com.playlist.app.ui.downloads.DownloadsScreen
import com.playlist.app.ui.home.HomeScreen
import com.playlist.app.ui.merge.MergeScreen
import com.playlist.app.ui.player.PlayerScreen
import com.playlist.app.ui.playlists.PlaylistsScreen
import com.playlist.app.ui.singers.SingerSelectScreen
import com.playlist.app.ui.songs.SongsScreen
import com.playlist.app.ui.tvseries.TVSeriesScreen

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

                    composable(NavRoutes.TV_SERIES) {
                        TVSeriesScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            }
                        )
                    }

                    composable(NavRoutes.SONGS) {
                        SongsScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            }
                        )
                    }

                    composable(NavRoutes.MERGED) {
                        MergeScreen()
                    }

                    composable(NavRoutes.DOWNLOADS) {
                        DownloadsScreen(
                            onNavigateToPlayer = { url, title ->
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

                    composable(NavRoutes.SINGERS) {
                        SingerSelectScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            }
                        )
                    }

                    composable(NavRoutes.PLAYER) {
                        PlayerScreen(
                            onNavigateBack = { navController.popBackStack() }
                        )
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
