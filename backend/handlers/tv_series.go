package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/clients"
	"playlist-backend/services"
	"playlist-backend/structs"
)

// TV series search queries to try in order. More queries = more variety but more API quota.
// Each query variant often returns different YouTube results, especially for long-running shows.
var tvSeriesSearchQueries = []string{
	"%s full episode",         // primary: "Taarak Mehta Ka Ooltah Chashmah full episode"
	"%s episode",              // fallback: "Taarak Mehta Ka Ooltah Chashmah episode"
	"%s latest episode",       // fallback: for recent episodes
}

// shortNameQueries are additional queries tried when the series name is short (<=6 chars)
// Short names like "CID" are hard for YouTube search — adding context helps.
var shortNameQueries = []string{
	"%s tv series episode",
	"%s tv show episode",
}

// TVSeriesHandler handles TV series-related API requests
type TVSeriesHandler struct {
	DB            *gorm.DB
	YouTubeClient *clients.YouTubeClient
	FilterService *services.FilterService
	CacheService  *services.CacheService
}

func NewTVSeriesHandler(db *gorm.DB, ytClient *clients.YouTubeClient, filterSvc *services.FilterService, cacheSvc *services.CacheService) *TVSeriesHandler {
	return &TVSeriesHandler{
		DB:            db,
		YouTubeClient: ytClient,
		FilterService: filterSvc,
		CacheService:  cacheSvc,
	}
}

// ListTVSeries handles GET /api/v1/tv-series
// Query params:
//   - channel: filter by channel (optional)
//   - search: search by name (optional, fuzzy)
//   - limit: max results (optional, default 500)
func (h *TVSeriesHandler) ListTVSeries(c *gin.Context) {
	channel := c.Query("channel")
	search := c.Query("search")
	limitStr := c.DefaultQuery("limit", "500")

	limit := 100
	if n, err := strconv.Atoi(limitStr); err == nil && n > 0 && n <= 1000 {
		limit = n
	}

	query := h.DB.Model(&structs.TVSeries{}).Where("is_active = ?", true)

	if channel != "" {
		query = query.Where("channel = ?", channel)
	}

	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ?", searchTerm)
	}

	// Get all distinct channels for the filter
	var channels []string
	h.DB.Model(&structs.TVSeries{}).
		Where("is_active = ?", true).
		Distinct("channel").
		Order("channel ASC").
		Pluck("channel", &channels)

	// Get series
	var series []structs.TVSeries
	if err := query.Order("popularity_score DESC").Limit(limit).Find(&series).Error; err != nil {
		apiServerError(c, err)
		return
	}

	// Convert to list items
	items := make([]structs.TVSeriesListItem, 0, len(series))
	for _, s := range series {
		items = append(items, structs.TVSeriesListItem{
			ID:              s.ID,
			Name:            s.Name,
			Channel:         s.Channel,
			Genre:           s.Genre,
			ThumbnailURL:    s.ThumbnailURL,
			PopularityScore: s.PopularityScore,
		})
	}

	apiResponse(c, structs.TVSeriesResponse{
		Series:   items,
		Channels: channels,
	})
}

