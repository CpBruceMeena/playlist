import { create } from "zustand";
import type { YouTubeVideo, FilterCriteria } from "@playlist/types";
import { generatePlaylist } from "../api/generate";

export type GenerationSource = 'search' | 'tv-series' | 'singer' | null;

interface PlaylistState {
  // Current generation
  videos: YouTubeVideo[];
  isGenerating: boolean;
  error: string | null;
  generationSource: GenerationSource;

  // Session management
  sessionId: string | null;

  // Actions
  generate: (query: string, filters: FilterCriteria) => Promise<void>;
  setVideos: (videos: YouTubeVideo[], source?: GenerationSource) => void;
  clearError: () => void;
  clearPlaylist: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  videos: [],
  isGenerating: false,
  error: null,
  generationSource: null,
  sessionId: null,

  generate: async (query, filters) => {
    if (!query.trim()) {
      set({ error: "Please enter a search query" });
      return;
    }

    set({ isGenerating: true, error: null, generationSource: null });

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

      // Dedup by YouTube video ID in case backend missed any
      const seen = new Set<string>();
      const dedupedVideos = response.videos.filter((v) => {
        if (seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });

      if (dedupedVideos.length === 0) {
        set({
          isGenerating: false,
          error: "No videos found. Try a different search query or adjust your filters.",
        });
        return;
      }

      set({
        videos: dedupedVideos,
        isGenerating: false,
        error: null,
        sessionId,
        generationSource: null,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      set({ isGenerating: false, error: message });
    }
  },

  setVideos: (videos, source) => set({ videos, generationSource: source ?? null }),

  clearError: () => set({ error: null }),

  clearPlaylist: () => {
    set({ videos: [], sessionId: null, error: null, generationSource: null });
  },
}));
