package handlers

import (
	"log"
	"net/http"

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
}

func NewGenerateHandler(db *gorm.DB, ytClient *clients.YouTubeClient, filterSvc *services.FilterService) *GenerateHandler {
	return &GenerateHandler{
		DB:            db,
		YouTubeClient: ytClient,
		FilterService: filterSvc,
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

	// Search YouTube and get video details
	videos, err := h.YouTubeClient.SearchAndGetDetails(req.Query, fetchCount)
	if err != nil {
		apiError(c, http.StatusInternalServerError, "Failed to search YouTube: "+err.Error(), "YOUTUBE_API_ERROR")
		return
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

	// Convert to API response format
	resultVideos := make([]structs.YouTubeVideo, 0, len(filtered))
	for _, v := range filtered {
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

	// Calculate approximate quota used: 100 for search + 1 per video detail
	quotaUsed := 100 + len(videos)

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

	// Validate singer count
	if len(req.SingerIDs) < 2 || len(req.SingerIDs) > 5 {
		apiError(c, http.StatusBadRequest, "Please select between 2 and 5 singers", "VALIDATION_ERROR")
		return
	}

	// Validate results per singer
	resultsPerSinger := req.ResultsPerSinger
	if resultsPerSinger < 3 || resultsPerSinger > 15 {
		resultsPerSinger = 10 // default
	}

	// Fetch all singers from DB
	var singers []structs.Singer
	if err := h.DB.Where("id IN ? AND is_active = ?", req.SingerIDs, true).Find(&singers).Error; err != nil {
		apiServerError(c, err)
		return
	}

	if len(singers) == 0 {
		apiError(c, http.StatusNotFound, "No singers found", "NOT_FOUND")
		return
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

	resultCh := make(chan singerResult, len(singers))

	for _, singer := range singers {
		go func(s structs.Singer) {
			query := s.Name + " song"
			fetchCount := min(resultsPerSinger*3, 50)

			videos, err := h.YouTubeClient.SearchAndGetDetails(query, fetchCount)
			if err != nil {
				resultCh <- singerResult{SingerID: s.ID, SingerName: s.Name, Error: err}
				return
			}

			// Apply filters per-singer
			filtered := h.FilterService.ApplyFilters(videos, svcFilters)

			// Limit per singer
			if len(filtered) > resultsPerSinger {
				filtered = filtered[:resultsPerSinger]
			}

			resultCh <- singerResult{SingerID: s.ID, SingerName: s.Name, Videos: filtered}
		}(singer)
	}

	// Collect results
	var allVideos []structs.YouTubeVideo
	perSingerResults := make(map[string]int)
	singerNames := make(map[string]string)
	totalQuota := 0

	for i := 0; i < len(singers); i++ {
		result := <-resultCh
		singerNames[result.SingerID] = result.SingerName

		if result.Error != nil {
			log.Printf("Warning: failed to search for singer %s: %v", result.SingerName, result.Error)
			// Continue with other singers — partial results are OK
			perSingerResults[result.SingerID] = 0
			continue
		}

		perSingerResults[result.SingerID] = len(result.Videos)
		totalQuota += 100 + len(result.Videos) // search (100) + video details (1 each)

		for _, v := range result.Videos {
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
			})
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
