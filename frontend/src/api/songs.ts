import type { YouTubeVideo, SavedSong } from "@playlist/types";
import { apiClient } from "./client";

export interface SaveSongRequest {
  video: YouTubeVideo;
  singerId?: string;
  singerName?: string;
}

/** Save a song to the backend (My Songs) */
export async function saveSongToBackend(
  video: YouTubeVideo,
  singerName?: string,
  singerId?: string,
): Promise<SavedSong> {
  return apiClient.post<SavedSong>("/songs", {
    video,
    ...(singerName ? { singerName } : {}),
    ...(singerId ? { singerId } : {}),
  } satisfies SaveSongRequest);
}

/** List all saved songs, newest first */
export async function listSavedSongs(): Promise<SavedSong[]> {
  return apiClient.get<SavedSong[]>("/songs");
}

/** Delete a single saved song by id */
export async function deleteSavedSong(id: string): Promise<void> {
  await apiClient.delete(`/songs/${encodeURIComponent(id)}`);
}

/** Delete all saved songs */
export async function clearAllSavedSongs(): Promise<void> {
  await apiClient.delete("/songs");
}
