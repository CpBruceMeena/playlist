package structs

// --- API Types (mirrors types/src/index.ts) ---

// VideoType classification
type VideoType string

const (
	VideoTypeMusic    VideoType = "music"
	VideoTypeLive     VideoType = "live"
	VideoTypeShorts   VideoType = "shorts"
	VideoTypeStandard VideoType = "standard"
)

// YouTubeVideo represents a video from the YouTube API
type YouTubeVideo struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	ChannelID       string    `json:"channelId"`
	ChannelTitle    string    `json:"channelTitle"`
	ThumbnailURL    string    `json:"thumbnailUrl"`
	Duration        string    `json:"duration"`
	DurationSeconds int       `json:"durationSeconds"`
	ViewCount       int64     `json:"viewCount"`
	LikeCount       int64     `json:"likeCount"`
	PublishedAt     string    `json:"publishedAt"`
	Tags            []string  `json:"tags"`
	VideoType       VideoType `json:"videoType"`
}

// FilterCriteria mirrors the TypeScript FilterCriteria
type FilterCriteria struct {
	Query           string         `json:"query"`
	DurationMin     *int           `json:"durationMin,omitempty"`
	DurationMax     *int           `json:"durationMax,omitempty"`
	VideoTypes      []VideoType    `json:"videoTypes"`
	IncludeKeywords []string       `json:"includeKeywords"`
	ExcludeKeywords []string       `json:"excludeKeywords"`
	UploadDate      *UploadDate    `json:"uploadDate,omitempty"`
	MinViews        *int64         `json:"minViews,omitempty"`
	MaxResults      int            `json:"maxResults"`
	SafeSearch      bool           `json:"safeSearch"`
}

// UploadDate range
type UploadDate struct {
	Type  string  `json:"type"`
	Start *string `json:"start,omitempty"`
	End   *string `json:"end,omitempty"`
}

// --- API Request/Response Types ---

// GenerateRequest mirrors the TypeScript GenerateRequest
type GenerateRequest struct {
	Query   string         `json:"query" binding:"required,min=1,max=200"`
	Filters FilterCriteria `json:"filters"`
}

// GenerateResponse mirrors the TypeScript GenerateResponse
type GenerateResponse struct {
	Videos    []YouTubeVideo `json:"videos"`
	QuotaUsed int            `json:"quotaUsed"`
}

// CreatePlaylistRequest mirrors the TypeScript CreatePlaylistRequest
type CreatePlaylistRequest struct {
	Name    string         `json:"name" binding:"required,min=1,max=100"`
	Query   string         `json:"query" binding:"required"`
	Filters FilterCriteria `json:"filters"`
	Videos  []YouTubeVideo `json:"videos" binding:"required"`
}

// AuthURLResponse mirrors the TypeScript AuthUrlResponse
type AuthURLResponse struct {
	AuthURL      string `json:"authUrl"`
	CodeVerifier string `json:"codeVerifier"`
	State        string `json:"state"`
}

// AuthCallbackRequest mirrors the TypeScript AuthCallbackRequest
type AuthCallbackRequest struct {
	Code         string `json:"code" binding:"required"`
	CodeVerifier string `json:"codeVerifier" binding:"required"`
	State        string `json:"state" binding:"required"`
}

// AuthTokens mirrors the TypeScript AuthTokens
type AuthTokens struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken,omitempty"`
	ExpiresIn    int    `json:"expiresIn"`
}

// UserProfile mirrors the TypeScript UserProfile
type UserProfile struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatarUrl"`
}

// --- Multi-Singer Types ---

// SingerResponse is the response for GET /api/v1/singers
type SingerResponse struct {
	Singers []SingerListItem `json:"singers"`
	Genres  []string         `json:"genres"`
}

// SingerListItem is a single singer in the list response
type SingerListItem struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	Genre            string `json:"genre"`
	ThumbnailURL     string `json:"thumbnailUrl"`
	YouTubeChannelID string `json:"youtubeChannelId"`
	PopularityScore  int    `json:"popularityScore"`
}

// MultiSingerRequest is the request for POST /api/v1/generate/multi-singer
type MultiSingerRequest struct {
	SingerIDs        []string       `json:"singerIds" binding:"required,min=2,max=5"`
	CustomSingers    []string       `json:"customSingers,omitempty"`
	ResultsPerSinger int            `json:"resultsPerSinger" binding:"required,min=3,max=15"`
	Filters          FilterCriteria `json:"filters"`
}

// MultiSingerResponse is the response for POST /api/v1/generate/multi-singer
type MultiSingerResponse struct {
	Videos          []YouTubeVideo    `json:"videos"`
	QuotaUsed       int               `json:"quotaUsed"`
	PerSingerResults map[string]int   `json:"perSingerResults"`
	SingerNames     map[string]string `json:"singerNames"`
}

// APIError represents a standard error response
type APIError struct {
	Error APIErrorDetail `json:"error"`
}

type APIErrorDetail struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// HealthResponse for the health check endpoint
type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
}

