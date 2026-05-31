package clients

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

// YouTube types mirror the structs package types but are used internally by the client
type YouTubeSearchResult struct {
	ID      string `json:"id"`
	Title   string `json:"title"`
	Channel string `json:"channel"`
}

type YouTubeClient struct {
	apiKey     string
	httpClient *http.Client
	cache      map[string]*cacheEntry
}

type cacheEntry struct {
	data      []byte
	expiresAt time.Time
}

type youtubeSearchResponse struct {
	Items []struct {
		ID struct {
			VideoID string `json:"videoId"`
		} `json:"id"`
		Snippet struct {
			PublishedAt string `json:"publishedAt"`
			ChannelID   string `json:"channelId"`
			Title       string `json:"title"`
			Description string `json:"description"`
			ChannelTitle string `json:"channelTitle"`
			Thumbnails  struct {
				High struct {
					URL string `json:"url"`
				} `json:"high"`
				Medium struct {
					URL string `json:"url"`
				} `json:"medium"`
			} `json:"thumbnails"`
			Tags []string `json:"tags"`
		} `json:"snippet"`
	} `json:"items"`
	PageInfo struct {
		TotalResults   int `json:"totalResults"`
		ResultsPerPage int `json:"resultsPerPage"`
	} `json:"pageInfo"`
}

type youtubeVideoResponse struct {
	Items []struct {
		ID      string `json:"id"`
		Snippet struct {
			PublishedAt  string   `json:"publishedAt"`
			ChannelID    string   `json:"channelId"`
			Title        string   `json:"title"`
			Description  string   `json:"description"`
			ChannelTitle string   `json:"channelTitle"`
			Tags         []string `json:"tags"`
			Thumbnails   struct {
				High struct {
					URL string `json:"url"`
				} `json:"high"`
				Medium struct {
					URL string `json:"url"`
				} `json:"medium"`
			} `json:"thumbnails"`
		} `json:"snippet"`
		ContentDetails struct {
			Duration string `json:"duration"`
		} `json:"contentDetails"`
		Statistics struct {
			ViewCount string `json:"viewCount"`
			LikeCount string `json:"likeCount"`
		} `json:"statistics"`
	} `json:"items"`
}

func NewYouTubeClient(apiKey string) *YouTubeClient {
	return &YouTubeClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		cache: make(map[string]*cacheEntry),
	}
}

// getOrFetch checks cache first, then fetches from the YouTube API
func (c *YouTubeClient) getOrFetch(cacheKey string, url string) ([]byte, error) {
	// Check cache (30-minute TTL)
	if entry, ok := c.cache[cacheKey]; ok && time.Now().Before(entry.expiresAt) {
		return entry.data, nil
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch from YouTube API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("YouTube API returned status %d: %s", resp.StatusCode, string(body))
	}

	// Cache for 30 minutes
	c.cache[cacheKey] = &cacheEntry{
		data:      body,
		expiresAt: time.Now().Add(30 * time.Minute),
	}

	return body, nil
}

// SearchVideos searches YouTube for videos matching the query
// Returns video IDs and basic info
func (c *YouTubeClient) SearchVideos(query string, maxResults int) ([]YouTubeSearchResult, error) {
	params := url.Values{
		"part":        {"snippet"},
		"q":           {query},
		"maxResults":  {strconv.Itoa(maxResults)},
		"type":        {"video"},
		"videoEmbeddable": {"true"},
		"key":         {c.apiKey},
	}

	apiURL := fmt.Sprintf("https://www.googleapis.com/youtube/v3/search?%s", params.Encode())
	cacheKey := fmt.Sprintf("search:%s:%d", query, maxResults)

	data, err := c.getOrFetch(cacheKey, apiURL)
	if err != nil {
		return nil, err
	}

	var searchResp youtubeSearchResponse
	if err := json.Unmarshal(data, &searchResp); err != nil {
		return nil, fmt.Errorf("failed to parse search response: %w", err)
	}

	results := make([]YouTubeSearchResult, 0, len(searchResp.Items))
	for _, item := range searchResp.Items {
		if item.ID.VideoID == "" {
			continue
		}
		results = append(results, YouTubeSearchResult{
			ID:      item.ID.VideoID,
			Title:   item.Snippet.Title,
			Channel: item.Snippet.ChannelTitle,
		})
	}

	return results, nil
}

