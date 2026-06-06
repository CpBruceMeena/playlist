package com.playlist.app.playlists

import app.cash.turbine.test
import com.playlist.app.data.api.models.PlaylistDto
import com.playlist.app.data.repository.PlaylistRepository
import com.playlist.app.ui.playlists.PlaylistsViewModel
import io.mockk.coEvery
import io.mockk.coVerify
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
class PlaylistsViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val playlistRepository: PlaylistRepository = mockk()
    private lateinit var viewModel: PlaylistsViewModel

    private val mockPlaylists = listOf(
        PlaylistDto("p1", "My Favorites", "bollywood hits", videoCount = 10),
        PlaylistDto("p2", "Workout Mix", "energetic songs", videoCount = 8)
    )
    private val afterDeletePlaylists = listOf(
        PlaylistDto("p2", "Workout Mix", "energetic songs", videoCount = 8)
    )

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        coEvery { playlistRepository.listPlaylists() } returnsMany listOf(
            Result.success(mockPlaylists),   // initial load
            Result.success(afterDeletePlaylists) // reload after delete
        )
        coEvery { playlistRepository.deletePlaylist(any()) } returns Result.success(Unit)
        coEvery { playlistRepository.renamePlaylist(any(), any()) } returns Result.success(
            PlaylistDto("p1", "New Name", "bollywood hits", videoCount = 10)
        )
        viewModel = PlaylistsViewModel(playlistRepository)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loads playlists on init`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(2, state.playlists.size)
            assertEquals("My Favorites", state.playlists[0].name)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `delete playlist calls API and reloads updated list`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.deletePlaylist("p1")
        testDispatcher.scheduler.advanceUntilIdle()

        // Verify the API delete was called
        coVerify { playlistRepository.deletePlaylist("p1") }

        // Verify the list was reloaded and now has 1 item (p2 only)
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(1, state.playlists.size)
            assertEquals("Workout Mix", state.playlists[0].name)
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `rename playlist updates local state`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.renamePlaylist("p1", "New Name")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        val renamed = state.playlists.find { it.id == "p1" }
        assertEquals("New Name", renamed?.name)
    }

    @Test
    fun `empty state shows correct message`() = runTest {
        coEvery { playlistRepository.listPlaylists() } returns Result.success(emptyList())

        val emptyVm = PlaylistsViewModel(playlistRepository)
        testDispatcher.scheduler.advanceUntilIdle()

        emptyVm.uiState.test {
            val state = awaitItem()
            assertTrue(state.playlists.isEmpty())
            cancelAndIgnoreRemainingEvents()
        }
    }
}
