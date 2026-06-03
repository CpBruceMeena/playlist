import { create } from "zustand";
import type { YouTubeVideo, SavedSong } from "@playlist/types";

const STORAGE_KEY = "saved-songs";
const MAX_SONGS = 500;

interface SavedSongsState {
  songs: SavedSong[];
  isLoaded: boolean;

  // Actions
  loadFromStorage: () => void;
  addSongs: (videos: YouTubeVideo[]) => { count: number } | { error: string };
  removeSong: (id: string) => void;
  clearAll: () => void;
}

function readFromStorage(): SavedSong[] {
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

function writeToStorage(songs: SavedSong[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
    return true;
  } catch {
    return false;
  }
}

function deduplicate(existing: SavedSong[], newVideos: YouTubeVideo[]): SavedSong[] {
  const existingIds = new Set(existing.map((s) => s.videoId));
  const now = new Date().toISOString();

  const fresh: SavedSong[] = newVideos
    .filter((v) => !existingIds.has(v.id))
    .map((v) => ({
      id: crypto.randomUUID(),
      videoId: v.id,
      title: v.title,
      channelTitle: v.channelTitle,
      thumbnailUrl: v.thumbnailUrl,
      duration: v.duration,
      durationSeconds: v.durationSeconds,
      singerName: v.singerName,
      singerId: v.singerId,
      savedAt: now,
    }));

  return [...existing, ...fresh];
}

export const useSavedSongsStore = create<SavedSongsState>((set, get) => ({
  songs: [],
  isLoaded: false,

  loadFromStorage: () => {
    if (get().isLoaded) return;
    const songs = readFromStorage();
    set({ songs, isLoaded: true });
  },

  addSongs: (videos: YouTubeVideo[]) => {
    if (videos.length === 0) {
      return { error: "No videos to save" };
    }

    const current = get().songs;

    if (current.length >= MAX_SONGS) {
      return { error: `Maximum ${MAX_SONGS} songs allowed` };
    }

    const updated = deduplicate(current, videos);
    const success = writeToStorage(updated);

    if (!success) {
      return {
        error: "Could not save songs. Storage may be full or unavailable.",
      };
    }

    set({ songs: updated });
    return { count: updated.length - current.length };
  },

  removeSong: (id) => {
    const current = get().songs;
    const updated = current.filter((s) => s.id !== id);
    if (updated.length === current.length) return;
    writeToStorage(updated);
    set({ songs: updated });
  },

  clearAll: () => {
    writeToStorage([]);
    set({ songs: [] });
  },
}));
