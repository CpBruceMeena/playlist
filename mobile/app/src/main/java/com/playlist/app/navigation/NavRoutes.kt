package com.playlist.app.navigation

object NavRoutes {
    const val HOME = "home"
    const val TV_SERIES = "tv_series"
    const val SONGS = "songs"
    const val MERGED = "merged"
    const val SINGERS = "singers"
    const val DOWNLOADS = "downloads"
    const val PLAYLISTS = "playlists"
    const val PLAYER = "player"
    const val SHARED_PLAYLIST = "shared_playlist/{shareId}"

    fun sharedPlaylistRoute(shareId: String) = "shared_playlist/$shareId"
}
