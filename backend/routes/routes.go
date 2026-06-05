package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/clients"
	"playlist-backend/handlers"
	"playlist-backend/middleware"
	"playlist-backend/services"
	"time"
)

// SetupRoutes configures all API routes
func SetupRoutes(r *gin.Engine, db *gorm.DB, ytClient *clients.YouTubeClient, cacheSvc *services.CacheService) {
	// Initialize services
	filterService := services.NewFilterService()

	// Initialize handlers
	healthHandler := handlers.NewHealthHandler(db)
	generateHandler := handlers.NewGenerateHandler(db, ytClient, filterService, cacheSvc)
	singersHandler := handlers.NewSingersHandler(db)
	playlistHandler := handlers.NewPlaylistHandler(db)
	songsHandler := handlers.NewSongsHandler()
	mergeHandler := handlers.NewMergeHandler()

	// Apply rate limiter (10 requests per minute per IP)
	rateLimiter := middleware.NewRateLimiter(10, 1*time.Minute)
	r.Use(rateLimiter.Middleware())

	// Health check (outside v1 for infrastructure probes)
	r.GET("/api/health", healthHandler.Check)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		v1.POST("/generate", generateHandler.Generate)

		// Singer routes
		v1.GET("/singers", singersHandler.ListSingers)

		// Multi-singer generation
		v1.POST("/generate/multi-singer", generateHandler.GenerateMultiSinger)

		// Playlist CRUD
		v1.POST("/playlists", playlistHandler.SavePlaylist)
		v1.GET("/playlists", playlistHandler.ListPlaylists)
		v1.GET("/playlists/:id", playlistHandler.GetPlaylist)
		v1.PATCH("/playlists/:id", playlistHandler.RenamePlaylist)
		v1.DELETE("/playlists/:id", playlistHandler.DeletePlaylist)

		// Saved Songs CRUD
		v1.POST("/songs", songsHandler.SaveSong)
		v1.GET("/songs", songsHandler.ListSongs)
		v1.DELETE("/songs/:id", songsHandler.DeleteSong)

		// Video merge (proxies to Python merge server on port 5002)
		v1.POST("/merge", mergeHandler.Merge)
		v1.GET("/merged", mergeHandler.ListMergedVideos)
		v1.GET("/merged/:filename", mergeHandler.ServeMergedFile)

	}
}