// GetVideoDetails fetches detailed information for a batch of video IDs
// YouTube API allows up to 50 IDs per request
func (c *YouTubeClient) GetVideoDetails(videoIDs []string) ([]VideoDetail, error) {
	if len(videoIDs) == 0 {
		return nil, nil
	}

	// Process in batches of 50
	var allDetails []VideoDetail
	for i := 0; i < len(videoIDs); i += 50 {
		end := i + 50
		if end > len(videoIDs) {
			end = len(videoIDs)
		}
		batch := videoIDs[i:end]
		details, err := c.getVideoDetailsBatch(batch)
		if err != nil {
			return nil, err
		}
		allDetails = append(allDetails, details...)
	}

	return allDetails, nil
}

type VideoDetail struct {
	ID              string
	Title           string
	Description     string
	ChannelID       string
	ChannelTitle    string
	ThumbnailURL    string
	Duration        string // ISO 8601
	DurationSeconds int
	ViewCount       int64
	LikeCount       int64
	PublishedAt     string
	Tags            []string
}

func (c *YouTubeClient) getVideoDetailsBatch(videoIDs []string) ([]VideoDetail, error) {
	params := url.Values{
		"part": {"snippet,contentDetails,statistics"},
		"id":   {strings.Join(videoIDs, ",")},
		"key":  {c.apiKey},
	}

	apiURL := fmt.Sprintf("https://www.googleapis.com/youtube/v3/videos?%s", params.Encode())
	// Use sorted video IDs as cache key
	sortedIDs := make([]string, len(videoIDs))
	copy(sortedIDs, videoIDs)
	sort.Strings(sortedIDs)
	cacheKey := fmt.Sprintf("videos:%s", strings.Join(sortedIDs, ","))

	data, err := c.getOrFetch(cacheKey, apiURL)
	if err != nil {
		return nil, err
	}

	var videoResp youtubeVideoResponse
	if err := json.Unmarshal(data, &videoResp); err != nil {
		return nil, fmt.Errorf("failed to parse video response: %w", err)
	}

	details := make([]VideoDetail, 0, len(videoResp.Items))
	for _, item := range videoResp.Items {
		viewCount, _ := strconv.ParseInt(item.Statistics.ViewCount, 10, 64)
		likeCount, _ := strconv.ParseInt(item.Statistics.LikeCount, 10, 64)

		// Pick the best available thumbnail
		thumbnailURL := item.Snippet.Thumbnails.High.URL
		if thumbnailURL == "" {
			thumbnailURL = item.Snippet.Thumbnails.Medium.URL
		}

		durationSeconds := parseISO8601Duration(item.ContentDetails.Duration)

		details = append(details, VideoDetail{
			ID:              item.ID,
			Title:           item.Snippet.Title,
			Description:     item.Snippet.Description,
			ChannelID:       item.Snippet.ChannelID,
			ChannelTitle:    item.Snippet.ChannelTitle,
			ThumbnailURL:    thumbnailURL,
			Duration:        item.ContentDetails.Duration,
			DurationSeconds: durationSeconds,
			ViewCount:       viewCount,
			LikeCount:       likeCount,
			PublishedAt:     item.Snippet.PublishedAt,
			Tags:            item.Snippet.Tags,
		})
	}

	return details, nil
}

// SearchAndGetDetails performs a search and fetches video details in one call
func (c *YouTubeClient) SearchAndGetDetails(query string, maxResults int) ([]VideoDetail, error) {
	searchResults, err := c.SearchVideos(query, maxResults)
	if err != nil {
		return nil, fmt.Errorf("search failed: %w", err)
	}

	if len(searchResults) == 0 {
		return nil, nil
	}

	videoIDs := make([]string, len(searchResults))
	for i, r := range searchResults {
		videoIDs[i] = r.ID
	}

	details, err := c.GetVideoDetails(videoIDs)
	if err != nil {
		return nil, fmt.Errorf("video details fetch failed: %w", err)
	}

	return details, nil
}

// parseISO8601Duration converts YouTube's ISO 8601 duration (e.g., "PT4M13S") to seconds
func parseISO8601Duration(duration string) int {
	// Remove "PT" prefix
	duration = strings.TrimPrefix(duration, "PT")
	if duration == "" {
		return 0
	}

	hours := 0
	minutes := 0
	seconds := 0

	// Parse hours
	if idx := strings.Index(duration, "H"); idx != -1 {
		hours, _ = strconv.Atoi(duration[:idx])
		duration = duration[idx+1:]
	}

	// Parse minutes
	if idx := strings.Index(duration, "M"); idx != -1 {
		minutes, _ = strconv.Atoi(duration[:idx])
		duration = duration[idx+1:]
	}

	// Parse seconds
	if idx := strings.Index(duration, "S"); idx != -1 {
		seconds, _ = strconv.Atoi(duration[:idx])
	}

	return hours*3600 + minutes*60 + seconds
}
