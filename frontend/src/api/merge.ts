import type { MergeVideoRequest, MergeResponse, MergedVideo } from "@playlist/types";
import { apiClient } from "./client";

/** Async result from a render trigger — returned immediately with processing status */
export interface RenderStarted {
  id: string;
  status: "processing";
  title: string;
  songCount: number;
  createdAt: string;
  renderOptions: { grade: string; quality: string };
}

/** A polished video item — either processing, completed, or errored */
export interface PolishedVideo {
  id: string;
  status: "processing" | "completed" | "error";
  title: string;
  thumbnailUrl?: string;
  songs: { id: string; title: string }[];
  songCount: number;
  duration?: number;
  fileSize?: number;
  renderOptions?: { grade?: string; quality?: string };
  createdAt: string;
  videoUrl?: string;
  filename?: string;
  error?: string;
}

export async function mergeVideos(
  videos: MergeVideoRequest[],
  mergeName?: string,
): Promise<MergeResponse> {
  return apiClient.post<MergeResponse>("/merge", {
    name: mergeName || "",
    videos,
  });
}

/** Trigger an async render. Returns immediately with status "processing". */
export async function renderVideos(
  videos: MergeVideoRequest[],
  options?: { grade?: string; quality?: string },
  name?: string,
): Promise<RenderStarted> {
  return apiClient.post<RenderStarted>("/render", {
    videos,
    options: {
      grade: options?.grade || "auto",
      quality: options?.quality || "final",
    },
    name: name || "",
  });
}

/** List all render items: processing, completed, and errored. */
export async function listRenderedVideos(): Promise<PolishedVideo[]> {
  return apiClient.get<PolishedVideo[]>("/rendered");
}

export async function listMergedVideos(): Promise<MergedVideo[]> {
  return apiClient.get<MergedVideo[]>("/merged");
}

export async function deleteMergedVideo(id: string): Promise<void> {
  await apiClient.delete(`/merged/${id}`);
}
