package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/clients"
	"playlist-backend/services"
	"playlist-backend/structs"
)

type GenerateHandler struct {
	DB            *gorm.DB
	YouTubeClient *clients.YouTubeClient
	FilterService *services.FilterService
	CacheService  *services.CacheService
}

func NewGenerateHandler(db *gorm.DB, ytClient *clients.YouTubeClient, filterSvc *services.FilterService, cacheSvc *services.CacheService) *GenerateHandler {
	return &GenerateHandler{
		DB:            db,
		YouTubeClient: ytClient,
		FilterService: filterSvc,
		CacheService:  cacheSvc,
	}
}

// Generate handles POST /api/v1/generate
// Searches YouTube, applies filters, and returns matching videos
func (h *GenerateHandler) Generate(c *gin.Context) {
	var req structs.GenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiError(c, http.StatusBadRequest, "Invalid request: "+err.Error(), "VALIDATION_ERROR")
		return
	}

	// Determine how many results to fetch from YouTube (fetch extra to account for filtering)
	fetchCount := req.Filters.MaxResults
	if fetchCount <= 0 {
		fetchCount = 50 // default
	}
	// Fetch a multiplier to account for filtered-out videos
	fetchCount = min(fetchCount*3, 50) // YouTube API max is 50 per page

	// Check cache first
	cacheKey := services.GenerateSearchCacheKey(req.Query, fetchCount)
	cachedVideos, cachedQuota, cacheErr := h.CacheService.GetCachedResult(cacheKey)

	var videos []clients.VideoDetail
	var err error
	var fromCache bool
	var quotaUsed int

	if cacheErr == nil && cachedVideos != nil {
		// Cache hit — use cached data
		videos = cachedVideos
		if cachedQuota != nil {
			quotaUsed = *cachedQuota
		}
		fromCache = true
		log.Printf("📦 Serving cached result for query: %s", req.Query[:min(len(req.Query), 60)])
	} else {
		// Cache miss — call YouTube API
		videos, err = h.YouTubeClient.SearchAndGetDetails(req.Query, fetchCount)

		if err != nil {
			// Rate-limited — try cache as fallback
			if services.IsRateLimited(err) {
				log.Printf("⚠️ YouTube API rate limited, trying cache fallback for: %s", req.Query[:min(len(req.Query), 60)])
				// Try cache even if expired
				var fallbackEntry structs.YouTubeCache
				if fbErr := h.DB.Where("cache_key = ?", cacheKey).First(&fallbackEntry).Error; fbErr == nil {
					// Found a fallback entry
					var fbVideos []clients.VideoDetail
					if jsonErr := json.Unmarshal([]byte(fallbackEntry.ResponseJSON), &fbVideos); jsonErr == nil && len(fbVideos) > 0 {
						videos = fbVideos
						quotaUsed = fallbackEntry.QuotaUsed
						fromCache = true
						log.Printf("📦 Cache fallback served for query: %s (expired, %d videos)", req.Query[:min(len(req.Query), 60)], len(videos))
					} else {
						apiError(c, http.StatusTooManyRequests, "YouTube API rate limit exceeded and no valid cached data available. Try again later.", "RATE_LIMITED")
						return
					}
				} else {
					apiError(c, http.StatusTooManyRequests, "YouTube API rate limit exceeded. Try again later.", "RATE_LIMITED")
					return
				}
			} else {
				apiError(c, http.StatusInternalServerError, "Failed to search YouTube: "+err.Error(), "YOUTUBE_API_ERROR")
				return
			}
		}

		// Cache the result for future use (only if we fetched fresh data)
		if !fromCache && len(videos) > 0 {
			quotaUsed = 100 + len(videos)
			if cacheErr := h.CacheService.SetCachedResult(cacheKey, "search", videos, quotaUsed); cacheErr != nil {
				log.Printf("Warning: failed to cache result: %v", cacheErr)
			}
		}
	}

	if len(videos) == 0 {
		apiResponse(c, structs.GenerateResponse{
			Videos:    []structs.YouTubeVideo{},
			QuotaUsed: 0,
		})
		return
	}

	// Apply filters
	svcFilters := services.FilterCriteria{
		Query:           req.Query,
		DurationMin:     req.Filters.DurationMin,
		DurationMax:     req.Filters.DurationMax,
		VideoTypes:      toServiceVideoTypes(req.Filters.VideoTypes),
		IncludeKeywords: req.Filters.IncludeKeywords,
		ExcludeKeywords: req.Filters.ExcludeKeywords,
		UploadDate:      toServiceUploadDate(req.Filters.UploadDate),
		MinViews:        req.Filters.MinViews,
		MaxResults:      req.Filters.MaxResults,
		SafeSearch:      req.Filters.SafeSearch,
	}

	filtered := h.FilterService.ApplyFilters(videos, svcFilters)

	// Convert to API response format, dedup by video ID
	seen := make(map[string]struct{}, len(filtered))
	resultVideos := make([]structs.YouTubeVideo, 0, len(filtered))
	for _, v := range filtered {
		if _, exists := seen[v.ID]; exists {
			continue
		}
		seen[v.ID] = struct{}{}

		videoType := h.FilterService.ClassifyVideoType(v)
		resultVideos = append(resultVideos, structs.YouTubeVideo{
			ID:              v.ID,
			Title:           v.Title,
			Description:     v.Description,
			ChannelID:       v.ChannelID,
			ChannelTitle:    v.ChannelTitle,
			ThumbnailURL:    v.ThumbnailURL,
			Duration:        v.Duration,
			DurationSeconds: v.DurationSeconds,
			ViewCount:       v.ViewCount,
			LikeCount:       v.LikeCount,
			PublishedAt:     v.PublishedAt,
			Tags:            v.Tags,
			VideoType:       structs.VideoType(videoType),
		})
	}

	if !fromCache {
		// Calculate approximate quota used: 100 for search + 1 per video detail
		quotaUsed = 100 + len(videos)
	}

	apiResponse(c, structs.GenerateResponse{
		Videos:    resultVideos,
		QuotaUsed: quotaUsed,
	})
}

