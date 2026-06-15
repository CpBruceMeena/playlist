package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormLogger "gorm.io/gorm/logger"

	"playlist-backend/clients"
	"playlist-backend/config"
	"playlist-backend/logging"
	"playlist-backend/middleware"
	"playlist-backend/routes"
	"playlist-backend/services"
)

func main() {
	// ── Initialize structured file logging ─────────────────────
	// Log directory: project-root/logs/ (from CWD which should be backend/)
	// Falls back to ./logs if we can't determine the project root.
	cwd, _ := os.Getwd()
	projectRoot := filepath.Dir(cwd) // backend/ → project root
	// If the CWD doesn't contain "backend", use it directly
	if !strings.HasSuffix(cwd, "backend") {
		projectRoot = cwd
	}
	logDir := filepath.Join(projectRoot, "logs")

	if err := logging.Init("playlist-backend", logDir, true); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	logging.RedirectStdLog()
	defer logging.Sync()

	appLog := logging.GetLogger()

	cfg, err := config.Load()
	if err != nil {
		appLog.Error("Failed to load config", "error", err)
		log.Fatalf("Failed to load config: %v", err)
	}

	appLog.Info("Starting server", "port", cfg.Port, "client_url", cfg.ClientURL)

	// Connect to PostgreSQL
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: gormLogger.Default.LogMode(gormLogger.Info),
	})
	if err != nil {
		appLog.Error("Failed to connect to database", "error", err)
		log.Fatalf("Failed to connect to database: %v", err)
	}
	appLog.Info("Database connected")

	// Create tables if they don't exist + run conditional seed logic
	// This replaces AutoMigrate — tables are only created when missing
	if err := services.EnsureTables(db); err != nil {
		appLog.Error("Failed to ensure database tables", "error", err)
		log.Fatalf("Failed to ensure database tables: %v", err)
	}
	appLog.Info("Database tables ensured")

	// Initialize YouTube client
	ytClient := clients.NewYouTubeClient(cfg.YouTubeAPIKey)
	appLog.Info("YouTube client initialized")

	// Initialize cache service for YouTube API response caching
	cacheService := services.NewCacheService(db)
	// Purge expired cache entries on startup
	if err := cacheService.PurgeExpiredCache(); err != nil {
		appLog.Warn("Failed to purge expired cache", "error", err)
	}
	appLog.Info("Cache service initialized")

	// Set up Gin router
	gin.DefaultWriter = logging.MultiWriter()
	r := gin.New()  // Use gin.New() instead of gin.Default() to avoid double logging
	r.Use(gin.Recovery())
	r.Use(middleware.RequestLogger())

	// Apply CORS middleware
	r.Use(middleware.SetupCORS(cfg.ClientURL))

	// Setup routes with all dependencies — pass cache service too
	routes.SetupRoutes(r, db, ytClient, cacheService)

	// Start server
	addr := fmt.Sprintf(":%s", cfg.Port)
	appLog.Info("Server ready", "address", addr)
	if err := r.Run(addr); err != nil {
		appLog.Error("Server failed to start", "error", err)
		log.Fatalf("Failed to start server: %v", err)
	}
}
