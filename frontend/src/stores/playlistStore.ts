import { create } from "zustand";
import type { YouTubeVideo, FilterCriteria } from "@playlist/types";
import { generatePlaylist } from "../api/generate";
import { usePlayerStore } from "./playerStore";

interface PlaylistState {
  // Current generation
  videos: YouTubeVideo[];
  isGenerating: boolean;
  error: string | null;

  // Session management
  sessionId: string | null;

  // Actions
  generate: (query: string, filters: FilterCriteria) => Promise<void>;
  setVideos: (videos: YouTubeVideo[]) => void;
  clearError: () => void;
  clearPlaylist: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  videos: [],
  isGenerating: false,
  error: null,
  sessionId: null,

  generate: async (query, filters) => {
    if (!query.trim()) {
      set({ error: "Please enter a search query" });
      return;
    }

    set({ isGenerating: true, error: null });

    try {
      const response = await generatePlaylist(query, filters);

      if (!response.videos || response.videos.length === 0) {
        set({
          isGenerating: false,
          error: "No videos found. Try a different search query or adjust your filters.",
        });
        return;
      }

      const sessionId = crypto.randomUUID();

      // Initialize the player store with the new videos
      usePlayerStore.getState().initQueue(response.videos);

      set({
        videos: response.videos,
        isGenerating: false,
        error: null,
        sessionId,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      set({ isGenerating: false, error: message });
    }
  },

  setVideos: (videos) => set({ videos }),

  clearError: () => set({ error: null }),

  clearPlaylist: () => {
    usePlayerStore.getState().clearQueue();
    set({ videos: [], sessionId: null, error: null });
  },
}));
