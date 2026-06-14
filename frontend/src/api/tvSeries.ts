import type {
  TVSeriesResponse,
  TVSeriesGenerateRequest,
  TVSeriesGenerateResponse,
  FilterCriteria,
  SavedTVSeries,
} from "@playlist/types";
import { apiClient } from "./client";

export async function fetchTVSeries(
  params?: {
    channel?: string;
    search?: string;
    limit?: number;
  },
): Promise<TVSeriesResponse> {
  const queryParts: string[] = [];

  if (params?.channel) {
    queryParts.push(`channel=${encodeURIComponent(params.channel)}`);
  }
  if (params?.search) {
    queryParts.push(`search=${encodeURIComponent(params.search)}`);
  }
  if (params?.limit) {
    queryParts.push(`limit=${params.limit}`);
  }

  const queryString =
    queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  return apiClient.get<TVSeriesResponse>(`/tv-series${queryString}`);
}

export async function fetchSavedTVSeries(): Promise<SavedTVSeries[]> {
  return apiClient.get<SavedTVSeries[]>("/tv-series/saved");
}

export async function toggleSaveTVSeries(
  seriesId: string,
  seriesName: string,
  channel: string,
  genre: string,
  thumbnailUrl: string,
  popularityScore: number,
): Promise<{ saved: boolean; id?: string; item?: SavedTVSeries }> {
  return apiClient.post<{ saved: boolean; id?: string; item?: SavedTVSeries }>("/tv-series/saved", {
    seriesId,
    seriesName,
    channel,
    genre,
    thumbnailUrl,
    popularityScore,
  });
}

export async function deleteSavedTVSeries(id: string): Promise<void> {
  return apiClient.delete(`/tv-series/saved/${id}`);
}

export async function generateTVSeriesPlaylist(
  seriesId: string,
  resultsPerSeries: number,
  filters: FilterCriteria,
  customName?: string,
): Promise<TVSeriesGenerateResponse> {
  return apiClient.post<TVSeriesGenerateResponse>("/generate/tv-series", {
    seriesId,
    customName,
    resultsPerSeries,
    filters,
  } satisfies TVSeriesGenerateRequest);
}
