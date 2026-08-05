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
  thumbnailUrl?: string;
  createdAt: string;
}

export interface PlaylistVideoDto {
  id: string;
  title: string;
  channelId?: string;
  channelTitle: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  viewCount: number;
}

export interface PlaylistDetail {
  id: string;
  name: string;
  query: string;
  filters: FilterCriteria;
  videos: PlaylistVideoDto[];
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

export async function getPlaylist(id: string): Promise<PlaylistDetail> {
  return apiClient.get<PlaylistDetail>(`/playlists/${encodeURIComponent(id)}`);
}

export async function renamePlaylist(
  id: string,
  name: string,
): Promise<{ id: string; name: string }> {
  return apiClient.patch<{ id: string; name: string }>(
    `/playlists/${encodeURIComponent(id)}`,
    { name },
  );
}

export async function deletePlaylist(id: string): Promise<void> {
  await apiClient.delete(`/playlists/${encodeURIComponent(id)}`);
}
