package handlers

import (
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/structs"
)

// SingersHandler handles singer-related API requests
type SingersHandler struct {
	DB *gorm.DB
}

func NewSingersHandler(db *gorm.DB) *SingersHandler {
	return &SingersHandler{DB: db}
}

// ListSingers handles GET /api/v1/singers
// Query params:
//   - genre: filter by genre (optional)
//   - search: search by name (optional, fuzzy)
//   - limit: max results (optional, default 100)
func (h *SingersHandler) ListSingers(c *gin.Context) {
	genre := c.Query("genre")
	search := c.Query("search")
	limitStr := c.DefaultQuery("limit", "200")

	limit := 100
	if n, err := parseInt(limitStr); err == nil && n > 0 && n <= 200 {
		limit = n
	}

	query := h.DB.Model(&structs.Singer{}).Where("is_active = ?", true)

	if genre != "" {
		query = query.Where("genre = ?", genre)
	}

	if search != "" {
		searchTerm := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ?", searchTerm)
	}

	// Get all distinct genres for the filter
	var genres []string
	h.DB.Model(&structs.Singer{}).
		Where("is_active = ?", true).
		Distinct("genre").
		Order("genre ASC").
		Pluck("genre", &genres)

	// Get singers
	var singers []structs.Singer
	if err := query.Order("popularity_score DESC").Limit(limit).Find(&singers).Error; err != nil {
		apiServerError(c, err)
		return
	}

	// Convert to list items
	items := make([]structs.SingerListItem, 0, len(singers))
	for _, s := range singers {
		items = append(items, structs.SingerListItem{
			ID:               s.ID,
			Name:             s.Name,
			Genre:            s.Genre,
			ThumbnailURL:     s.ThumbnailURL,
			YouTubeChannelID: s.YouTubeChannelID,
			PopularityScore:  s.PopularityScore,
		})
	}

	apiResponse(c, structs.SingerResponse{
		Singers: items,
		Genres:  genres,
	})
}

func parseInt(s string) (int, error) {
	var n int
	for _, c := range s {
		if c < '0' || c > '9' {
			return 0, nil
		}
		n = n*10 + int(c-'0')
	}
	return n, nil
}
