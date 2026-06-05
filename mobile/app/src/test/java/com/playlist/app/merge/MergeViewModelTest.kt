package com.playlist.app.merge

import app.cash.turbine.test
import com.playlist.app.data.api.models.MergeResponseDto
import com.playlist.app.data.api.models.MergeVideoRequest
import com.playlist.app.data.api.models.MergedVideoDto
import com.playlist.app.data.repository.MergeRepository
import com.playlist.app.ui.merge.MergeViewModel
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
class MergeViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val mergeRepository: MergeRepository = mockk()
    private lateinit var viewModel: MergeViewModel

    private val mockMergedVideos = listOf(
        MergedVideoDto("m1", "merged_video_1.mp4", duration = 120, status = "completed"),
        MergedVideoDto("m2", "merged_video_2.mp4", duration = 240, status = "completed")
    )

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        coEvery { mergeRepository.listMergedVideos() } returns Result.success(mockMergedVideos)
        coEvery { mergeRepository.mergeVideos(any()) } returns Result.success(
            MergeResponseDto("m3", "new_merge.mp4", "/output/new_merge.mp4", 180, "processing")
        )
        viewModel = MergeViewModel(mergeRepository)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loads merged videos on init`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()
        viewModel.uiState.test {
            val state = awaitItem()
            assertTrue(state.isLoaded)
            assertEquals(2, state.mergedVideos.size)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `triggering merge starts the process`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        val videos = listOf(
            MergeVideoRequest("v1", "Song 1", "https://youtube.com/watch?v=v1"),
            MergeVideoRequest("v2", "Song 2", "https://youtube.com/watch?v=v2")
        )

        viewModel.mergeVideos(videos)
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.uiState.test {
            val state = awaitItem()
            assertFalse(state.isMerging)
            assertEquals("Merge started: new_merge.mp4", state.mergeSuccess)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `merge failure sets error state`() = runTest {
        coEvery { mergeRepository.mergeVideos(any()) } returns Result.failure(
            Exception("Merge server unavailable")
        )

        testDispatcher.scheduler.advanceUntilIdle()

        val videos = listOf(
            MergeVideoRequest("v1", "Song 1", "https://youtube.com/watch?v=v1")
        )

        viewModel.mergeVideos(videos)
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.uiState.test {
            val state = awaitItem()
            assertFalse(state.isMerging)
            assertEquals("Merge server unavailable", state.error)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `clear messages resets error and success`() {
        viewModel = MergeViewModel(mergeRepository)

        viewModel.clearMessages()

        assertNull(viewModel.uiState.value.error)
        assertNull(viewModel.uiState.value.mergeSuccess)
    }
}
