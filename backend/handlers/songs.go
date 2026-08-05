package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/structs"
)

// SongsHandler handles saved song CRUD operations
// Persists to the `saved_songs` table in PostgreSQL.
type SongsHandler struct {
	DB *gorm.DB
}

func NewSongsHandler(db *gorm.DB) *SongsHandler {
	return &SongsHandler{DB: db}
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

	// Check if already saved (video_id has a unique index, but check first
	// for a clean 409 response instead of a raw DB constraint error)
	var existing int64
	h.DB.Model(&structs.SavedSong{}).Where("video_id = ?", req.Video.ID).Count(&existing)
	if existing > 0 {
		apiError(c, http.StatusConflict, "Song already saved", "DUPLICATE_SONG")
		return
	}

	song := structs.SavedSong{
		VideoID:         req.Video.ID,
		Title:           req.Video.Title,
		ChannelTitle:    req.Video.ChannelTitle,
		ThumbnailURL:    req.Video.ThumbnailURL,
		Duration:        req.Video.Duration,
		DurationSeconds: req.Video.DurationSeconds,
		SingerName:      req.SingerName,
		SingerID:        req.SingerID,
	}

	if err := h.DB.Create(&song).Error; err != nil {
		// Guard against a race between the duplicate check above and the insert
		// (unique index on video_id) — surface it as a clean 409.
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			apiError(c, http.StatusConflict, "Song already saved", "DUPLICATE_SONG")
			return
		}
		apiServerError(c, err)
		return
	}

	apiResponse(c, toSavedSongResponse(song))
}

// ListSongs handles GET /api/v1/songs
// Returns all saved songs, newest first.
func (h *SongsHandler) ListSongs(c *gin.Context) {
	var songs []structs.SavedSong
	if err := h.DB.Order("created_at desc").Find(&songs).Error; err != nil {
		apiServerError(c, err)
		return
	}

	items := make([]structs.SavedSongResponse, 0, len(songs))
	for _, song := range songs {
		items = append(items, toSavedSongResponse(song))
	}

	apiResponse(c, items)
}

// DeleteSong handles DELETE /api/v1/songs/:id
func (h *SongsHandler) DeleteSong(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		apiError(c, http.StatusBadRequest, "Invalid song ID", "INVALID_ID")
		return
	}

	result := h.DB.Delete(&structs.SavedSong{}, uint(id))
	if result.Error != nil {
		apiServerError(c, result.Error)
		return
	}
	if result.RowsAffected == 0 {
		apiError(c, http.StatusNotFound, "Song not found", "NOT_FOUND")
		return
	}

	apiResponse(c, gin.H{"deleted": true})
}

// ClearSongs handles DELETE /api/v1/songs (bulk clear of all saved songs)
func (h *SongsHandler) ClearSongs(c *gin.Context) {
	if err := h.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&structs.SavedSong{}).Error; err != nil {
		apiServerError(c, err)
		return
	}

	apiResponse(c, gin.H{"deleted": true})
}

// toSavedSongResponse converts the DB model into the API response shape
func toSavedSongResponse(song structs.SavedSong) structs.SavedSongResponse {
	return structs.SavedSongResponse{
		ID:              strconv.FormatUint(uint64(song.ID), 10),
		VideoID:         song.VideoID,
		Title:           song.Title,
		ChannelTitle:    song.ChannelTitle,
		ThumbnailURL:    song.ThumbnailURL,
		Duration:        song.Duration,
		DurationSeconds: song.DurationSeconds,
		SingerName:      song.SingerName,
		SingerID:        song.SingerID,
		CreatedAt:       song.CreatedAt.UTC().Format(time.RFC3339),
	}
}
