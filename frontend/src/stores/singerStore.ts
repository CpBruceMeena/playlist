import { create } from "zustand";
import type { Singer, FilterCriteria } from "@playlist/types";
import { fetchSingers, generateMultiSingerPlaylist } from "../api/singers";
import { usePlayerStore } from "./playerStore";
import { usePlaylistStore } from "./playlistStore";

interface SingerState {
  // All singers loaded from backend
  singers: Singer[];
  genres: string[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Selection (max 5)
  selectedSingerIds: string[];

  // Per-singer result count
  resultsPerSinger: number;

  // Generation state
  isGenerating: boolean;
  generationError: string | null;

  // Singer names from latest generation (for attribution badges)
  singerNames: Record<string, string>;

  // Filter
  genreFilter: string | null;
  searchQuery: string;

  // Actions
  loadSingers: () => Promise<void>;
  setGenreFilter: (genre: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleSinger: (singerId: string) => void;
  setResultsPerSinger: (count: number) => void;
  clearSelection: () => void;
  clearError: () => void;
  clearGenerated: () => void;
  generate: (filters: FilterCriteria) => Promise<void>;
}

export const useSingerStore = create<SingerState>((set, get) => ({
  singers: [],
  genres: [],
  isLoaded: false,
  isLoading: false,
  error: null,
  selectedSingerIds: [],
  resultsPerSinger: 10,
  isGenerating: false,
  generationError: null,
  singerNames: {},
  genreFilter: null,
  searchQuery: "",

  loadSingers: async () => {
    if (get().isLoaded) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetchSingers();
      set({
        singers: response.singers,
        genres: response.genres,
        isLoaded: true,
        isLoading: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load singers";
      set({ error: message, isLoading: false });
    }
  },

  setGenreFilter: (genre) => set({ genreFilter: genre }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleSinger: (singerId) => {
    const { selectedSingerIds } = get();
    if (selectedSingerIds.includes(singerId)) {
      set({
        selectedSingerIds: selectedSingerIds.filter((id) => id !== singerId),
      });
    } else if (selectedSingerIds.length < 5) {
      set({ selectedSingerIds: [...selectedSingerIds, singerId] });
    }
  },

  setResultsPerSinger: (count) => set({ resultsPerSinger: count }),

  clearSelection: () => set({ selectedSingerIds: [] }),

  clearError: () => set({ error: null, generationError: null }),

  clearGenerated: () => set({ singerNames: {} }),

  generate: async (filters) => {
    const { selectedSingerIds, resultsPerSinger } = get();

    if (selectedSingerIds.length < 2) {
      set({ generationError: "Please select at least 2 singers" });
      return;
    }

    set({ isGenerating: true, generationError: null });

    try {
      const response = await generateMultiSingerPlaylist(
        selectedSingerIds,
        resultsPerSinger,
        filters,
      );

      if (!response.videos || response.videos.length === 0) {
        set({
          isGenerating: false,
          generationError:
            "No videos found for the selected singers. Try different filters.",
        });
        return;
      }

      // Annotate videos with singer attribution based on perSingerResults order
      const annotatedVideos = [];
      let videoIndex = 0;
      for (const singerId of selectedSingerIds) {
        const count = response.perSingerResults[singerId] || 0;
        const singerName = response.singerNames[singerId] || "";
        for (let i = 0; i < count && videoIndex < response.videos.length; i++) {
          annotatedVideos.push({
            ...response.videos[videoIndex],
            singerId,
            singerName,
          });
          videoIndex++;
        }
      }

      // Append any remaining videos
      while (videoIndex < response.videos.length) {
        annotatedVideos.push(response.videos[videoIndex]);
        videoIndex++;
      }

      // Initialize the player store with the annotated videos
      usePlayerStore.getState().initQueue(annotatedVideos);

      // Also populate playlistStore so PlaylistPage renders the player correctly
      usePlaylistStore.getState().setVideos(annotatedVideos);

      set({
        singerNames: response.singerNames,
        isGenerating: false,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      set({ isGenerating: false, generationError: message });
    }
  },
}));

// Helper — check if any videos in the current queue have singer attribution
export function hasSingerAttribution(queue: { singerName?: string }[]): boolean {
  return queue.some((v) => v.singerName);
}
