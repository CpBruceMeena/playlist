import type { MergeVideoRequest, MergeResponse, MergedVideo } from "@playlist/types";
import { apiClient } from "./client";

export async function mergeVideos(
  videos: MergeVideoRequest[],
): Promise<MergeResponse> {
  return apiClient.post<MergeResponse>("/merge", {
    videos,
  });
}

export async function listMergedVideos(): Promise<MergedVideo[]> {
  // apiClient.get already extracts .data from the response envelope
  return apiClient.get<MergedVideo[]>("/merged");
}
