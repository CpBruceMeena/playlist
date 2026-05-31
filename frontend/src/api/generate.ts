import type { GenerateRequest, GenerateResponse } from "@playlist/types";
import { apiClient } from "./client";

export async function generatePlaylist(
  query: string,
  filters: GenerateRequest["filters"],
): Promise<GenerateResponse> {
  return apiClient.post<GenerateResponse>("/generate", {
    query,
    filters,
  } satisfies GenerateRequest);
}
