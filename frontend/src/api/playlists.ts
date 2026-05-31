import type { YouTubeVideo, FilterCriteria } from "@playlist/types";
import { apiClient } from "./client";

export interface SavePlaylistRequest {
  name: string;
  query: string;
  filters: FilterCriteria;
  videos: YouTubeVideo[];
}

export interface SavePlaylistResponse {
  id: string;
  name: string;
  videoCount: number;
  createdAt: string;
}

export interface PlaylistListItem {
  id: string;
  name: string;
  query: string;
  videoCount: number;
  createdAt: string;
}

export interface PlaylistListResponse {
  playlists: PlaylistListItem[];
}

export async function savePlaylistToBackend(
  name: string,
  query: string,
  filters: FilterCriteria,
  videos: YouTubeVideo[],
): Promise<SavePlaylistResponse> {
  return apiClient.post<SavePlaylistResponse>("/playlists", {
    name: name.trim() || "My Playlist",
    query,
    filters,
    videos,
  } satisfies SavePlaylistRequest);
}

export async function listPlaylists(): Promise<PlaylistListResponse> {
  return apiClient.get<PlaylistListResponse>("/playlists");
}

export async function getPlaylist(id: string): Promise<unknown> {
  return apiClient.get(`/playlists/${id}`);
}

export async function deletePlaylist(id: string): Promise<void> {
  await apiClient.delete(`/playlists/${id}`);
}
