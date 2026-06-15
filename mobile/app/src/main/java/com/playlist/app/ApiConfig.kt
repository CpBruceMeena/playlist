package com.playlist.app

/**
 * Central API configuration — change BASE_URL here to switch environments.
 * When running against a local backend via the Android emulator, use http://10.0.2.2:3001
 * When running against a remote/staging backend, use the ngrok or deployed URL.
 *
 * The Retrofit baseUrl in NetworkModule uses this same constant with the /playlist/api/v1/ suffix.
 */
object ApiConfig {
    /**
     * Base URL **without** trailing path — used for constructing download/merge file URLs.
     * The Retrofit baseUrl in NetworkModule appends the full API path.
     */
    const val BASE_URL = "https://helpful-supposedly-moose.ngrok-free.app"

    /** Full path used as the Retrofit baseUrl (includes API version prefix). */
    const val RETROFIT_BASE_URL = "$BASE_URL/playlist/api/v1/"
}
