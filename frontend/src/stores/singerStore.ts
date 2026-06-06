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

  // Custom singer names entered by user
  customSingerNames: string[];

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
  addCustomSinger: (name: string) => void;
  removeCustomSinger: (index: number) => void;
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
  customSingerNames: [],
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

  addCustomSinger: (name) => {
    const { customSingerNames, selectedSingerIds } = get();
    const trimmed = name.trim();
    if (!trimmed) return;
    // Check total count (DB singers + custom <= 5)
    if (selectedSingerIds.length + customSingerNames.length >= 5) return;
    // Avoid duplicates
    if (customSingerNames.includes(trimmed)) return;
    set({ customSingerNames: [...customSingerNames, trimmed] });
  },

  removeCustomSinger: (index) => {
    const { customSingerNames } = get();
    set({ customSingerNames: customSingerNames.filter((_, i) => i !== index) });
  },

  setResultsPerSinger: (count) => set({ resultsPerSinger: count }),

  clearSelection: () => set({ selectedSingerIds: [], customSingerNames: [] }),

  clearError: () => set({ error: null, generationError: null }),

  clearGenerated: () => set({ singerNames: {} }),

  generate: async (filters) => {
    const { selectedSingerIds, customSingerNames, resultsPerSinger } = get();

    if (selectedSingerIds.length + customSingerNames.length < 2) {
      set({ generationError: "Please select at least 2 singers (DB or custom)" });
      return;
    }

    set({ isGenerating: true, generationError: null });

    try {
      const response = await generateMultiSingerPlaylist(
        selectedSingerIds,
        resultsPerSinger,
        filters,
        customSingerNames.length > 0 ? customSingerNames : undefined,
      );

      if (!response.videos || response.videos.length === 0) {
        set({
          isGenerating: false,
          generationError:
            "No videos found for the selected singers. Try different filters.",
        });
        return;
      }

      // Singer names are now annotated by the backend directly on each video.
      // The backend sets singerName + singerId during dedup, so this is reliable.
      // Only fill in missing singerName for any videos that lack it.
      const annotatedVideos = response.videos.map((v) => ({
        ...v,
        singerName: v.singerName || response.singerNames[v.singerId || ""] || "",
        singerId: v.singerId || "",
      }));

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
