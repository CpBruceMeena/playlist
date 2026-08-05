import { create } from "zustand";
import type { YouTubeVideo, SavedSong } from "@playlist/types";
import {
  saveSongToBackend,
  listSavedSongs,
  deleteSavedSong,
  clearAllSavedSongs,
} from "../api/songs";

const STORAGE_KEY = "saved-songs";
const MAX_SONGS = 500;

interface SavedSongsState {
  songs: SavedSong[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSongs: () => Promise<void>;
  addSongs: (
    videos: YouTubeVideo[],
  ) => Promise<{ count: number } | { error: string }>;
  removeSong: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

function readFromStorage(): SavedSong[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s: Record<string, unknown>) => ({
      ...s,
      // Normalize legacy items that stored the save date as `savedAt`
      createdAt: (s.createdAt as string) ?? (s.savedAt as string) ?? new Date().toISOString(),
    }) as SavedSong);
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

/** Convert a previously saved song back into a YouTubeVideo for re-saving */
function savedSongToYouTubeVideo(song: SavedSong): YouTubeVideo {
  return {
    id: song.videoId,
    title: song.title,
    description: "",
    channelId: "",
    channelTitle: song.channelTitle,
    thumbnailUrl: song.thumbnailUrl,
    duration: song.duration,
    durationSeconds: song.durationSeconds,
    viewCount: 0,
    likeCount: 0,
    publishedAt: song.createdAt,
    tags: [],
    videoType: "music",
    singerName: song.singerName,
    singerId: song.singerId,
  };
}

export const useSavedSongsStore = create<SavedSongsState>((set, get) => ({
  songs: [],
  isLoaded: false,
  isLoading: false,
  error: null,

  loadSongs: async () => {
    if (get().isLoaded) return;
    set({ isLoading: true, error: null });

    // One-time migration: push any songs saved in localStorage (pre-DB builds)
    // up to the backend so nothing is lost.
    const localSongs = readFromStorage();
    const migrated: SavedSong[] = [];

    try {
      const remote = await listSavedSongs();

      const remoteIds = new Set(remote.map((s) => s.videoId));
      const failed: SavedSong[] = [];
      for (const song of localSongs) {
        if (remoteIds.has(song.videoId)) continue;
        try {
          migrated.push(
            await saveSongToBackend(
              savedSongToYouTubeVideo(song),
              song.singerName,
              song.singerId,
            ),
          );
        } catch (err) {
          // Duplicates (already in the DB) are safe to drop;
          // keep un-migrated items so they are never silently lost
          if ((err as { code?: string })?.code !== "DUPLICATE_SONG") {
            failed.push(song);
          }
        }
      }

      if (localSongs.length > 0) {
        // Only clear localStorage once everything migrated successfully
        writeToStorage(failed);
      }

      set({
        songs: [...remote, ...migrated],
        isLoaded: true,
        isLoading: false,
      });
    } catch (err) {
      // Backend unavailable — fall back to localStorage so the UI still works
      set({
        songs: localSongs,
        isLoaded: true,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load saved songs",
      });
    }
  },

  addSongs: async (videos) => {
    if (videos.length === 0) {
      return { error: "No videos to save" };
    }

    const current = get().songs;
    const existingIds = new Set(current.map((s) => s.videoId));
    const fresh = videos.filter((v) => !existingIds.has(v.id));

    if (fresh.length === 0) {
      return { count: 0 };
    }

    if (current.length + fresh.length > MAX_SONGS) {
      return { error: `Maximum ${MAX_SONGS} songs allowed` };
    }

    const saved: SavedSong[] = [];
    for (const video of fresh) {
      try {
        saved.push(
          await saveSongToBackend(video, video.singerName, video.singerId),
        );
      } catch (err) {
        // Keep anything that was already persisted so the UI stays in sync
        if (saved.length > 0) {
          set({ songs: [...current, ...saved] });
        }
        return {
          error:
            err instanceof Error ? err.message : "Failed to save songs",
        };
      }
    }

    set({ songs: [...current, ...saved] });
    return { count: saved.length };
  },

  removeSong: async (id) => {
    const current = get().songs;
    const updated = current.filter((s) => s.id !== id);
    if (updated.length === current.length) return;

    // Optimistic removal — revert if the backend rejects it
    set({ songs: updated });
    try {
      await deleteSavedSong(id);
    } catch {
      set({ songs: current });
    }
  },

  clearAll: async () => {
    try {
      await clearAllSavedSongs();
    } catch {
      // Best-effort: clear locally even if the backend call fails
    }
    set({ songs: [] });
  },
}));
