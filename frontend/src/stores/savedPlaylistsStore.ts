import { create } from "zustand";
import type { YouTubeVideo, FilterCriteria } from "@playlist/types";
import {
  savePlaylistToBackend,
  listPlaylists,
  getPlaylist,
  renamePlaylist as renamePlaylistOnBackend,
  deletePlaylist as deletePlaylistOnBackend,
  type PlaylistDetail,
  type PlaylistVideoDto,
} from "../api/playlists";

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
  isLoading: boolean;
  error: string | null;

  // Actions
  loadPlaylists: () => Promise<void>;
  savePlaylist: (
    name: string,
    query: string,
    filters: FilterCriteria,
    videos: YouTubeVideo[],
  ) => Promise<{ id: string } | { error: string }>;
  deletePlaylist: (id: string) => Promise<void>;
  renamePlaylist: (id: string, newName: string) => Promise<boolean>;
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

/** Convert a playlist video from the backend into the frontend YouTubeVideo shape */
function playlistVideoToYouTubeVideo(v: PlaylistVideoDto): YouTubeVideo {
  return {
    id: v.id,
    title: v.title,
    description: "",
    channelId: v.channelId ?? "",
    channelTitle: v.channelTitle,
    thumbnailUrl: v.thumbnailUrl ?? "",
    duration: "",
    durationSeconds: v.durationSeconds,
    viewCount: v.viewCount,
    likeCount: 0,
    publishedAt: "",
    tags: [],
    videoType: "standard",
  };
}

function detailToSavedPlaylist(detail: PlaylistDetail): SavedPlaylist {
  const f = detail.filters;
  const filters: FilterCriteria = {
    query: detail.query,
    durationMin: f?.durationMin,
    durationMax: f?.durationMax,
    videoTypes: f?.videoTypes?.length ? f.videoTypes : ["music"],
    includeKeywords: f?.includeKeywords ?? [],
    excludeKeywords: f?.excludeKeywords ?? [],
    uploadDate: f?.uploadDate ?? { type: "any" },
    minViews: f?.minViews,
    maxResults: f?.maxResults || 50,
    safeSearch: f?.safeSearch ?? true,
  };

  return {
    id: detail.id,
    name: detail.name,
    query: detail.query,
    filters,
    videos: detail.videos.map(playlistVideoToYouTubeVideo),
    videoCount: detail.videos.length,
    createdAt: detail.createdAt,
    updatedAt: detail.createdAt,
  };
}

export const useSavedPlaylistsStore = create<SavedPlaylistsState>(
  (set, get) => ({
    playlists: [],
    isLoaded: false,
    isLoading: false,
    error: null,

    loadPlaylists: async () => {
      if (get().isLoaded) return;
      set({ isLoading: true, error: null });

      // One-time migration: push any playlists saved in localStorage (pre-DB
      // builds) up to the backend so nothing is lost.
      const localPlaylists = readFromStorage();

      try {
        const items = await listPlaylists();

        // Fetch full details (including videos) for each listed playlist
        const details = await Promise.all(
          items.playlists.map(async (item) => {
            try {
              return await getPlaylist(item.id);
            } catch {
              return null;
            }
          }),
        );
        const remote = details
          .filter((d): d is PlaylistDetail => d !== null)
          .map(detailToSavedPlaylist);

        const migrated: SavedPlaylist[] = [];
        const failed: SavedPlaylist[] = [];
        for (const p of localPlaylists) {
          try {
            const result = await savePlaylistToBackend(
              p.name,
              p.query,
              p.filters,
              p.videos,
            );
            migrated.push({
              id: result.id,
              name: result.name,
              query: p.query,
              filters: p.filters,
              videos: p.videos,
              videoCount: p.videos.length,
              createdAt: result.createdAt,
              updatedAt: result.createdAt,
            });
          } catch (err) {
            // Duplicates (already in the DB) are safe to drop;
            // keep un-migrated items so they are never silently lost
            if ((err as { code?: string })?.code !== "DUPLICATE_PLAYLIST") {
              failed.push(p);
            }
          }
        }

        if (localPlaylists.length > 0) {
          // Only clear localStorage once everything migrated successfully
          writeToStorage(failed);
        }

        set({
          playlists: [...remote, ...migrated],
          isLoaded: true,
          isLoading: false,
        });
      } catch (err) {
        // Backend unavailable — fall back to localStorage so the UI still works
        set({
          playlists: localPlaylists,
          isLoaded: true,
          isLoading: false,
          error:
            err instanceof Error ? err.message : "Failed to load playlists",
        });
      }
    },

    savePlaylist: async (name, query, filters, videos) => {
      if (videos.length === 0) {
        return { error: "No videos to save" };
      }

      const current = get().playlists;
      if (current.length >= MAX_PLAYLISTS) {
        return { error: `Maximum ${MAX_PLAYLISTS} playlists allowed` };
      }

      try {
        const result = await savePlaylistToBackend(
          name,
          query,
          filters,
          videos,
        );
        const now = result.createdAt;
        const newPlaylist: SavedPlaylist = {
          id: result.id,
          name: result.name,
          query,
          filters,
          videos,
          videoCount: videos.length,
          createdAt: now,
          updatedAt: now,
        };

        set({ playlists: [...current, newPlaylist] });
        return { id: result.id };
      } catch (err) {
        return {
          error:
            err instanceof Error ? err.message : "Failed to save playlist",
        };
      }
    },

    deletePlaylist: async (id) => {
      const current = get().playlists;
      const updated = current.filter((p) => p.id !== id);
      if (updated.length === current.length) return;

      // Optimistic removal — revert if the backend rejects it
      set({ playlists: updated });
      try {
        await deletePlaylistOnBackend(id);
      } catch {
        set({ playlists: current });
      }
    },

    renamePlaylist: async (id, newName) => {
      const trimmed = newName.trim();
      const current = get().playlists;
      const target = current.find((p) => p.id === id);
      if (!target || target.name === trimmed) return false;

      try {
        await renamePlaylistOnBackend(id, trimmed);
        set({
          playlists: current.map((p) =>
            p.id === id
              ? { ...p, name: trimmed, updatedAt: new Date().toISOString() }
              : p,
          ),
        });
        return true;
      } catch {
        return false;
      }
    },
  }),
);
