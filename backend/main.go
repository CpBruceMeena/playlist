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
	"playlist-backend/structs"
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

	// Auto-migrate GORM models
	if err := db.AutoMigrate(
		&structs.User{},
		&structs.Playlist{},
		&structs.PlaylistVideo{},
		&structs.Singer{},
	); err != nil {
		log.Fatalf("Failed to auto-migrate: %v", err)
	}

	// Seed curated singers into database
	if err := services.SeedSingers(db); err != nil {
		log.Printf("Warning: failed to seed initial singers: %v", err)
	}

	// Initialize YouTube client
	ytClient := clients.NewYouTubeClient(cfg.YouTubeAPIKey)

	// Set up Gin router
	r := gin.Default()

	// Apply CORS middleware
	r.Use(middleware.SetupCORS(cfg.ClientURL))

	// Setup routes with all dependencies
	routes.SetupRoutes(r, db, ytClient)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
