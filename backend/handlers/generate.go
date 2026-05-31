package handlers

import (
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
