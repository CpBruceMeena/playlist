package com.playlist.app.home

import app.cash.turbine.test
import com.playlist.app.data.api.models.FilterCriteriaDto
import com.playlist.app.data.api.models.GenerateResponseDto
import com.playlist.app.data.api.models.YouTubeVideoDto
import com.playlist.app.data.repository.GenerateRepository
import com.playlist.app.data.repository.SingerRepository
import com.playlist.app.ui.home.HomeViewModel
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val generateRepository: GenerateRepository = mockk()
    private val singerRepository: SingerRepository = mockk()
    private lateinit var viewModel: HomeViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        viewModel = HomeViewModel(generateRepository, singerRepository)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `initial state has empty query and featured singers`() = runTest {
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals("", state.searchQuery)
            assertFalse(state.isGenerating)
            assertTrue(state.featuredSingers.isNotEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `search query change updates state`() {
        viewModel.onSearchQueryChange("A.R. Rahman")
        assertEquals("A.R. Rahman", viewModel.uiState.value.searchQuery)
    }

    @Test
    fun `empty query shows error`() = runTest {
        viewModel.generatePlaylist()
        viewModel.uiState.test {
            val state = awaitItem()
            assertNotNull(state.error)
            assertTrue(state.error?.contains("search query") == true)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `successful generation updates state and navigates`() = runTest {
        val mockVideos = listOf(
            YouTubeVideoDto(
                id = "vid1",
                title = "Test Song",
                channelTitle = "Test Artist",
                thumbnailUrl = "https://example.com/thumb.jpg",
                durationSeconds = 240
            )
        )
        val mockResponse = GenerateResponseDto(videos = mockVideos, quotaUsed = 1)

        coEvery {
            generateRepository.generatePlaylist(any(), any())
        } returns Result.success(mockResponse)

        viewModel.onSearchQueryChange("test song")
        viewModel.generatePlaylist()
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.uiState.test {
            val state = awaitItem()
            assertFalse(state.isGenerating)
            assertEquals(1, state.generatedVideos.size)
            assertEquals("Test Song", state.generatedVideos[0].title)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `failed generation sets error state`() = runTest {
        coEvery {
            generateRepository.generatePlaylist(any(), any())
        } returns Result.failure(Exception("API error"))

        viewModel.onSearchQueryChange("test song")
        viewModel.generatePlaylist()
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.uiState.test {
            val state = awaitItem()
            assertFalse(state.isGenerating)
            assertEquals("API error", state.error)
            cancelAndIgnoreRemainingEvents()
        }
    }
}
