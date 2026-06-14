package handlers

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"playlist-backend/structs"
)

// SavedTVSeriesHandler handles saved TV series operations
// Uses in-memory store (no database persistence)
type SavedTVSeriesHandler struct {
	mu          sync.RWMutex
	savedSeries map[string]structs.SavedTVSeries
	nextID      int
}

func NewSavedTVSeriesHandler() *SavedTVSeriesHandler {
	return &SavedTVSeriesHandler{
		savedSeries: make(map[string]structs.SavedTVSeries),
		nextID:      1,
	}
}

// ToggleSavedTVSeries handles POST /api/v1/tv-series/saved
// If the series is already saved, it unsaves it; otherwise saves it
func (h *SavedTVSeriesHandler) ToggleSavedTVSeries(c *gin.Context) {
	var req structs.ToggleSaveTVSeriesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiError(c, http.StatusBadRequest, "Invalid request: "+err.Error(), "VALIDATION_ERROR")
		return
	}

	if req.SeriesID == "" {
		apiError(c, http.StatusBadRequest, "Series ID is required", "VALIDATION_ERROR")
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	// Check if already saved
	for id, saved := range h.savedSeries {
		if saved.SeriesID == req.SeriesID {
			// Unsave
			delete(h.savedSeries, id)
			apiResponse(c, gin.H{"saved": false, "id": id})
			return
		}
	}

	// Save
	id := fmt.Sprintf("saved_tv_%d", h.nextID)
	h.nextID++
	now := time.Now().UTC().Format(time.RFC3339)

	saved := structs.SavedTVSeries{
		ID:              id,
		SeriesID:        req.SeriesID,
		SeriesName:      req.SeriesName,
		Channel:         req.Channel,
		Genre:           req.Genre,
		ThumbnailURL:    req.ThumbnailURL,
		PopularityScore: req.PopularityScore,
		CreatedAt:       now,
	}

	h.savedSeries[id] = saved

	apiResponse(c, gin.H{"saved": true, "item": saved})
}

// ListSavedTVSeries handles GET /api/v1/tv-series/saved
func (h *SavedTVSeriesHandler) ListSavedTVSeries(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	items := make([]structs.SavedTVSeries, 0, len(h.savedSeries))
	for _, saved := range h.savedSeries {
		items = append(items, saved)
	}

	apiResponse(c, items)
}

// DeleteSavedTVSeries handles DELETE /api/v1/tv-series/saved/:id
func (h *SavedTVSeriesHandler) DeleteSavedTVSeries(c *gin.Context) {
	id := c.Param("id")

	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.savedSeries[id]; !exists {
		apiError(c, http.StatusNotFound, "Saved TV series not found", "NOT_FOUND")
		return
	}

	delete(h.savedSeries, id)
	apiResponse(c, gin.H{"deleted": true})
}
