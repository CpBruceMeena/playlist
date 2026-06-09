import type { DownloadResponse, DownloadItem } from "@playlist/types";
import { apiClient } from "./client";

export async function startDownload(url: string): Promise<DownloadResponse> {
  return apiClient.post<DownloadResponse>("/downloads", { url });
}

export async function listDownloads(): Promise<DownloadItem[]> {
  return apiClient.get<DownloadItem[]>("/downloads");
}

export async function deleteDownload(id: string): Promise<void> {
  await apiClient.delete(`/downloads/${id}`);
}
