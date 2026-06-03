// ─── Video Types ───────────────────────────────────────────────
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string; // ISO 8601 (e.g., "PT4M13S")
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  tags: string[];
  videoType: VideoType;
  // Singer attribution (multi-singer feature)
  singerId?: string;
  singerName?: string;
}

export type VideoType = "music" | "live" | "shorts" | "standard";

// ─── Filter Types ──────────────────────────────────────────────
export interface FilterCriteria {
  query: string;
  durationMin?: number; // seconds
  durationMax?: number; // seconds
  videoTypes: VideoType[];
  includeKeywords: string[];
  excludeKeywords: string[];
  uploadDate?: UploadDateRange;
  minViews?: number;
  maxResults: number;
  safeSearch: boolean;
}

export type UploadDateRange =
  | { type: "any" }
  | { type: "last_week" }
  | { type: "last_month" }
  | { type: "last_year" }
  | { type: "custom"; start: string; end: string };

// ─── Playlist Types ────────────────────────────────────────────
export interface Playlist {
  id: string;
  name: string;
  query: string;
  filters: FilterCriteria;
  videos: PlaylistVideo[];
  userId: string | null;
  shareId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistVideo {
  id: string;
  playlistId: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string;
  durationSeconds: number;
  position: number;
}

// ─── API Types ─────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
  };
}

export interface GenerateRequest {
  query: string;
  filters: FilterCriteria;
}

export interface GenerateResponse {
  videos: YouTubeVideo[];
  quotaUsed: number;
}

export interface CreatePlaylistRequest {
  name: string;
  query: string;
  filters: FilterCriteria;
  videos: YouTubeVideo[];
}

export interface AuthUrlResponse {
  authUrl: string;
  codeVerifier: string;
  state: string;
}

export interface AuthCallbackRequest {
  code: string;
  codeVerifier: string;
  state: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

// ─── Singer Types ──────────────────────────────────────────────
export interface Singer {
  id: string;
  name: string;
  genre: string;
  thumbnailUrl: string;
  youtubeChannelId: string;
  popularityScore: number;
  isActive: boolean;
}

export interface SingerResponse {
  singers: Singer[];
  genres: string[];
}

export interface MultiSingerRequest {
  singerIds: string[];
  customSingers?: string[];       // Custom singer names not in DB
  resultsPerSinger: number;
  filters: FilterCriteria;
}

export interface MultiSingerResponse {
  videos: YouTubeVideo[];
  quotaUsed: number;
  perSingerResults: Record<string, number>;
  singerNames: Record<string, string>;
}


// ─── Player Types ──────────────────────────────────────────────
export type PlayerState = "unstarted" | "playing" | "paused" | "ended" | "buffering" | "cued";

export type RepeatMode = "none" | "all";
