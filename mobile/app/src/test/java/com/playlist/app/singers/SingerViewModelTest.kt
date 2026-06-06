package com.playlist.app.singers

import app.cash.turbine.test
import com.playlist.app.data.api.models.SingerDto
import com.playlist.app.data.api.models.SingerResponseDto
import com.playlist.app.data.repository.SingerRepository
import com.playlist.app.ui.singers.SingerViewModel
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
class SingerViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private val singerRepository: SingerRepository = mockk()
    private lateinit var viewModel: SingerViewModel

    private val mockSingers = listOf(
        SingerDto("1", "A.R. Rahman", "Classical", null, null, 95),
        SingerDto("2", "Shreya Ghoshal", "Classical", null, null, 90),
        SingerDto("3", "Sonu Nigam", "Pop", null, null, 85),
        SingerDto("4", "Kishore Kumar", "Playback", null, null, 92)
    )

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        coEvery { singerRepository.listSingers() } returns Result.success(
            SingerResponseDto(mockSingers, listOf("Classical", "Pop", "Playback"))
        )
        viewModel = SingerViewModel(singerRepository)
    }

    @After
    fun teardown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `loads singers on init`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()
        viewModel.uiState.test {
            val state = awaitItem()
            assertEquals(4, state.singers.size)
            assertTrue(state.genres.contains("Classical"))
            cancelAndIgnoreRemainingEvents()
        }
    }

    @Test
    fun `genre filter filters correctly`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()
        viewModel.onGenreSelect("Pop")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(1, state.filteredSingers.size)
        assertEquals("Sonu Nigam", state.filteredSingers[0].name)
    }

    @Test
    fun `search query filters correctly`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()
        viewModel.onSearchQueryChange("kishore")
        testDispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertEquals(1, state.filteredSingers.size)
        assertEquals("Kishore Kumar", state.filteredSingers[0].name)
    }

    @Test
    fun `toggle singer adds and removes selection`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        viewModel.toggleSinger("1")
        assertTrue(viewModel.uiState.value.selectedSingerIds.contains("1"))

        viewModel.toggleSinger("1")
        assertFalse(viewModel.uiState.value.selectedSingerIds.contains("1"))
    }

    @Test
    fun `cannot select more than 5 singers`() = runTest {
        testDispatcher.scheduler.advanceUntilIdle()

        // Select 5 singers
        for (i in 1..5) {
            viewModel.toggleSinger(i.toString())
        }

        // Try to add 6th
        viewModel.toggleSinger("6")

        assertEquals(5, viewModel.uiState.value.selectedSingerIds.size)
    }

    @Test
    fun `needs minimum 2 singers to generate`() = runTest {
        viewModel.generateMultiSinger()

        val state = viewModel.uiState.value
        assertNotNull(state.error)
        assertTrue(state.error?.contains("Select at least 2") == true)
    }
}