// GenerateMultiSinger handles POST /api/v1/generate/multi-singer
// Searches YouTube for each singer, combines results, and returns a merged playlist
func (h *GenerateHandler) GenerateMultiSinger(c *gin.Context) {
	var req structs.MultiSingerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiError(c, http.StatusBadRequest, "Invalid request: "+err.Error(), "VALIDATION_ERROR")
		return
	}

	// Validate singer count (DB singers + custom singers total 2-5)
	totalSingerCount := len(req.SingerIDs) + len(req.CustomSingers)
	if totalSingerCount < 2 || totalSingerCount > 5 {
		apiError(c, http.StatusBadRequest, "Please select between 2 and 5 singers total (including custom)", "VALIDATION_ERROR")
		return
	}

	// Validate results per singer
	resultsPerSinger := req.ResultsPerSinger
	if resultsPerSinger < 3 || resultsPerSinger > 15 {
		resultsPerSinger = 10 // default
	}

	// Build singer list: DB singers + custom singers
	type singerSearch struct {
		ID   string
		Name string
	}
	var singerSearches []singerSearch

	// Fetch DB singers (convert string IDs to uint for DB query)
	var singerUintIDs []uint
	for _, sid := range req.SingerIDs {
		if parsed, err := strconv.ParseUint(sid, 10, 64); err == nil {
			singerUintIDs = append(singerUintIDs, uint(parsed))
		}
	}
	var dbSingers []structs.Singer
	if len(singerUintIDs) > 0 {
		if err := h.DB.Where("id IN ? AND is_active = ?", singerUintIDs, true).Find(&dbSingers).Error; err != nil {
			apiServerError(c, err)
			return
		}
		for _, s := range dbSingers {
			singerSearches = append(singerSearches, singerSearch{ID: fmt.Sprintf("%d", s.ID), Name: s.Name})
		}
	}

	// Add custom singers
	for i, name := range req.CustomSingers {
		name := strings.TrimSpace(name)
		if name == "" {
			continue
		}
		singerSearches = append(singerSearches, singerSearch{
			ID:   fmt.Sprintf("custom-%d", i),
			Name: name,
		})
	}

	if len(singerSearches) < 2 {
		apiError(c, http.StatusNotFound, "At least 2 singers required (DB or custom)", "NOT_FOUND")
		return
	}

	// Validate total singer count (max 5)
	if len(singerSearches) > 5 {
		singerSearches = singerSearches[:5]
	}

	// Build service-level filters (shared across all singers)
	svcFilters := services.FilterCriteria{
		DurationMin:     req.Filters.DurationMin,
		DurationMax:     req.Filters.DurationMax,
		VideoTypes:      toServiceVideoTypes(req.Filters.VideoTypes),
		IncludeKeywords: req.Filters.IncludeKeywords,
		ExcludeKeywords: req.Filters.ExcludeKeywords,
		UploadDate:      toServiceUploadDate(req.Filters.UploadDate),
		MinViews:        req.Filters.MinViews,
		MaxResults:      resultsPerSinger,
		SafeSearch:      req.Filters.SafeSearch,
	}

	// If no video types specified, default to music
	if len(svcFilters.VideoTypes) == 0 {
		svcFilters.VideoTypes = []services.VideoType{services.VideoTypeMusic}
	}

	// Search YouTube for each singer
	type singerResult struct {
		SingerID   string
		SingerName string
		Videos     []clients.VideoDetail
		Error      error
	}

	ctx := c.Request.Context()
	resultCh := make(chan singerResult, len(singerSearches))

	for _, ss := range singerSearches {
		go func(s singerSearch) {
			// Check if request was cancelled before starting expensive work
			select {
			case <-ctx.Done():
				return
			default:
			}

			query := s.Name + " song"
			fetchCount := min(resultsPerSinger*3, 50)
			cacheKey := services.GenerateSearchCacheKey(query, fetchCount)

			// Try cache first
			cachedVideos, _, cacheErr := h.CacheService.GetCachedResult(cacheKey)
			var videos []clients.VideoDetail
			var err error
			var fromCache bool

			if cacheErr == nil && cachedVideos != nil {
				// Cache hit — use cached data
				videos = cachedVideos
				fromCache = true
				log.Printf("📦 Serving cached result for singer: %s", s.Name)
			} else {
				// Cache miss — call YouTube API
				videos, err = h.YouTubeClient.SearchAndGetDetails(query, fetchCount)

				if err != nil {
					// Rate-limited — try cache as fallback (even expired)
					if services.IsRateLimited(err) {
						log.Printf("⚠️ YouTube API rate limited for singer: %s, trying cache fallback", s.Name)
						var fallbackEntry structs.YouTubeCache
						if fbErr := h.DB.Where("cache_key = ?", cacheKey).First(&fallbackEntry).Error; fbErr == nil {
							var fbVideos []clients.VideoDetail
							if jsonErr := json.Unmarshal([]byte(fallbackEntry.ResponseJSON), &fbVideos); jsonErr == nil && len(fbVideos) > 0 {
								videos = fbVideos
								fromCache = true
								log.Printf("📦 Cache fallback served for singer: %s (%d videos)", s.Name, len(videos))
							} else {
								sendOrCancel(ctx, resultCh, singerResult{SingerID: s.ID, SingerName: s.Name, Error: fmt.Errorf("YouTube API rate limited and no cached data available")})
								return
							}
						} else {
							sendOrCancel(ctx, resultCh, singerResult{SingerID: s.ID, SingerName: s.Name, Error: fmt.Errorf("YouTube API rate limited and no cached data available")})
							return
						}
					} else {
						sendOrCancel(ctx, resultCh, singerResult{SingerID: s.ID, SingerName: s.Name, Error: err})
						return
					}
				}

				// Cache the result for future use
				if !fromCache && len(videos) > 0 {
					quotaUsed := 100 + len(videos)
					if cacheErr := h.CacheService.SetCachedResult(cacheKey, "search", videos, quotaUsed); cacheErr != nil {
						log.Printf("Warning: failed to cache result for singer %s: %v", s.Name, cacheErr)
					}
				}
			}

			// Apply filters per-singer
			filtered := h.FilterService.ApplyFilters(videos, svcFilters)

			// Limit per singer
			if len(filtered) > resultsPerSinger {
				filtered = filtered[:resultsPerSinger]
			}

			sendOrCancel(ctx, resultCh, singerResult{SingerID: s.ID, SingerName: s.Name, Videos: filtered})
		}(ss)
	}

	// Collect results with dedup by YouTube video ID (context-aware to handle request cancellation)
	allVideosSeen := make(map[string]struct{})
	var allVideos []structs.YouTubeVideo
	perSingerResults := make(map[string]int)
	singerNames := make(map[string]string)
	totalQuota := 0

