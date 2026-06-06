import { create } from "zustand";
import type { YouTubeVideo, SavedSong } from "@playlist/types";

const STORAGE_KEY = "saved-songs";
const SINGER_REPAIR_KEY = "saved-songs-repair-v1";
const MAX_SONGS = 500;

interface SavedSongsState {
  songs: SavedSong[];
  isLoaded: boolean;

  // Actions
  loadFromStorage: () => void;
  addSongs: (videos: YouTubeVideo[]) => { count: number } | { error: string };
  removeSong: (id: string) => void;
  clearAll: () => void;
  repairSingerNames: (notify?: (msg: string) => void) => void;
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

    // One-time repair: clear singer names that were misattributed by old bug
    get().repairSingerNames();
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

  repairSingerNames: (notify) => {
    // Check if repair was already done
    if (localStorage.getItem(SINGER_REPAIR_KEY)) return;

    const current = get().songs;
    const songsWithSingerNames = current.filter((s) => s.singerName);

    if (songsWithSingerNames.length === 0) {
      // No songs with singer names to repair, mark as done
      localStorage.setItem(SINGER_REPAIR_KEY, "done");
      return;
    }

    // Clear all singerName and singerId from existing songs
    const repaired: SavedSong[] = current.map((s) => ({
      ...s,
      singerName: undefined,
      singerId: undefined,
    }));

    writeToStorage(repaired);
    set({ songs: repaired });
    localStorage.setItem(SINGER_REPAIR_KEY, "done");

    notify?.(`Cleared singer names for ${songsWithSingerNames.length} song${songsWithSingerNames.length !== 1 ? "s" : ""} to fix misattribution. Future saves will use correct names.`);
  },
}));
