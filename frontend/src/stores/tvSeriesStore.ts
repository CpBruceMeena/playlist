import { create } from "zustand";
import type { TVSeries, SavedTVSeries, FilterCriteria } from "@playlist/types";
import { fetchTVSeries, generateTVSeriesPlaylist, fetchSavedTVSeries, toggleSaveTVSeries, deleteSavedTVSeries } from "../api/tvSeries";
import { usePlaylistStore } from "./playlistStore";

interface TVSeriesState {
  // All TV series loaded from backend
  series: TVSeries[];
  channels: string[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Saved series
  savedSeries: SavedTVSeries[];
  savedSeriesLoaded: boolean;

  // Selection
  selectedSeriesId: string | null;
  selectedSeriesName: string | null;
  customSeriesName: string;

  // Results per series
  resultsPerSeries: number;

  // Generation state
  isGenerating: boolean;
  generationError: string | null;

  // Filter
  channelFilter: string | null;
  searchQuery: string;

  // Actions
  loadSeries: () => Promise<void>;
  loadSavedSeries: () => Promise<void>;
  toggleSave: (series: TVSeries) => Promise<void>;
  isSeriesSaved: (seriesId: string) => boolean;
  setChannelFilter: (channel: string | null) => void;
  setSearchQuery: (query: string) => void;
  selectSeries: (seriesId: string, seriesName: string) => void;
  setCustomSeriesName: (name: string) => void;
  clearSelection: () => void;
  clearError: () => void;
  generate: (filters: FilterCriteria) => Promise<void>;
}

export const useTVSeriesStore = create<TVSeriesState>((set, get) => ({
  series: [],
  channels: [],
  isLoaded: false,
  isLoading: false,
  error: null,
  savedSeries: [],
  savedSeriesLoaded: false,
  selectedSeriesId: null,
  selectedSeriesName: null,
  customSeriesName: "",
  resultsPerSeries: 30,
  isGenerating: false,
  generationError: null,
  channelFilter: null,
  searchQuery: "",

  loadSeries: async () => {
    if (get().isLoaded) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetchTVSeries();
      set({
        series: response.series,
        channels: response.channels,
        isLoaded: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load TV series";
      set({ error: message, isLoading: false });
    }
  },

  setChannelFilter: (channel) => set({ channelFilter: channel }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  selectSeries: (seriesId, seriesName) =>
    set({ selectedSeriesId: seriesId, selectedSeriesName: seriesName }),

  setCustomSeriesName: (name) => set({ customSeriesName: name }),

  clearSelection: () =>
    set({
      selectedSeriesId: null,
      selectedSeriesName: null,
      customSeriesName: "",
    }),

  loadSavedSeries: async () => {
    if (get().savedSeriesLoaded) return;
    try {
      const items = await fetchSavedTVSeries();
      set({ savedSeries: items, savedSeriesLoaded: true });
    } catch {
      // Non-critical — silently fail
      set({ savedSeriesLoaded: true });
    }
  },

  toggleSave: async (series) => {
    const result = await toggleSaveTVSeries(
      series.id,
      series.name,
      series.channel,
      series.genre,
      series.thumbnailUrl,
      series.popularityScore,
    );
    if (result.saved) {
      set({ savedSeries: [...get().savedSeries, result.item!] });
    } else {
      set({ savedSeries: get().savedSeries.filter((s) => s.seriesId !== series.id) });
    }
  },

  isSeriesSaved: (seriesId) => {
    return get().savedSeries.some((s) => s.seriesId === seriesId);
  },

  clearError: () => set({ error: null, generationError: null }),

  generate: async (filters) => {
    const { selectedSeriesId, customSeriesName, resultsPerSeries } = get();

    const seriesId = selectedSeriesId || "";
    const customName = seriesId ? undefined : customSeriesName.trim();

    if (!seriesId && !customName) {
      set({
        generationError: "Please select a TV series or enter a custom name",
      });
      return;
    }

    set({ isGenerating: true, generationError: null });

    try {
      const response = await generateTVSeriesPlaylist(
        seriesId,
        resultsPerSeries,
        filters,
        customName,
      );

      if (!response.videos || response.videos.length === 0) {
        set({
          isGenerating: false,
          generationError:
            `No videos found for "${response.seriesName}". Try different filters.`,
        });
        return;
      }

      // Populate playlistStore so PlaylistPage renders the playlist
      usePlaylistStore.getState().setVideos(response.videos, 'tv-series');

      set({
        isGenerating: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      set({ isGenerating: false, generationError: message });
    }
  },
}));
