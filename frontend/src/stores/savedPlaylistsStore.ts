import { create } from "zustand";
import type { YouTubeVideo, FilterCriteria } from "@playlist/types";

const STORAGE_KEY = "saved-playlists";
const MAX_PLAYLISTS = 50;

export interface SavedPlaylist {
  id: string;
  name: string;
  query: string;
  filters: FilterCriteria;
  videos: YouTubeVideo[];
  videoCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SavedPlaylistsState {
  playlists: SavedPlaylist[];
  isLoaded: boolean;

  // Actions
  loadFromStorage: () => void;
  savePlaylist: (
    name: string,
    query: string,
    filters: FilterCriteria,
    videos: YouTubeVideo[]
  ) => { id: string } | { error: string };
  deletePlaylist: (id: string) => void;
  getPlaylist: (id: string) => SavedPlaylist | undefined;
}

function readFromStorage(): SavedPlaylist[] {
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

function writeToStorage(playlists: SavedPlaylist[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
    return true;
  } catch {
    return false;
  }
}

export const useSavedPlaylistsStore = create<SavedPlaylistsState>(
  (set, get) => ({
    playlists: [],
    isLoaded: false,

    loadFromStorage: () => {
      if (get().isLoaded) return;
      const playlists = readFromStorage();
      set({ playlists, isLoaded: true });
    },

    savePlaylist: (name, query, filters, videos) => {
      if (videos.length === 0) {
        return { error: "No videos to save" };
      }

      const current = get().playlists;

      if (current.length >= MAX_PLAYLISTS) {
        return { error: `Maximum ${MAX_PLAYLISTS} playlists allowed` };
      }

      const now = new Date().toISOString();
      const newPlaylist: SavedPlaylist = {
        id: crypto.randomUUID(),
        name: name.trim() || "My Playlist",
        query,
        filters,
        videos,
        videoCount: videos.length,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...current, newPlaylist];
      const success = writeToStorage(updated);

      if (!success) {
        return {
          error:
            "Could not save playlist. Storage may be full or unavailable.",
        };
      }

      set({ playlists: updated });
      return { id: newPlaylist.id };
    },

    deletePlaylist: (id) => {
      const current = get().playlists;
      const updated = current.filter((p) => p.id !== id);
      if (updated.length === current.length) return; // nothing changed

      writeToStorage(updated);
      set({ playlists: updated });
    },

    getPlaylist: (id) => {
      return get().playlists.find((p) => p.id === id);
    },
  })
);
