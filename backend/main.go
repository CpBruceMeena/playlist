package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"playlist-backend/clients"
	"playlist-backend/config"
	"playlist-backend/middleware"
	"playlist-backend/routes"
	"playlist-backend/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to PostgreSQL
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Create tables if they don't exist + run conditional seed logic
	// This replaces AutoMigrate — tables are only created when missing
	if err := services.EnsureTables(db); err != nil {
		log.Fatalf("Failed to ensure database tables: %v", err)
	}

	// Initialize YouTube client
	ytClient := clients.NewYouTubeClient(cfg.YouTubeAPIKey)

	// Initialize cache service for YouTube API response caching
	cacheService := services.NewCacheService(db)
	// Purge expired cache entries on startup
	if err := cacheService.PurgeExpiredCache(); err != nil {
		log.Printf("Warning: failed to purge expired cache: %v", err)
	}

	// Set up Gin router
	r := gin.Default()

	// Apply CORS middleware
	r.Use(middleware.SetupCORS(cfg.ClientURL))

	// Setup routes with all dependencies — pass cache service too
	routes.SetupRoutes(r, db, ytClient, cacheService)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
