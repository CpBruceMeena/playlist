package handlers

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/structs"
)

type PlaylistHandler struct {
	DB *gorm.DB
}

func NewPlaylistHandler(db *gorm.DB) *PlaylistHandler {
	return &PlaylistHandler{DB: db}
}

// SavePlaylist handles POST /api/v1/playlists
// Saves a playlist to the database, checking for duplicates by query hash
func (h *PlaylistHandler) SavePlaylist(c *gin.Context) {
	var req structs.CreatePlaylistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apiError(c, http.StatusBadRequest, "Invalid request: "+err.Error(), "VALIDATION_ERROR")
		return
	}

	if len(req.Videos) == 0 {
		apiError(c, http.StatusBadRequest, "No videos to save", "VALIDATION_ERROR")
		return
	}

	if len(req.Videos) > 200 {
		apiError(c, http.StatusBadRequest, "Too many videos (max 200)", "VALIDATION_ERROR")
		return
	}

	// Generate a deterministic hash from the query + video IDs for existence check
	queryHash := generatePlaylistHash(req.Query, req.Videos)

	// Check if a playlist with this hash already exists
	var existingCount int64
	h.DB.Model(&structs.Playlist{}).Where("query_hash = ?", queryHash).Count(&existingCount)
	if existingCount > 0 {
		apiError(c, http.StatusConflict, "A playlist with the same query and videos already exists", "DUPLICATE_PLAYLIST")
		return
	}

	// Serialize filters to JSON
	filtersJSON, err := json.Marshal(req.Filters)
	if err != nil {
		apiServerError(c, err)
		return
	}

	// Create the playlist
	now := time.Now()
	playlist := structs.Playlist{
		Name:      req.Name,
		Query:     req.Query,
		Filters:   string(filtersJSON),
		CreatedAt: now,
		UpdatedAt: now,
	}

	tx := h.DB.Begin()

	// Create playlist
	if err := tx.Create(&playlist).Error; err != nil {
		tx.Rollback()
		apiServerError(c, err)
		return
	}

	// Create playlist videos
	for i, video := range req.Videos {
		// Parse duration seconds
		durationSeconds := video.DurationSeconds

		playlistVideo := structs.PlaylistVideo{
			PlaylistID:      playlist.ID,
			YoutubeID:       video.ID,
			Title:           video.Title,
			Channel:         video.ChannelTitle,
			ChannelID:       video.ChannelID,
			Thumbnail:       video.ThumbnailURL,
			DurationSeconds: durationSeconds,
			ViewCount:       int64(video.ViewCount),
			Position:        i,
		}
		if err := tx.Create(&playlistVideo).Error; err != nil {
			tx.Rollback()
			apiServerError(c, err)
			return
		}
	}

	// Store the query hash
	if err := tx.Model(&playlist).Update("query_hash", queryHash).Error; err != nil {
		tx.Rollback()
		apiServerError(c, err)
		return
	}

	tx.Commit()

	apiResponse(c, gin.H{
		"id":        playlist.ID,
		"name":      playlist.Name,
		"videoCount": len(req.Videos),
		"createdAt": playlist.CreatedAt,
	})
}

// ListPlaylists handles GET /api/v1/playlists
// Returns all saved playlists (limited to latest 50)
func (h *PlaylistHandler) ListPlaylists(c *gin.Context) {
	var playlists []structs.Playlist

	if err := h.DB.Order("created_at desc").Limit(50).Find(&playlists).Error; err != nil {
		apiServerError(c, err)
		return
	}

	// Build response with video counts using a single subquery (avoids N+1)
	type PlaylistItem struct {
		ID         string    `json:"id"`
		Name       string    `json:"name"`
		Query      string    `json:"query"`
		VideoCount int       `json:"videoCount"`
		CreatedAt  time.Time `json:"createdAt"`
	}

	// Use a left join to count videos in a single query
	type playlistWithCount struct {
		structs.Playlist
		VideoCount int64 `gorm:"column:video_count"`
	}

	var results []playlistWithCount
	h.DB.Model(&structs.Playlist{}).
		Select("playlists.*, COUNT(playlist_videos.id) AS video_count").
		Joins("LEFT JOIN playlist_videos ON playlist_videos.playlist_id = playlists.id").
		Group("playlists.id").
		Order("playlists.created_at desc").
		Limit(50).
		Find(&results)

	items := make([]PlaylistItem, 0, len(results))
	for _, r := range results {
		items = append(items, PlaylistItem{
			ID:         r.ID,
			Name:       r.Name,
			Query:      r.Query,
			VideoCount: int(r.VideoCount),
			CreatedAt:  r.CreatedAt,
		})
	}

	apiResponse(c, gin.H{
		"playlists": items,
	})
}

// GetPlaylist handles GET /api/v1/playlists/:id
// Returns a single playlist with all its videos
func (h *PlaylistHandler) GetPlaylist(c *gin.Context) {
	id := c.Param("id")

	var playlist structs.Playlist
	if err := h.DB.Where("id = ?", id).First(&playlist).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			apiError(c, http.StatusNotFound, "Playlist not found", "NOT_FOUND")
			return
		}
		apiServerError(c, err)
		return
	}

	var videos []structs.PlaylistVideo
	if err := h.DB.Where("playlist_id = ?", playlist.ID).Order("position asc").Find(&videos).Error; err != nil {
		apiServerError(c, err)
		return
	}

	apiResponse(c, gin.H{
		"id":        playlist.ID,
		"name":      playlist.Name,
		"query":     playlist.Query,
		"videos":    videos,
		"createdAt": playlist.CreatedAt,
	})
}

// DeletePlaylist handles DELETE /api/v1/playlists/:id
func (h *PlaylistHandler) DeletePlaylist(c *gin.Context) {
	id := c.Param("id")

	result := h.DB.Where("id = ?", id).Delete(&structs.Playlist{})
	if result.Error != nil {
		apiServerError(c, result.Error)
		return
	}
	if result.RowsAffected == 0 {
		apiError(c, http.StatusNotFound, "Playlist not found", "NOT_FOUND")
		return
	}

	apiResponse(c, gin.H{"deleted": true})
}

// generatePlaylistHash creates a deterministic hash from the query + video IDs
func generatePlaylistHash(query string, videos []structs.YouTubeVideo) string {
	// Collect all video IDs
	ids := make([]string, len(videos))
	for i, v := range videos {
		ids[i] = v.ID
	}

	hash := sha256.Sum256([]byte(fmt.Sprintf("%s:%v", query, ids)))
	return fmt.Sprintf("%x", hash[:8]) // 16 chars, enough for uniqueness
}
