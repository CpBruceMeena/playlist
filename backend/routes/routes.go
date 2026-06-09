package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"playlist-backend/clients"
	"playlist-backend/handlers"
	"playlist-backend/services"
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
	downloadHandler := handlers.NewDownloadHandler()

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
		v1.DELETE("/merged/:id", mergeHandler.DeleteMergedVideo)
		v1.GET("/merged/:filename", mergeHandler.ServeMergedFile)

		// Video download (proxies to Python merge server on port 5002)
		v1.POST("/downloads", downloadHandler.StartDownload)
		v1.GET("/downloads", downloadHandler.ListDownloads)
		v1.DELETE("/downloads/:id", downloadHandler.DeleteDownload)
		v1.GET("/downloads/:filename", downloadHandler.ServeDownloadFile)

	}
}