CollectResults:
	for i := 0; i < len(singerSearches); i++ {
		select {
		case <-ctx.Done():
			log.Printf("Request cancelled, returning partial results (%d/%d singers processed)", i, len(singerSearches))
			if len(allVideos) == 0 {
				apiError(c, http.StatusGatewayTimeout, "Request was cancelled", "REQUEST_CANCELLED")
				return
			}
			break CollectResults
		case result := <-resultCh:
			singerNames[result.SingerID] = result.SingerName

			if result.Error != nil {
				log.Printf("Warning: failed to search for singer %s: %v", result.SingerName, result.Error)
				perSingerResults[result.SingerID] = 0
				continue
			}

			// Track how many unique videos we actually add from this singer
			uniqueAdded := 0

			for _, v := range result.Videos {
				if _, exists := allVideosSeen[v.ID]; exists {
					continue
				}
				allVideosSeen[v.ID] = struct{}{}
				uniqueAdded++

				videoType := h.FilterService.ClassifyVideoType(v)
				allVideos = append(allVideos, structs.YouTubeVideo{
					ID:              v.ID,
					Title:           v.Title,
					Description:     v.Description,
					ChannelID:       v.ChannelID,
					ChannelTitle:    v.ChannelTitle,
					ThumbnailURL:    v.ThumbnailURL,
					Duration:        v.Duration,
					DurationSeconds: v.DurationSeconds,
					ViewCount:       v.ViewCount,
					LikeCount:       v.LikeCount,
					PublishedAt:     v.PublishedAt,
					Tags:            v.Tags,
					VideoType:       structs.VideoType(videoType),
					SingerID:        result.SingerID,
					SingerName:      result.SingerName,
				})
			}

			perSingerResults[result.SingerID] = uniqueAdded
			totalQuota += 100 + len(result.Videos)
		}
	}

	// Check if we got any results at all
	if len(allVideos) == 0 {
		apiError(c, http.StatusNotFound, "No videos found for the selected singers. Try different filters or fewer singers.", "NO_RESULTS")
		return
	}

	apiResponse(c, structs.MultiSingerResponse{
		Videos:           allVideos,
		QuotaUsed:        totalQuota,
		PerSingerResults: perSingerResults,
		SingerNames:      singerNames,
	})
}

// sendOrCancel sends a result to the channel or returns if the context is cancelled
func sendOrCancel[T any](ctx context.Context, ch chan<- T, val T) {
	select {
	case <-ctx.Done():
	case ch <- val:
	}
}

// toServiceUploadDate converts structs.UploadDate to services.UploadDateRange
func toServiceUploadDate(ud *structs.UploadDate) *services.UploadDateRange {
	if ud == nil {
		return nil
	}
	return &services.UploadDateRange{
		Type:  ud.Type,
		Start: ud.Start,
		End:   ud.End,
	}
}

// toServiceVideoTypes converts structs.VideoType to services.VideoType
func toServiceVideoTypes(types []structs.VideoType) []services.VideoType {
	result := make([]services.VideoType, len(types))
	for i, t := range types {
		result[i] = services.VideoType(t)
	}
	return result
}