// GenerateTVSeriesPlaylist handles POST /api/v1/generate/tv-series
// Searches YouTube for the TV series name, applies filters, and returns videos
func (h *TVSeriesHandler) GenerateTVSeriesPlaylist(c *gin.Context) {
	var req structs.TVSeriesGenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiError(c, http.StatusBadRequest, "Invalid request: "+err.Error(), "VALIDATION_ERROR")
		return
	}

	// Determine the search name: from DB or custom
	var seriesName string
	if req.SeriesID != "" {
		// Try to get from DB
		var series structs.TVSeries
		if sid, err := strconv.ParseUint(req.SeriesID, 10, 64); err == nil {
			if dbErr := h.DB.Where("id = ? AND is_active = ?", uint(sid), true).First(&series).Error; dbErr == nil {
				seriesName = series.Name
			}
		}
	}

	// Fall back to custom name if not found in DB
	if seriesName == "" && req.CustomName != "" {
		seriesName = strings.TrimSpace(req.CustomName)
	}

	if seriesName == "" {
		apiError(c, http.StatusBadRequest, "Please provide a TV series name or select one from the list", "VALIDATION_ERROR")
		return
	}

	resultsPerSeries := req.ResultsPerSeries
	if resultsPerSeries < 3 || resultsPerSeries > 30 {
		resultsPerSeries = 30
	}

	// Build multiple search queries for better coverage.
	// Different query phrasings return different YouTube results, especially for long-running shows.
	// Short/acronym names (like "CID") get additional context keywords.
	fetchCount := 50 // always fetch max per page for best variety

	var queries []string
	for _, tmpl := range tvSeriesSearchQueries {
		queries = append(queries, fmt.Sprintf(tmpl, seriesName))
	}
	if len(seriesName) <= 6 {
		for _, tmpl := range shortNameQueries {
			queries = append(queries, fmt.Sprintf(tmpl, seriesName))
		}
	}

	// Build service-level filters — MaxResults kept high (fetchCount) so the filter
	// keeps a large pool for shuffling later. The final limit is applied after shuffle.
	svcFilters := services.FilterCriteria{
		DurationMin:     req.Filters.DurationMin,
		DurationMax:     req.Filters.DurationMax,
		VideoTypes:      toServiceVideoTypes(req.Filters.VideoTypes),
		IncludeKeywords: req.Filters.IncludeKeywords,
		ExcludeKeywords: req.Filters.ExcludeKeywords,
		UploadDate:      toServiceUploadDate(req.Filters.UploadDate),
		MinViews:        req.Filters.MinViews,
		MaxResults:      fetchCount, // keep pool large; we shuffle + trim below
		SafeSearch:      req.Filters.SafeSearch,
	}

	// Default to standard video types for TV series (episodes)
	if len(svcFilters.VideoTypes) == 0 {
		svcFilters.VideoTypes = []services.VideoType{services.VideoTypeStandard}
	}

	// Search across queries, deduplicating by video ID.
	// We collect ALL filtered results first, shuffle at the end to ensure
	// every request (even from cache) surfaces a different subset.
	seen := make(map[string]struct{})
	var allFiltered []structs.YouTubeVideo
	totalQuotaUsed := 0

	for _, query := range queries {
		cacheKey := services.GenerateSearchCacheKey(query, fetchCount)
		cachedVideos, _, cacheErr := h.CacheService.GetCachedResult(cacheKey)

		var videos []clients.VideoDetail
		var err error
		var fromCache bool

		if cacheErr == nil && cachedVideos != nil {
			videos = cachedVideos
			fromCache = true
			log.Printf("📦 Cache HIT for TV series query: %s", query)
		} else {
			videos, err = h.YouTubeClient.SearchAndGetDetails(query, fetchCount)
			if err != nil {
				if services.IsRateLimited(err) {
					log.Printf("⚠️ Rate limited for query: %s, trying cache fallback", query)
					var fallbackEntry structs.YouTubeCache
					if fbErr := h.DB.Where("cache_key = ?", cacheKey).First(&fallbackEntry).Error; fbErr == nil {
						var fbVideos []clients.VideoDetail
						if jsonErr := json.Unmarshal([]byte(fallbackEntry.ResponseJSON), &fbVideos); jsonErr == nil && len(fbVideos) > 0 {
							videos = fbVideos
							fromCache = true
							log.Printf("📦 Cache fallback served for query: %s (%d videos)", query, len(videos))
						} else {
							log.Printf("⚠️ Cache fallback empty for query: %s, skipping", query)
							continue
						}
					} else {
						log.Printf("⚠️ No cache fallback for query: %s, skipping", query)
						continue
					}
				} else {
					log.Printf("⚠️ YouTube search failed for '%s': %v", query, err)
					continue
				}
			}

			// Cache the fresh result
			if !fromCache && len(videos) > 0 {
				qUsed := 100 + len(videos)
				if ce := h.CacheService.SetCachedResult(cacheKey, "search", videos, qUsed); ce != nil {
					log.Printf("Warning: cache set failed for %s: %v", query, ce)
				}
			}
		}

		if !fromCache && len(videos) > 0 {
			totalQuotaUsed += 100 + len(videos)
		}

		// Apply filters and collect unique results
		filtered := h.FilterService.ApplyFilters(videos, svcFilters)
		for _, v := range filtered {
			if _, exists := seen[v.ID]; exists {
				continue
			}
			seen[v.ID] = struct{}{}

			videoType := h.FilterService.ClassifyVideoType(v)
			allFiltered = append(allFiltered, structs.YouTubeVideo{
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

		log.Printf("📺 Query '%s' — fetched %d, filtered to %d, unique pool: %d",
			query, len(videos), len(filtered), len(allFiltered))
	}

	if len(allFiltered) == 0 {
		apiError(c, http.StatusNotFound, fmt.Sprintf("No videos found for \"%s\". Try a different search or adjust filters.", seriesName), "NO_RESULTS")
		return
	}

	// 🎲 Shuffle the filtered pool so every request (even with cached data)
	// returns a different subset of videos.
	rand.Shuffle(len(allFiltered), func(i, j int) {
		allFiltered[i], allFiltered[j] = allFiltered[j], allFiltered[i]
	})

	// Take the requested number of results
	if len(allFiltered) > resultsPerSeries {
		allFiltered = allFiltered[:resultsPerSeries]
	}

	apiResponse(c, structs.TVSeriesGenerateResponse{
		Videos:     allFiltered,
		QuotaUsed:  totalQuotaUsed,
		SeriesName: seriesName,
	})
}


