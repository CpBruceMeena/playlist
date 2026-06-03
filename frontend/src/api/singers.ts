import type {
  SingerResponse,
  MultiSingerRequest,
  MultiSingerResponse,
  FilterCriteria,
} from "@playlist/types";
import { apiClient } from "./client";

export async function fetchSingers(
  params?: {
    genre?: string;
    search?: string;
    limit?: number;
  },
): Promise<SingerResponse> {
  const queryParts: string[] = [];

  if (params?.genre) {
    queryParts.push(`genre=${encodeURIComponent(params.genre)}`);
  }
  if (params?.search) {
    queryParts.push(`search=${encodeURIComponent(params.search)}`);
  }
  if (params?.limit) {
    queryParts.push(`limit=${params.limit}`);
  }

  const queryString =
    queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return apiClient.get<SingerResponse>(`/singers${queryString}`);
}

export async function generateMultiSingerPlaylist(
  singerIds: string[],
  resultsPerSinger: number,
  filters: FilterCriteria,
  customSingers?: string[],
): Promise<MultiSingerResponse> {
  return apiClient.post<MultiSingerResponse>("/generate/multi-singer", {
    singerIds,
    customSingers,
    resultsPerSinger,
    filters,
  } satisfies MultiSingerRequest);
}
