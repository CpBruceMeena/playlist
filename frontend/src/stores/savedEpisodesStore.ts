import { create } from "zustand";
import type { YouTubeVideo } from "@playlist/types";

const STORAGE_KEY = "saved-tv-episodes";
const MAX_EPISODES = 500;

export interface SavedEpisode {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string;
  durationSeconds: number;
  seriesName?: string;
  savedAt: string;
}

interface SavedEpisodesState {
  episodes: SavedEpisode[];
  isLoaded: boolean;

  // Actions
  loadFromStorage: () => void;
  addEpisodes: (videos: YouTubeVideo[], seriesName?: string) => { count: number } | { error: string };
  removeEpisode: (id: string) => void;
  clearAll: () => void;
}

function readFromStorage(): SavedEpisode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeToStorage(episodes: SavedEpisode[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(episodes));
    return true;
  } catch {
    return false;
  }
}

function deduplicate(existing: SavedEpisode[], newVideos: YouTubeVideo[], seriesName?: string): SavedEpisode[] {
  const existingIds = new Set(existing.map((s) => s.videoId));
  const now = new Date().toISOString();

  const fresh: SavedEpisode[] = newVideos
    .filter((v) => !existingIds.has(v.id))
    .map((v) => ({
      id: crypto.randomUUID(),
      videoId: v.id,
      title: v.title,
      channelTitle: v.channelTitle,
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      durationSeconds: v.durationSeconds,
      seriesName: seriesName,
      savedAt: now,
    }));

  return [...existing, ...fresh];
}

export const useSavedEpisodesStore = create<SavedEpisodesState>((set, get) => ({
  episodes: [],
  isLoaded: false,

  loadFromStorage: () => {
    if (get().isLoaded) return;
    const episodes = readFromStorage();
    set({ episodes, isLoaded: true });
  },

  addEpisodes: (videos: YouTubeVideo[], seriesName?: string) => {
    if (videos.length === 0) {
      return { error: "No videos to save" };
    }

    const current = get().episodes;

    if (current.length >= MAX_EPISODES) {
      return { error: `Maximum ${MAX_EPISODES} episodes allowed` };
    }

    const updated = deduplicate(current, videos, seriesName);
    const success = writeToStorage(updated);

    if (!success) {
      return {
        error: "Could not save episodes. Storage may be full or unavailable.",
      };
    }

    set({ episodes: updated });
    return { count: updated.length - current.length };
  },

  removeEpisode: (id) => {
    const current = get().episodes;
    const updated = current.filter((s) => s.id !== id);
    if (updated.length === current.length) return;
    writeToStorage(updated);
    set({ episodes: updated });
  },

  clearAll: () => {
    writeToStorage([]);
    set({ episodes: [] });
  },
}));
