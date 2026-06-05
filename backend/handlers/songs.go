package handlers

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"playlist-backend/structs"
)

// SongsHandler handles saved song CRUD operations
// Uses in-memory store (no database persistence)
type SongsHandler struct {
	mu      sync.RWMutex
	songs   map[string]structs.SavedSong
	nextID  int
}

func NewSongsHandler() *SongsHandler {
	return &SongsHandler{
		songs:  make(map[string]structs.SavedSong),
		nextID: 1,
	}
}

// SaveSong handles POST /api/v1/songs
func (h *SongsHandler) SaveSong(c *gin.Context) {
	var req structs.SavedSongRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiError(c, http.StatusBadRequest, "Invalid request: "+err.Error(), "VALIDATION_ERROR")
		return
	}

	if req.Video.ID == "" {
		apiError(c, http.StatusBadRequest, "Video ID is required", "VALIDATION_ERROR")
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	// Check if already saved
	for _, song := range h.songs {
		if song.VideoID == req.Video.ID {
			apiError(c, http.StatusConflict, "Song already saved", "DUPLICATE_SONG")
			return
		}
	}

	id := fmt.Sprintf("song_%d", h.nextID)
	h.nextID++
	now := time.Now().UTC().Format(time.RFC3339)

	song := structs.SavedSong{
		ID:              id,
		VideoID:         req.Video.ID,
		Title:           req.Video.Title,
		ChannelTitle:    req.Video.ChannelTitle,
		ThumbnailURL:    req.Video.ThumbnailURL,
		Duration:        req.Video.Duration,
		DurationSeconds: req.Video.DurationSeconds,
		SingerName:      req.SingerName,
		SingerID:        req.SingerID,
		CreatedAt:       now,
	}

	h.songs[id] = song

	apiResponse(c, structs.SavedSongResponse{
		ID:              song.ID,
		VideoID:         song.VideoID,
		Title:           song.Title,
		ChannelTitle:    song.ChannelTitle,
		ThumbnailURL:    song.ThumbnailURL,
		Duration:        song.Duration,
		DurationSeconds: song.DurationSeconds,
		SingerName:      song.SingerName,
		SingerID:        song.SingerID,
		CreatedAt:       song.CreatedAt,
	})
}

// ListSongs handles GET /api/v1/songs
func (h *SongsHandler) ListSongs(c *gin.Context) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	items := make([]structs.SavedSongResponse, 0, len(h.songs))
	for _, song := range h.songs {
		items = append(items, structs.SavedSongResponse{
			ID:              song.ID,
			VideoID:         song.VideoID,
			Title:           song.Title,
			ChannelTitle:    song.ChannelTitle,
			ThumbnailURL:    song.ThumbnailURL,
			Duration:        song.Duration,
			DurationSeconds: song.DurationSeconds,
			SingerName:      song.SingerName,
			SingerID:        song.SingerID,
			CreatedAt:       song.CreatedAt,
		})
	}

	apiResponse(c, items)
}

// DeleteSong handles DELETE /api/v1/songs/:id
func (h *SongsHandler) DeleteSong(c *gin.Context) {
	id := c.Param("id")

	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.songs[id]; !exists {
		apiError(c, http.StatusNotFound, "Song not found", "NOT_FOUND")
		return
	}

	delete(h.songs, id)
	apiResponse(c, gin.H{"deleted": true})
}
