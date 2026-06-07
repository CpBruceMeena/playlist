import type { MergeVideoRequest, MergeResponse, MergedVideo } from "@playlist/types";
import { apiClient } from "./client";

export async function mergeVideos(
  videos: MergeVideoRequest[],
  mergeName?: string,
): Promise<MergeResponse> {
  return apiClient.post<MergeResponse>("/merge", {
    name: mergeName || "",
    videos,
  });
}

export async function listMergedVideos(): Promise<MergedVideo[]> {
  // apiClient.get already extracts .data from the response envelope
  return apiClient.get<MergedVideo[]>("/merged");
}

export async function deleteMergedVideo(id: string): Promise<void> {
  await apiClient.delete(`/merged/${id}`);
}
