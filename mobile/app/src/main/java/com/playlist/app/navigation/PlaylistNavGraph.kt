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
import com.playlist.app.ApiConfig
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.data.repository.DownloadManager
import com.playlist.app.data.repository.DownloadRepository
import com.playlist.app.data.repository.SongRepository
import com.playlist.app.ui.components.ToastContainer
import com.playlist.app.ui.downloads.DownloadsScreen
import com.playlist.app.ui.home.HomeScreen
import com.playlist.app.ui.merge.MergeScreen
import com.playlist.app.ui.player.PlayerScreen
import com.playlist.app.ui.player.PlayerState
import com.playlist.app.ui.player.VideoFileItem
import com.playlist.app.ui.playlists.PlaylistsScreen
import com.playlist.app.ui.profile.ProfileScreen
import com.playlist.app.ui.singers.SingerSelectScreen
import com.playlist.app.ui.songs.SongsScreen
import com.playlist.app.ui.tvseries.TVSeriesScreen

@Composable
fun PlaylistNavHost(
    externalNavigateToPlayer: Boolean = false,
    onExternalNavigationHandled: () -> Unit = {},
    songRepository: SongRepository? = null,
    downloadRepository: DownloadRepository? = null,
    downloadManager: DownloadManager? = null
) {
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
                    modifier = Modifier.padding(bottom = innerPadding.calculateBottomPadding())
                ) {
                    composable(NavRoutes.HOME) {
                        HomeScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            },
                            onNavigateToSingerSheet = {
                                navController.navigate(NavRoutes.SINGERS)
                            },
                            onNavigateToTVSeries = {
                                navController.navigate(NavRoutes.TV_SERIES)
                            }
                        )
                    }

                    composable(NavRoutes.TV_SERIES) {
                        TVSeriesScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            },
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }

                    composable(NavRoutes.SONGS) {
                        SongsScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            },
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }

                    composable(NavRoutes.MERGED) {
                        MergeScreen(
                            onPlayMergedVideo = { url, title, thumbnailUrl, allMerged ->
                                if (allMerged.size > 1) {
                                    // Build a full queue from all merged videos
                                    val queue = allMerged.mapNotNull { m ->
                                        val mu = m.videoUrl ?: m.url ?: return@mapNotNull null
                                        val fullUrl = if (mu.startsWith("http")) mu
                                            else if (mu.startsWith("/")) "${ApiConfig.BASE_URL}$mu"
                                            else "${ApiConfig.BASE_URL}/playlist/api/v1/downloads/$mu"
                                        val mt = m.title ?: m.name ?: m.filename ?: "Merged Video"
                                        VideoFileItem(
                                            url = fullUrl,
                                            title = mt,
                                            thumbnailUrl = m.thumbnailUrl,
                                            duration = m.duration,
                                            fileSize = 0L
                                        )
                                    }
                                    val startIndex = queue.indexOfFirst { it.title == title }.coerceAtLeast(0)
                                    if (queue.isNotEmpty()) {
                                        PlayerState.setVideoFileQueue(queue, startIndex)
                                    } else {
                                        PlayerState.setVideoFile(VideoFileItem(url = url, title = title, thumbnailUrl = thumbnailUrl))
                                    }
                                } else {
                                    PlayerState.setVideoFile(VideoFileItem(url = url, title = title, thumbnailUrl = thumbnailUrl))
                                }
                                navController.navigate(NavRoutes.PLAYER)
                            },
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            },
                            onNavigateBack = { navController.popBackStack() }
                        )
                    }

                    composable(NavRoutes.DOWNLOADS) {
                        DownloadsScreen(
                            onNavigateBack = { navController.popBackStack() },
                            onNavigateToPlayer = { url, title, allDownloads ->
                                if (url.isNotBlank()) {
                                    if (url.contains("watch?v=")) {
                                        val videoId = url.substringAfter("watch?v=").substringBefore("&")
                                        if (videoId.isNotBlank()) {
                                            PlayerState.setQueue(listOf(
                                                YouTubeVideoDto(id = videoId, title = title, channelTitle = "")
                                            ))
                                            navController.navigate(NavRoutes.PLAYER)
                                        }
                                    } else {
                                        val queue = allDownloads.map { item ->
                                            val fullUrl = if (item.url.startsWith("http")) item.url
                                                else if (item.url.startsWith("/")) "${ApiConfig.BASE_URL}${item.url}"
                                                else "${ApiConfig.BASE_URL}/playlist/api/v1/downloads/${item.url}"
                                            item.copy(url = fullUrl)
                                        }
                                        val startIndex = queue.indexOfFirst { it.title == title }.coerceAtLeast(0)
                                        PlayerState.setVideoFileQueue(queue, startIndex)
                                        navController.navigate(NavRoutes.PLAYER)
                                    }
                                }
                            }
                        )
                    }

                    composable(NavRoutes.PROFILE) {
                        ProfileScreen(
                            onSectionClick = { route ->
                                navController.navigate(route)
                            },
                            onNavigateBack = { navController.popBackStack() }
                        )
                    }

                    composable(NavRoutes.PLAYLISTS) {
                        PlaylistsScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            },
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }

                    composable(NavRoutes.SINGERS) {
                        SingerSelectScreen(
                            onNavigateToPlayer = {
                                navController.navigate(NavRoutes.PLAYER)
                            },
                            onNavigateBack = {
                                navController.popBackStack()
                            }
                        )
                    }

                    composable(NavRoutes.PLAYER) {
                        PlayerScreen(
                            onNavigateBack = { navController.popBackStack() },
                            songRepository = songRepository,
                            downloadRepository = downloadRepository,
                            downloadManager = downloadManager
                        )
                    }
                }

                // External navigation trigger (from share sheet Play button)
                LaunchedEffect(externalNavigateToPlayer) {
                    if (externalNavigateToPlayer) {
                        navController.navigate(NavRoutes.PLAYER) {
                            launchSingleTop = true
                        }
                        onExternalNavigationHandled()
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
