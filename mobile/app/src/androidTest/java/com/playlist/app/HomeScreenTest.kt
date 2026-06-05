package com.playlist.app

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import com.playlist.app.ui.home.HomeScreen
import com.playlist.app.ui.theme.PlaylistTheme
import org.junit.Rule
import org.junit.Test

class HomeScreenTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun homeScreen_showsSearchBar() {
        composeTestRule.setContent {
            PlaylistTheme {
                HomeScreen(
                    onNavigateToPlayer = {},
                    onNavigateToSingers = {}
                )
            }
        }

        composeTestRule.onNodeWithText("Search songs, artists...").assertIsDisplayed()
    }

    @Test
    fun homeScreen_showsGenerateButton() {
        composeTestRule.setContent {
            PlaylistTheme {
                HomeScreen(
                    onNavigateToPlayer = {},
                    onNavigateToSingers = {}
                )
            }
        }

        composeTestRule.onNodeWithText("Generate Playlist").assertIsDisplayed()
    }

    @Test
    fun homeScreen_showsFeaturedSingersSection() {
        composeTestRule.setContent {
            PlaylistTheme {
                HomeScreen(
                    onNavigateToPlayer = {},
                    onNavigateToSingers = {}
                )
            }
        }

        composeTestRule.onNodeWithText("Featured Singers").assertIsDisplayed()
    }
}
