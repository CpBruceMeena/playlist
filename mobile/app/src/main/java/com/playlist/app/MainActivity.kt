package com.playlist.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.playlist.app.navigation.PlaylistNavHost
import com.playlist.app.ui.theme.NeonColors
import com.playlist.app.ui.theme.PlaylistTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            PlaylistTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = NeonColors.DeepObsidian
                ) {
                    PlaylistNavHost()
                }
            }
        }
    }
}
